import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import { enqueue } from "@/queues";

export const dynamic = "force-dynamic";

/**
 * Webhook Twilio Voice : reçoit l'appel renvoyé par *61*.
 * Répond un TwiML court (message + raccroché) et déclenche la conversation SMS.
 */

function verifyTwilioSignature(req: NextRequest, url: string, params: Record<string, string>): boolean {
  const token = getConfig().TWILIO_AUTH_TOKEN;
  if (!token) return getConfig().NODE_ENV !== "production"; // dev/test sans token
  const signature = req.headers.get("x-twilio-signature") ?? "";
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", token).update(Buffer.from(data, "utf8")).digest("base64");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

const TWIML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="fr-FR" voice="alice">Bonjour, nous ne pouvons pas répondre pour le moment. Vous allez recevoir un SMS dans quelques secondes pour préparer votre rappel. Merci et à tout de suite.</Say>
  <Hangup/>
</Response>`;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => {
    if (typeof v === "string") params[k] = v;
  });

  const url = `${getConfig().APP_BASE_URL}/api/hooks/voice`;
  if (!verifyTwilioSignature(req, url, params)) {
    logger.warn("voice.invalid_signature");
    return new NextResponse("forbidden", { status: 403 });
  }

  const callerPhone = params["From"];
  const toNumber = params["To"];
  const providerCallId = params["CallSid"];
  if (!callerPhone || !toNumber || !providerCallId) {
    return new NextResponse("bad request", { status: 400 });
  }

  const line = await prisma.phoneLine.findUnique({
    where: { voiceNumber: toNumber },
    include: { account: true },
  });

  // Numéro inconnu ou ligne désactivée : on répond poliment, sans conversation.
  if (!line || !line.active) {
    logger.warn({ toNumber }, "voice.unknown_line");
    return new NextResponse(TWIML, { headers: { "content-type": "text/xml" } });
  }

  // Idempotence : Twilio peut rejouer le webhook.
  const existing = await prisma.callEvent.findUnique({ where: { providerCallId } });
  if (!existing) {
    const lead = await prisma.lead.upsert({
      where: { accountId_phone: { accountId: line.accountId, phone: callerPhone } },
      create: { accountId: line.accountId, phone: callerPhone },
      update: {},
    });

    // Anti-boucle + opt-out : pas de conversation si le lead a dit STOP,
    // ou si l'appelant est le patron lui-même (test raté / renvoi mal configuré → on notifie quand même).
    if (!lead.optedOut) {
      const conversation = await prisma.conversation.create({
        data: {
          leadId: lead.id,
          promptVersion: `qualifier/${getConfig().PROMPT_QUALIFIER_VERSION}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      await prisma.callEvent.create({
        data: {
          conversationId: conversation.id,
          accountId: line.accountId,
          callerPhone,
          providerCallId,
        },
      });
      await enqueue("startConversation", { conversationId: conversation.id });
    } else {
      await prisma.callEvent.create({
        data: { accountId: line.accountId, callerPhone, providerCallId },
      });
    }
  }

  return new NextResponse(TWIML, { headers: { "content-type": "text/xml" } });
}
