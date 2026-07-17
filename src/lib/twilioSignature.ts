import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getConfig } from "@/lib/config";

/**
 * Vérification de signature Twilio (X-Twilio-Signature), partagée entre les
 * webhooks voice et SMS entrants — même algorithme HMAC-SHA1 documenté par
 * Twilio : signature(url + params triés par clé, concaténés "clé+valeur").
 * Sans TWILIO_AUTH_TOKEN configuré (dev/test), on ne bloque pas — même
 * garde-fou que api/hooks/voice.
 */
export function verifyTwilioSignature(req: NextRequest, url: string, params: Record<string, string>): boolean {
  const token = getConfig().TWILIO_AUTH_TOKEN;
  if (!token) return getConfig().NODE_ENV !== "production";
  const signature = req.headers.get("x-twilio-signature") ?? "";
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", token).update(Buffer.from(data, "utf8")).digest("base64");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
