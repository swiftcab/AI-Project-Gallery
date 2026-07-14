import { afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { CHECKOUTABLE_PLANS, getPlan, PLANS } from "@/lib/pricing";
import { setStripeForTests } from "@/lib/stripe";
import { POST as checkoutPost } from "@/app/api/checkout/route";

afterEach(() => {
  vi.unstubAllEnvs();
  setStripeForTests(null);
});

describe("pricing — source de vérité des plans", () => {
  it("expose exactement 3 plans, Pro mis en avant", () => {
    expect(PLANS).toHaveLength(3);
    const highlighted = PLANS.filter((p) => p.highlighted);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].id).toBe("pro");
    expect(highlighted[0].priceLabel).toBe("79 €");
  });

  it("seuls les plans payants sont achetables en ligne", () => {
    expect(CHECKOUTABLE_PLANS.sort()).toEqual(["artisan", "pro"]);
    expect(getPlan("decouverte")?.stripePriceEnvVar).toBeNull();
  });

  it("aucune feature ne promet un prix/délai au client final (règle produit)", () => {
    for (const plan of PLANS) {
      for (const f of plan.features) {
        expect(f.toLowerCase()).not.toMatch(/intervention sous|devis gratuit|nous serons/);
      }
    }
  });
});

function req(body: unknown) {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout", () => {
  it("400 sur un plan inconnu", async () => {
    const res = await checkoutPost(req({ plan: "platine" }) as never);
    expect(res.status).toBe(400);
  });

  it("400 sur le plan gratuit (pas achetable en ligne)", async () => {
    const res = await checkoutPost(req({ plan: "decouverte" }) as never);
    expect(res.status).toBe(400);
  });

  it("503 propre quand Stripe n'est pas configuré (jamais d'erreur brute)", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const res = await checkoutPost(req({ plan: "pro" }) as never);
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("indisponible");
  });

  it("crée la session et renvoie l'URL quand tout est configuré", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
    vi.stubEnv("STRIPE_PRICE_PRO", "price_123");
    const create = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test" });
    setStripeForTests({ checkout: { sessions: { create } } } as unknown as Stripe);

    const res = await checkoutPost(req({ plan: "pro" }) as never);
    expect(res.status).toBe(200);
    expect((await res.json()).url).toContain("checkout.stripe.com");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_123", quantity: 1 }],
        metadata: { plan: "pro" },
      }),
    );
  });

  it("503 propre si Stripe lève une erreur (clé invalide, réseau)", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
    vi.stubEnv("STRIPE_PRICE_ARTISAN", "price_456");
    setStripeForTests({
      checkout: { sessions: { create: vi.fn().mockRejectedValue(new Error("boom")) } },
    } as unknown as Stripe);

    const res = await checkoutPost(req({ plan: "artisan" }) as never);
    expect(res.status).toBe(503);
  });
});

describe("POST /api/hooks/stripe — signature", () => {
  it("503 sans configuration webhook", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const { POST } = await import("@/app/api/hooks/stripe/route");
    const res = await POST(new Request("http://localhost/api/hooks/stripe", { method: "POST", body: "{}" }) as never);
    expect(res.status).toBe(503);
  });

  it("400 sur une signature invalide — le payload n'est jamais traité sans elle", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_dummy");
    setStripeForTests(null); // force la reconstruction avec la clé stubée
    const { POST } = await import("@/app/api/hooks/stripe/route");
    const res = await POST(
      new Request("http://localhost/api/hooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": "t=1,v1=forged" },
        body: JSON.stringify({ type: "checkout.session.completed" }),
      }) as never,
    );
    expect(res.status).toBe(400);
  });
});
