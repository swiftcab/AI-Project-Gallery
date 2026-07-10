import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { getMessaging } from "@/lib/messaging";
import { isOptOut, OPT_OUT_CONFIRMATION } from "@/agent/guardrails";
import { enqueue } from "@/queues";

export const dynamic = "force-dynamic";

/**
 * Webhook SMS entrant (agrégateur). Payload normalisé attendu :
 * { from, to, body } — l'adapter du fournisseur réel (smsmode) mappe son
 * format vers celui-ci via la config du webhook (à figer au spike J1).
 * L'OPT-OUT (STOP) est traité ICI, dans la gateway — jamais délégué au LLM.
 */
const inboundSchema = z.object({
  from: z.string().min(6),
  to: z.string().min(6),
  body: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  let payload: z.infer<typeof inboundSchema>;
  try {
    payload = inboundSchema.parse(await req.json());
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
