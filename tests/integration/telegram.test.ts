/**
 * Bot Telegram admin (docs/agent-operations.md — distinct du bot COO
 * d'Hermes). Nécessite Postgres + Redis (INTEGRATION=1), comme les autres
 * suites d'intégration : la route enqueue réellement (BullMQ/Redis), et
 * jobTelegramCommand lit les compteurs produit (Postgres).
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const RUN = process.env.INTEGRATION === "1";
const d = describe.runIf(RUN);

const SECRET = "test-telegram-secret";
const ADMIN_CHAT = "12345";

async function deps() {
  const { prisma } = await import("@/lib/db");
  const { resetConfigForTests } = await import("@/lib/config");
  const telegramRoute = await import("@/app/api/hooks/telegram/route");
  const jobs = await import("@/queues/jobs");
  return { prisma, resetConfigForTests, telegramRoute, jobs };
}

function updateReq(body: unknown, secret?: string) {
  return new Request("http://localhost/api/hooks/telegram", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(secret !== undefined ? { "x-telegram-bot-api-secret-token": secret } : {}),
    },
    body: JSON.stringify(body),
  });
}

d("Bot Telegram admin", () => {
  let ctx: Awaited<ReturnType<typeof deps>>;

  beforeAll(async () => {
    ctx = await deps();
  });

  beforeEach(() => {
    process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
    process.env.TELEGRAM_ADMIN_CHAT_ID = ADMIN_CHAT;
    ctx.resetConfigForTests();
  });

  afterEach(() => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    delete process.env.TELEGRAM_ADMIN_CHAT_ID;
    ctx.resetConfigForTests();
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    await ctx.prisma.$disconnect();
  });

  it("403 si le secret_token est absent ou incorrect", async () => {
    const res1 = await ctx.telegramRoute.POST(updateReq({}) as never);
    expect(res1.status).toBe(403);

    const res2 = await ctx.telegramRoute.POST(updateReq({}, "mauvais-secret") as never);
    expect(res2.status).toBe(403);
  });

  it("200 silencieux (aucune donnée) si le chat n'est pas le chat admin", async () => {
    const res = await ctx.telegramRoute.POST(
      updateReq({ message: { chat: { id: 999 }, text: "/leads" } }, SECRET) as never,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("200 et ignore silencieusement les updates sans message texte", async () => {
    const res = await ctx.telegramRoute.POST(updateReq({ edited_message: {} }, SECRET) as never);
    expect(res.status).toBe(200);
  });

  it("200 pour le chat admin — la commande est enqueue (traitée ici directement, comme flow.test.ts)", async () => {
    const res = await ctx.telegramRoute.POST(
      updateReq({ message: { chat: { id: Number(ADMIN_CHAT) }, text: "/status" } }, SECRET) as never,
    );
    expect(res.status).toBe(200);
  });

  it("jobTelegramCommand : /status répond avec les compteurs produit", async () => {
    const fetchMock = vi.fn(async (url: string, _init: RequestInit) => {
      expect(url).toContain("api.telegram.org");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
    ctx.resetConfigForTests();

    await ctx.jobs.jobTelegramCommand({ chatId: ADMIN_CHAT, text: "/status" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.chat_id).toBe(ADMIN_CHAT);
    expect(sentBody.text).toContain("Statut Décroché");
    delete process.env.TELEGRAM_BOT_TOKEN;
  });

  it("jobTelegramCommand : commande inconnue répond avec l'aide", async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
    ctx.resetConfigForTests();

    await ctx.jobs.jobTelegramCommand({ chatId: ADMIN_CHAT, text: "/blabla" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.text).toContain("Commandes disponibles");
    delete process.env.TELEGRAM_BOT_TOKEN;
  });
});
