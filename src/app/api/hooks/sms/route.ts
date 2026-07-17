import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getConfig } from "@/lib/config";
import { getMessaging } from "@/lib/messaging";
import { isOptOut, OPT_OUT_CONFIRMATION } from "@/agent/guardrails";
import { enqueue } from "@/queues";
import { verifyTwilioSignature } from "@/lib/twilioSignature";

export const dynamic = "force-dynamic";

/**
 * Webhook SMS entrant. Deux formats acceptés :
 * - JSON générique { from, to, body } — agrégateur type smsmode
 *   (à figer au spike J1, cf. tech-debt.md #7).
 * - form-urlencoded Twilio (From/To/Body + X-Twilio-Signature), normalisé
 *   vers le même schéma avant traitement — la logique métier ci-dessous ne
 *   connaît qu'un seul format, jamais le format fournisseur brut.
 * L'OPT-OUT (STOP) est traité ICI, dans la gateway — jamais délégué au LLM.
 */
const inboundSchema = z.object({
  from: z.string().min(6),
  to: z.string().min(6),
  body: z.string().min(1).max(2000),
});

async function parseTwilioForm(req: NextRequest): Promise<z.infer<typeof inboundSchema> | null> {
  const form = await req.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => {
    if (typeof v === "string") params[k] = v;
  });
  const url = `${getConfig().APP_BASE_URL}/api/hooks/sms`;
  if (!verifyTwilioSignature(req, url, params)) return null;
  const parsed = inboundSchema.safeParse({ from: params.From, to: params.To, body: params.Body });
  return parsed.success ? parsed.data : null;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  let payload: z.infer<typeof inboundSchema>;
  try {
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const parsed = await parseTwilioForm(req);
      if (!parsed) return new NextResponse("forbidden", { status: 403 });
      payload = parsed;
    } else {
      payload = inboundSchema.parse(await req.json());
    }
  } catch {
    return new NextResponse("bad request", { status: 400 });
  }

  const line = await prisma.phoneLine.findUnique({
    where: { smsNumber: payload.to },
    include: { account: true },
  });
  if (!line) {
    logger.warn("sms.unknown_line");
    return NextResponse.json({ ok: true }); // 200 pour éviter les retries du fournisseur
  }

  const lead = await prisma.lead.findUnique({
    where: { accountId_phone: { accountId: line.accountId, phone: payload.from } },
    include: {
      conversations: {
        where: { state: { in: ["GREETING", "QUALIFYING", "CONFIRMING"] } },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!lead) {
    logger.info("sms.no_lead"); // SMS spontané sans appel manqué : ignoré au MVP
    return NextResponse.json({ ok: true });
  }

  // --- OPT-OUT : gateway, déterministe, prioritaire sur tout ---
  if (isOptOut(payload.body)) {
    await prisma.lead.update({ where: { id: lead.id }, data: { optedOut: true } });
    const conv = lead.conversations[0];
    if (conv) {
      await prisma.conversation.update({ where: { id: conv.id }, data: { state: "OPTED_OUT" } });
      await prisma.message.create({
        data: { conversationId: conv.id, direction: "INBOUND", body: payload.body },
      });
    }
    await prisma.auditEvent.create({
      data: { accountId: line.accountId, kind: "optout", payload: { leadId: lead.id } },
    });
    // Une seule confirmation finale, autorisée par la réglementation, puis silence.
    await getMessaging().sendSms({ to: payload.from, from: payload.to, body: OPT_OUT_CONFIRMATION });
    return NextResponse.json({ ok: true });
  }

  if (lead.optedOut) return NextResponse.json({ ok: true }); // silence total post-STOP

  const conv = lead.conversations[0];
  if (!conv) {
    logger.info("sms.no_active_conversation");
    return NextResponse.json({ ok: true });
  }

  const message = await prisma.message.create({
    data: { conversationId: conv.id, direction: "INBOUND", body: payload.body },
  });
  await prisma.conversation.update({ where: { id: conv.id }, data: { lastActivityAt: new Date() } });
  await enqueue("agentTurn", { conversationId: conv.id, inboundMessageId: message.id });

  return NextResponse.json({ ok: true });
}
