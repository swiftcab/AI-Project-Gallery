import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Webhook Stripe — signature vérifiée (constructEvent), aucune confiance au
 * payload sans elle. Conforme à la règle CLAUDE.md #4 : on écrit en base,
 * rien d'autre (pas d'envoi externe ici).
 *
 * Rapprochement paiement → compte : par metadata.accountId si fournie (flux
 * futur), sinon par l'email client (User.email). Sans correspondance, on
 * journalise : l'onboarding reste white-glove (tech-debt #5), le fondateur
 * voit le paiement dans le dashboard Stripe et crée le compte via /ops.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "webhook non configuré" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature") ?? "";
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    logger.warn("stripe.invalid_signature");
    return NextResponse.json({ error: "signature invalide" }, { status: 400 });
  }

  const updateAccount = async (accountId: string | null, email: string | null, status: "ACTIVE" | "PAST_DUE" | "CANCELED") => {
    let account = accountId ? await prisma.account.findUnique({ where: { id: accountId } }) : null;
    if (!account && email) {
      const user = await prisma.user.findUnique({ where: { email }, include: { account: true } });
      account = user?.account ?? null;
    }
    if (!account) {
      logger.info({ event: event.type }, "stripe.no_matching_account"); // onboarding manuel via /ops
      return;
    }
    await prisma.account.update({ where: { id: account.id }, data: { planStatus: status } });
    await prisma.auditEvent.create({
      data: { accountId: account.id, kind: "billing.status", payload: { status, stripeEvent: event.type } },
    });
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      await updateAccount(s.metadata?.accountId ?? s.client_reference_id ?? null, s.customer_details?.email ?? null, "ACTIVE");
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object;
      await updateAccount(null, inv.customer_email ?? null, "PAST_DUE");
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await updateAccount(sub.metadata?.accountId ?? null, null, "CANCELED");
      break;
    }
    default:
      break; // événements non gérés : 200 quand même (sinon Stripe re-livre en boucle)
  }

  return NextResponse.json({ received: true });
}
