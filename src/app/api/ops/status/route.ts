import { NextRequest, NextResponse } from "next/server";
import { requireOpsToken } from "@/lib/opsAuth";
import { getOpsStatus } from "@/lib/ops/status";

export const dynamic = "force-dynamic";

/**
 * Statut opérationnel pour Cowork/Hermes : santé + compteurs produit.
 * GET /api/ops/status  (Authorization: Bearer <OPS_API_TOKEN>)
 * Lecture seule, aucune action déclenchée — safe à appeler aussi souvent que voulu.
 * Logique partagée avec la commande /status du bot Telegram admin, cf. src/lib/ops/status.ts.
 */
export async function GET(req: NextRequest) {
  const denied = requireOpsToken(req);
  if (denied) return denied;

  return NextResponse.json(await getOpsStatus());
}
