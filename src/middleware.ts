import { NextRequest, NextResponse } from "next/server";

/**
 * Protection HTTP Basic du dashboard pour la phase pilotes
 * (cf. docs/tech-debt.md #5 — remplacée par une vraie auth avant l'ouverture self-serve).
 * Les webhooks et le health check ne sont PAS derrière ce mur.
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
  matcher: ["/leads/:path*", "/activation/:path*"],
};
