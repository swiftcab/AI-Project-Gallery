import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOpsToken } from "@/lib/opsAuth";
import { enqueue } from "@/queues";

export const dynamic = "force-dynamic";

/**
 * Déclenche un email transactionnel — protégé comme /api/ops/* (Bearer
 * OPS_API_TOKEN), pas un endpoint public : envoyer un email arbitraire
 * pour n'importe quel destinataire est un vecteur d'abus/spam évident.
 * N'envoie JAMAIS directement (CLAUDE.md §4, "aucun envoi externe dans une
 * route HTTP") — enqueue le job "sendEmail", le worker s'en charge.
 * Le flux normal (email de bienvenue post-onboarding) passe déjà par
 * createSignupAccount → enqueue directement, sans passer par cet endpoint ;
 * celui-ci sert aux déclenchements manuels/agent (ex. renvoyer un email).
 */
const sendEmailInput = z.object({
  to: z.string().email(),
  template: z.literal("welcome"),
  vars: z.object({ companyName: z.string().min(1), ownerFirstName: z.string().min(1) }),
});

export async function POST(req: NextRequest) {
  const denied = requireOpsToken(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "requête invalide" }, { status: 400 });
  }

  const parsed = sendEmailInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 422 });
  }

  await enqueue("sendEmail", parsed.data);
  return NextResponse.json({ ok: true, queued: true });
}
