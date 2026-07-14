import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSignupAccount } from "@/lib/ops/createAccount";
import { createCheckoutSession } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Inscription self-serve : crée le compte (TRIAL, sans ligne téléphonique —
 * provisioning manuel, tech-debt.md #2), puis, si un plan payant a été
 * choisi, enchaîne sur une session Stripe Checkout liée au compte
 * (client_reference_id) pour un rapprochement fiable au webhook.
 * Exception à la règle "pas d'appel externe en route HTTP" (CLAUDE.md #4) :
 * même justification que /api/checkout — session synchrone attendue par l'UI.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "requête invalide" }, { status: 400 });
  }

  let account: { id: string };
  try {
    const result = await createSignupAccount(prisma, body);
    account = result.account;
    logger.info({ accountId: account.id, created: result.created }, "onboarding.account_ready");
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation", issues: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  const plan = (body as { plan?: string }).plan ?? "decouverte";

  // Plan gratuit (ou non reconnu) : pas de paiement, direction la page de bienvenue.
  if (plan === "decouverte") {
    return NextResponse.json({ redirectUrl: "/onboarding/merci" });
  }

  const checkout = await createCheckoutSession(plan, account.id);
  if ("error" in checkout) {
    // Paiement indisponible (Stripe pas encore configuré) : le compte existe
    // quand même en TRIAL, on ne bloque pas l'inscription pour ça.
    logger.warn({ accountId: account.id, error: checkout.error }, "onboarding.checkout_unavailable");
    return NextResponse.json({ redirectUrl: "/onboarding/merci" });
  }
  return NextResponse.json({ redirectUrl: checkout.url });
}
