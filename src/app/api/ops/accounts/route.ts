import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireOpsToken } from "@/lib/opsAuth";
import { createPilotAccount } from "@/lib/ops/createAccount";

export const dynamic = "force-dynamic";

/**
 * Onboarding d'un compte pilote par un agent (Cowork/Hermes).
 * POST /api/ops/accounts  (Authorization: Bearer <OPS_API_TOKEN>)
 *
 * ⚠️ Ne provisionne PAS les numéros Twilio/smsmode (dette tech-debt.md #2) —
 * l'agent doit les avoir provisionnés en amont et les passer en entrée.
 * Volontairement PAS d'endpoint DELETE/update ici : la désactivation d'un
 * compte client reste une action manuelle (cf. docs/automation.md — on
 * n'expose via l'API que ce qui est sûr à automatiser).
 */
export async function POST(req: NextRequest) {
  const denied = requireOpsToken(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  try {
    const account = await createPilotAccount(prisma, body);
    return NextResponse.json(
      {
        accountId: account.id,
        activationCode: `*61*${account.phoneLine?.voiceNumber}#`,
        activationUrl: `${process.env.APP_BASE_URL ?? ""}/activation`,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation", issues: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
