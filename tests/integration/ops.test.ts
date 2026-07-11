/**
 * Tests d'intégration de l'interface agent /api/ops/* (docs/automation.md).
 * Nécessite Postgres (INTEGRATION=1 npm run test:int), comme flow.test.ts.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const RUN = process.env.INTEGRATION === "1";
const d = describe.runIf(RUN);

async function deps() {
  const { prisma } = await import("@/lib/db");
  const statusRoute = await import("@/app/api/ops/status/route");
  const accountsRoute = await import("@/app/api/ops/accounts/route");
  return { prisma, statusRoute, accountsRoute };
}

const TOKEN = "test-ops-token";

d("/api/ops/*", () => {
  let ctx: Awaited<ReturnType<typeof deps>>;

  beforeAll(async () => {
    process.env.OPS_API_TOKEN = TOKEN;
    ctx = await deps();
    await ctx.prisma.auditEvent.deleteMany({});
    await ctx.prisma.qualification.deleteMany({});
    await ctx.prisma.message.deleteMany({});
    await ctx.prisma.callEvent.deleteMany({});
    await ctx.prisma.conversation.deleteMany({});
    await ctx.prisma.lead.deleteMany({});
    await ctx.prisma.phoneLine.deleteMany({});
    await ctx.prisma.user.deleteMany({});
    await ctx.prisma.account.deleteMany({});
  });

  afterAll(async () => {
    await ctx.prisma.$disconnect();
  });

  it("GET /api/ops/status refuse sans token", async () => {
    const req = new Request("http://localhost/api/ops/status");
    const res = await ctx.statusRoute.GET(req as never);
    expect(res.status).toBe(401);
  });

  it("GET /api/ops/status refuse avec un mauvais token", async () => {
    const req = new Request("http://localhost/api/ops/status", {
      headers: { authorization: "Bearer nope" },
    });
    const res = await ctx.statusRoute.GET(req as never);
    expect(res.status).toBe(401);
  });

  it("GET /api/ops/status répond avec le bon token", async () => {
    const req = new Request("http://localhost/api/ops/status", {
      headers: { authorization: `Bearer ${TOKEN}` },
    });
    const res = await ctx.statusRoute.GET(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.accounts).toBe(0);
  });

  it("POST /api/ops/accounts crée un compte et retourne le code d'activation", async () => {
    const req = new Request("http://localhost/api/ops/accounts", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({
        companyName: "Plomberie Test Ops",
        trade: "PLOMBIER",
        ownerFirstName: "Karim",
        ownerMobile: "+33600000001",
        voiceNumber: "+33900000010",
        smsNumber: "+33700000010",
        email: "ops-test@example.fr",
        departments: ["69"],
      }),
    });
    const res = await ctx.accountsRoute.POST(req as never);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.activationCode).toBe("*61*+33900000010#");

    const status = await ctx.statusRoute.GET(
      new Request("http://localhost/api/ops/status", { headers: { authorization: `Bearer ${TOKEN}` } }) as never,
    );
    expect((await status.json()).accounts).toBe(1);
  });

  it("POST /api/ops/accounts rejette un payload invalide (422)", async () => {
    const req = new Request("http://localhost/api/ops/accounts", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ companyName: "Incomplet" }),
    });
    const res = await ctx.accountsRoute.POST(req as never);
    expect(res.status).toBe(422);
  });
});
