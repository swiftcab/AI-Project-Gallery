import Stripe from "stripe";

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
