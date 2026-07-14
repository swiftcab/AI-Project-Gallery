/**
 * Flux d'inscription self-serve (docs/testing-strategy.md, niveau 2).
 * Nécessite Postgres (INTEGRATION=1 npm run test:int), comme les autres
 * suites d'intégration.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const RUN = process.env.INTEGRATION === "1";
const d = describe.runIf(RUN);

async function deps() {
  const { prisma } = await import("@/lib/db");
  const { setStripeForTests } = await import("@/lib/stripe");
  const onboardingRoute = await import("@/app/api/onboarding/route");
  return { prisma, setStripeForTests, onboardingRoute };
}

function req(body: unknown) {
  return new Request("http://localhost/api/onboarding", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

d("POST /api/onboarding", () => {
  let ctx: Awaited<ReturnType<typeof deps>>;

  beforeAll(async () => {
    ctx = await deps();
  });

  afterEach(async () => {
    // Nettoie compte + utilisateur (pas de cascade delete configuré côté
    // schéma — un compte orphelin fausserait le comptage global de
    // tests/integration/ops.test.ts s'il tourne sur la même base).
    await ctx.prisma.user.deleteMany({ where: { email: { contains: "@onboarding-test.example" } } });
    await ctx.prisma.account.deleteMany({ where: { companyName: "Plomberie Test Onboarding" } });
    ctx.setStripeForTests(null);
  });

  afterAll(async () => {
    await ctx.prisma.$disconnect();
  });

  const validBody = {
    companyName: "Plomberie Test Onboarding",
    trade: "PLOMBIER",
    ownerFirstName: "Karim",
    ownerMobile: "+33612345678",
    email: "karim@onboarding-test.example",
    departments: ["69", "01"],
    plan: "decouverte",
  };

  it("crée un compte TRIAL sans ligne téléphonique et redirige vers la page de bienvenue (plan gratuit)", async () => {
    const res = await ctx.onboardingRoute.POST(req(validBody) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirectUrl).toBe("/onboarding/merci");

    const user = await ctx.prisma.user.findUniqueOrThrow({
      where: { email: validBody.email },
      include: { account: { include: { phoneLine: true } } },
    });
    expect(user.account.planStatus).toBe("TRIAL");
    expect(user.account.phoneLine).toBeNull();
    expect(user.account.departments).toEqual(["69", "01"]);
  });

  it("422 sur un payload invalide", async () => {
    const res = await ctx.onboardingRoute.POST(req({ companyName: "" }) as never);
    expect(res.status).toBe(422);
  });

  it("idempotent : un second essai avec le même email renvoie le compte existant, pas d'erreur", async () => {
    await ctx.onboardingRoute.POST(req(validBody) as never);
    const res2 = await ctx.onboardingRoute.POST(req(validBody) as never);
    expect(res2.status).toBe(200);
    const count = await ctx.prisma.user.count({ where: { email: validBody.email } });
    expect(count).toBe(1);
  });

  it("plan payant sans Stripe configuré : compte créé quand même, retombe sur la page de bienvenue", async () => {
    const res = await ctx.onboardingRoute.POST(req({ ...validBody, email: "pro@onboarding-test.example", plan: "pro" }) as never);
    expect(res.status).toBe(200);
    expect((await res.json()).redirectUrl).toBe("/onboarding/merci");
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email: "pro@onboarding-test.example" } });
    expect(user).toBeTruthy();
  });

  it("plan payant avec Stripe configuré : redirige vers Checkout avec client_reference_id = accountId", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_PRICE_PRO = "price_123";
    let capturedArgs: unknown;
    ctx.setStripeForTests({
      checkout: {
        sessions: {
          create: async (args: unknown) => {
            capturedArgs = args;
            return { url: "https://checkout.stripe.com/c/pay/cs_test_onboarding" };
          },
        },
      },
    } as never);

    const res = await ctx.onboardingRoute.POST(
      req({ ...validBody, email: "artisan-pro@onboarding-test.example", plan: "pro" }) as never,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirectUrl).toContain("checkout.stripe.com");

    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email: "artisan-pro@onboarding-test.example" } });
    expect((capturedArgs as { client_reference_id?: string }).client_reference_id).toBe(user.accountId);

    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_PRO;
  });
});
