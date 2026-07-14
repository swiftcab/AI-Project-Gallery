import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { getPlan } from "@/lib/pricing";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Crée une session Stripe Checkout pour un plan payant.
 * Exception documentée à la règle CLAUDE.md #4 (pas d'appel externe en route
 * HTTP) : une session Checkout est nécessairement synchrone — l'utilisateur
 * attend l'URL de redirection. Aucun autre appel externe ici.
 */
const bodySchema = z.object({ plan: z.string() });

export async function POST(req: NextRequest) {
  let plan;
  try {
    const body = bodySchema.parse(await req.json());
    plan = getPlan(body.plan);
  } catch {
    return NextResponse.json({ error: "requête invalide" }, { status: 400 });
  }
  if (!plan || !plan.stripePriceEnvVar) {
    return NextResponse.json({ error: "plan inconnu ou non achetable en ligne" }, { status: 400 });
  }

  const stripe = getStripe();
  const priceId = process.env[plan.stripePriceEnvVar] ?? "";
  if (!stripe || !priceId) {
    // Paiement pas encore configuré (clé ou price ID manquant) — la landing
    // retombe sur le CTA essai. Jamais d'erreur brute côté prospect.
    return NextResponse.json({ error: "paiement indisponible pour le moment" }, { status: 503 });
  }

  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/#tarif`,
      allow_promotion_codes: true,
      subscription_data: { metadata: { plan: plan.id } },
      metadata: { plan: plan.id },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    logger.error({ err: String(err), plan: plan.id }, "checkout.create_failed");
    return NextResponse.json({ error: "paiement indisponible pour le moment" }, { status: 503 });
  }
}
