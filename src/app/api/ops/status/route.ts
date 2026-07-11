import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOpsToken } from "@/lib/opsAuth";

export const dynamic = "force-dynamic";

/**
 * Statut opérationnel pour Cowork/Hermes : santé + compteurs produit.
 * GET /api/ops/status  (Authorization: Bearer <OPS_API_TOKEN>)
 * Lecture seule, aucune action déclenchée — safe à appeler aussi souvent que voulu.
 */
export async function GET(req: NextRequest) {
  const denied = requireOpsToken(req);
  if (denied) return denied;

  const since24h = new Date(Date.now() - 24 * 3600 * 1000);
  const [accounts, leadsToday, qualifiedToday, guardrailBlocks24h, urgentOpen] = await Promise.all([
    prisma.account.count(),
    prisma.lead.count({ where: { createdAt: { gte: since24h } } }),
    prisma.lead.count({ where: { createdAt: { gte: since24h }, status: "QUALIFIED" } }),
    prisma.auditEvent.count({ where: { kind: "guardrail.blocked", createdAt: { gte: since24h } } }),
    prisma.qualification.count({
      where: { urgency: "HIGH", conversation: { state: { in: ["DONE", "CONFIRMING"] } } },
    }),
  ]);

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    accounts,
    last24h: { leads: leadsToday, qualified: qualifiedToday, guardrailBlocks: guardrailBlocks24h },
    urgentOpen,
  });
}
