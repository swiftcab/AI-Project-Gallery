/**
 * Tests d'intégration des flux critiques (PRD Phase 3) :
 *   appel manqué → greeting SMS → réponse prospect → tour d'agent → qualification → notif patron
 *   + opt-out STOP au niveau gateway.
 *
 * Nécessite Postgres + Redis (docker compose up postgres redis) et INTEGRATION=1.
 * En CI : services GitHub Actions. En local sans services : suite ignorée.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const RUN = process.env.INTEGRATION === "1";
const d = describe.runIf(RUN);

// Imports dynamiques pour ne rien connecter quand la suite est ignorée.
async function deps() {
  const { prisma } = await import("@/lib/db");
  const { setLLMForTests } = await import("@/lib/llm");
  const { FakeLLMProvider } = await import("@/lib/llm/fake");
  const { setMessagingForTests } = await import("@/lib/messaging");
  const { FakeMessagingProvider } = await import("@/lib/messaging/fake");
  const jobs = await import("@/queues/jobs");
  const smsRoute = await import("@/app/api/hooks/sms/route");
  const voiceRoute = await import("@/app/api/hooks/voice/route");
  return { prisma, setLLMForTests, FakeLLMProvider, setMessagingForTests, FakeMessagingProvider, jobs, smsRoute, voiceRoute };
}

d("flux critique appel manqué → lead qualifié", () => {
  let ctx: Awaited<ReturnType<typeof deps>>;
  let messaging: InstanceType<Awaited<ReturnType<typeof deps>>["FakeMessagingProvider"]>;
  let llm: InstanceType<Awaited<ReturnType<typeof deps>>["FakeLLMProvider"]>;
  let accountId: string;

  const VOICE = "+33900000001";
  const SMS = "+33700000001";
  const CALLER = "+33612345678";
  const OWNER = "+33698765432";

  beforeAll(async () => {
    ctx = await deps();
    messaging = new ctx.FakeMessagingProvider();
    llm = new ctx.FakeLLMProvider();
    ctx.setMessagingForTests(messaging);
    ctx.setLLMForTests(llm);

    // reset données de test
    await ctx.prisma.auditEvent.deleteMany({});
    await ctx.prisma.qualification.deleteMany({});
    await ctx.prisma.message.deleteMany({});
    await ctx.prisma.callEvent.deleteMany({});
    await ctx.prisma.conversation.deleteMany({});
    await ctx.prisma.lead.deleteMany({});
    await ctx.prisma.phoneLine.deleteMany({});
    await ctx.prisma.user.deleteMany({});
    await ctx.prisma.account.deleteMany({});

    const account = await ctx.prisma.account.create({
      data: {
        companyName: "Plomberie Test",
        trade: "PLOMBIER",
        ownerFirstName: "Karim",
        ownerMobile: OWNER,
        departments: ["69"],
        quietHoursStart: 0,
        quietHoursEnd: 0, // plage silence désactivée pour le test
        phoneLine: { create: { voiceNumber: VOICE, smsNumber: SMS } },
      },
    });
    accountId = account.id;
  });

  afterAll(async () => {
    ctx.setMessagingForTests(null);
    ctx.setLLMForTests(null);
    await ctx.prisma.$disconnect();
  });

  it("webhook voix : crée lead + conversation + call event idempotent, répond du TwiML", async () => {
    const form = new FormData();
    form.set("From", CALLER);
    form.set("To", VOICE);
    form.set("CallSid", "CA-test-1");
    const req = new Request("http://localhost/api/hooks/voice", { method: "POST", body: form });

    const res = await ctx.voiceRoute.POST(req as never);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("<Say");

    // rejouer le webhook ne duplique rien
    const form2 = new FormData();
    form2.set("From", CALLER);
    form2.set("To", VOICE);
    form2.set("CallSid", "CA-test-1");
    await ctx.voiceRoute.POST(new Request("http://localhost/api/hooks/voice", { method: "POST", body: form2 }) as never);

    expect(await ctx.prisma.callEvent.count()).toBe(1);
    expect(await ctx.prisma.conversation.count()).toBe(1);
    const lead = await ctx.prisma.lead.findUniqueOrThrow({
      where: { accountId_phone: { accountId, phone: CALLER } },
    });
    expect(lead.status).toBe("NEW");
  });

  it("startConversation : envoie le greeting et passe en QUALIFYING", async () => {
    const conv = await ctx.prisma.conversation.findFirstOrThrow();
    await ctx.jobs.jobStartConversation({ conversationId: conv.id });
    const sms = messaging.sent.at(-1)!;
    expect(sms.to).toBe(CALLER);
    expect(sms.body).toContain("Plomberie Test");
    expect(sms.body).toContain("STOP");
    const updated = await ctx.prisma.conversation.findUniqueOrThrow({ where: { id: conv.id } });
    expect(updated.state).toBe("QUALIFYING");
  });

  it("réponse prospect → tour d'agent → qualification écrite + notif patron sur DONE", async () => {
    const conv = await ctx.prisma.conversation.findFirstOrThrow();

    // Le prospect répond via le webhook SMS
    const req = new Request("http://localhost/api/hooks/sms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ from: CALLER, to: SMS, body: "Fuite sous l'évier, 69003, rappel avant 9h. Sophie." }),
    });
    const res = await ctx.smsRoute.POST(req as never);
    expect(res.status).toBe(200);
    const inbound = await ctx.prisma.message.findFirstOrThrow({ where: { direction: "INBOUND" } });

    llm.enqueueJSON({
      reply: "C'est noté Sophie : fuite sous l'évier (69003), rappel avant 9h. Karim vous rappelle.",
      extracted: {
        tradeNeeded: "PLOMBIER",
        urgency: "HIGH",
        postalCode: "69003",
        description: "fuite sous évier cuisine",
        callbackWindow: "avant 9h",
        firstName: "Sophie",
      },
      stateSuggestion: "CONFIRMING",
    });
    await ctx.jobs.jobAgentTurn({ conversationId: conv.id, inboundMessageId: inbound.id });

    const qual = await ctx.prisma.qualification.findUniqueOrThrow({ where: { conversationId: conv.id } });
    expect(qual.urgency).toBe("HIGH");
    expect(qual.postalCode).toBe("69003");
    expect(qual.inScopeGeo).toBe(true);
    const lead = await ctx.prisma.lead.findUniqueOrThrow({
      where: { accountId_phone: { accountId, phone: CALLER } },
    });
    expect(lead.status).toBe("QUALIFIED");
    expect(lead.firstName).toBe("Sophie");

    // Notification patron (résumé LLM en échec → repli déterministe, toujours notifié)
    llm.enqueue(new Error("summarizer down"));
    await ctx.jobs.jobNotifyOwner({ conversationId: conv.id });
    const notif = messaging.sent.at(-1)!;
    expect(notif.to).toBe(OWNER);
    expect(notif.body).toContain("URGENT");
    expect(notif.body).toContain(CALLER);
  });

  it("STOP : opt-out gateway, confirmation unique, plus jamais de SMS", async () => {
    const req = new Request("http://localhost/api/hooks/sms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ from: CALLER, to: SMS, body: "STOP" }),
    });
    await ctx.smsRoute.POST(req as never);

    const lead = await ctx.prisma.lead.findUniqueOrThrow({
      where: { accountId_phone: { accountId, phone: CALLER } },
    });
    expect(lead.optedOut).toBe(true);
    const confirmation = messaging.sent.at(-1)!;
    expect(confirmation.body.toLowerCase()).toContain("plus de messages");

    // tout envoi ultérieur vers ce lead est bloqué par le dernier rempart
    const sentBefore = messaging.sent.length;
    const conv = await ctx.prisma.conversation.findFirstOrThrow();
    await ctx.jobs.jobNudge({ conversationId: conv.id });
    expect(messaging.sent.length).toBe(sentBefore);
  });
});
