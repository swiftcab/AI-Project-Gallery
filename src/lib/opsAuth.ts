import { NextRequest, NextResponse } from "next/server";

/**
 * Auth Bearer pour /api/ops/* — distincte du Basic Auth du dashboard humain
 * (src/middleware.ts). Token unique côté agent (Cowork/Hermes), à faire
 * tourner (rotation manuelle) si compromis — cf. docs/automation.md.
 */
export function requireOpsToken(req: NextRequest): NextResponse | null {
  const expected = process.env.OPS_API_TOKEN ?? "";
  if (!expected) {
    return NextResponse.json({ error: "OPS_API_TOKEN non configuré côté serveur" }, { status: 503 });
  }
  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null; // null = autorisé, continuer
}
