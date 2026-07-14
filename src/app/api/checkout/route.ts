import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Crée une session Stripe Checkout pour un plan payant (bouton landing,
 * pas de compte préalable — cf. /api/onboarding pour le flux avec compte).
 * Exception documentée à la règle CLAUDE.md #4 (pas d'appel externe en route
 * HTTP) : une session Checkout est nécessairement synchrone — l'utilisateur
 * attend l'URL de redirection.
 */
const bodySchema = z.object({ plan: z.string() });

export async function POST(req: NextRequest) {
  let plan: string;
  try {
    plan = bodySchema.parse(await req.json()).plan;
  } catch {
    return NextResponse.json({ error: "requête invalide" }, { status: 400 });
  }

  const result = await createCheckoutSession(plan);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ url: result.url });
}
