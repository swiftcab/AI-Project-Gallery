import { NextRequest, NextResponse } from "next/server";

/**
 * Deux murs distincts :
 * - HTTP Basic pour le dashboard humain (/leads, /activation, /ops) —
 *   cf. docs/tech-debt.md #5, remplacé par une vraie auth avant self-serve.
 * - Bearer token pour /api/ops/* (agents Cowork/Hermes) — vérifié dans
 *   chaque route via src/lib/opsAuth.ts, PAS ici (le matcher exclut /api/ops
 *   pour ne pas superposer les deux mécanismes sur les mêmes requêtes).
 * Les webhooks et /api/health restent hors de tout mur.
 */
export function middleware(req: NextRequest) {
  const user = process.env.DASHBOARD_USER ?? "admin";
  const pass = process.env.DASHBOARD_PASS ?? "";
  if (!pass) return NextResponse.next(); // dev sans mot de passe

  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    const [u, p] = Buffer.from(encoded, "base64").toString().split(":");
    if (u === user && p === pass) return NextResponse.next();
  }
  return new NextResponse("Authentification requise", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Decroche"' },
  });
}

export const config = {
  matcher: ["/leads/:path*", "/activation/:path*", "/ops/:path*"],
};
