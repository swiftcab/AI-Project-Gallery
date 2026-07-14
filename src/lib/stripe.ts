import Stripe from "stripe";
import { getPlan, type PlanId } from "./pricing";

/**
 * Client Stripe lazy + injectable pour les tests (même pattern que
 * getLLM/getMessaging). La clé vit dans STRIPE_SECRET_KEY (.env du VPS,
 * jamais dans le repo — cf. HERMES.md "RÈGLE SECRETS").
 */
let instance: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) return null; // paiement pas encore activé — les routes répondent 503 proprement
  if (!instance) instance = new Stripe(key);
  return instance;
}

export function setStripeForTests(stripe: Stripe | null): void {
  instance = stripe;
}

export type CheckoutResult = { url: string } | { error: string; status: 400 | 503 };

/**
 * Logique de création de session partagée entre /api/checkout (bouton
 * landing, anonyme) et /api/onboarding (compte déjà créé → accountId connu).
 * accountId, quand fourni, va en client_reference_id : c'est ce qui permet
 * au webhook de rapprocher le paiement au compte sans dépendre de l'email
 * (tech-debt.md #10).
 */
export async function createCheckoutSession(planId: string, accountId?: string): Promise<CheckoutResult> {
  const plan = getPlan(planId);
  if (!plan || !plan.stripePriceEnvVar) {
    return { error: "plan inconnu ou non achetable en ligne", status: 400 };
  }

  const stripe = getStripe();
  const priceId = process.env[plan.stripePriceEnvVar] ?? "";
  if (!stripe || !priceId) {
    return { error: "paiement indisponible pour le moment", status: 503 };
  }

  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/#tarif`,
      allow_promotion_codes: true,
      client_reference_id: accountId,
      subscription_data: { metadata: accountId ? { plan: plan.id, accountId } : { plan: plan.id } },
      metadata: accountId ? { plan: plan.id, accountId } : { plan: plan.id },
    });
    if (!session.url) return { error: "paiement indisponible pour le moment", status: 503 };
    return { url: session.url };
  } catch {
    return { error: "paiement indisponible pour le moment", status: 503 };
  }
}

export type { PlanId };
