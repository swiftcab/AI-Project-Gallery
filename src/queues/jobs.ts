import { prisma } from "@/lib/db";
import { convLogger, logger } from "@/lib/logger";
import { getLLM } from "@/lib/llm";
import { getMessaging } from "@/lib/messaging";
import { getEmail } from "@/lib/email";
import { renderTemplate } from "@/lib/email/templates";
import { formatLeadsMessage, formatStatusMessage, sendTelegramMessage, TELEGRAM_HELP_TEXT } from "@/lib/telegram";
import { getOpsStatus, getRecentQualifiedLeads } from "@/lib/ops/status";
import { canSendProactive, delayUntilNextWindow, withinQuietHours } from "@/lib/sendWindow";
import { greetingSms, renderSystemPrompt, type PromptContext } from "@/agent/prompts";
import { fallbackOwnerSummary, runAgentTurn } from "@/agent/qualifier";
import { agentTurnOutputSchema } from "@/agent/schema";
import { enqueue, type JobPayloads } from "./index";
import { z } from "zod";

const NUDGE_DELAY_MS = 25 * 60 * 1000;
const EXPIRE_DELAY_MS = 24 * 60 * 60 * 1000;

async function loadConversation(conversationId: string) {
  return prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: {
      lead: { include: { account: { include: { phoneLine: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

function promptContext(account: {
  companyName: string;
  ownerFirstName: string;
  trade: string;
  departments: string[];
}): PromptContext {
  return {
    companyName: account.companyName,
    ownerFirstName: account.ownerFirstName,
    trade: account.trade,
    departments: account.departments,
  };
}

/** Envoi d'un SMS au prospect avec le dernier rempart opt-out. */
async function sendToLead(conv: Awaited<ReturnType<typeof loadConversation>>, body: string, llmRaw?: unknown) {
  if (conv.lead.optedOut) {
    logger.warn({ conversationId: conv.id }, "send.blocked_optout");
    return;
  }
  const line = conv.lead.account.phoneLine;
  if (!line) throw new Error(`Compte ${conv.lead.accountId} sans PhoneLine`);
  const { providerId } = await getMessaging().sendSms({
    to: conv.lead.phone,
    from: line.smsNumber,
    body,
  });
  await prisma.message.create({
    data: {
      conversationId: conv.id,
      direction: "OUTBOUND",
      body,
      providerId,
      llmRaw: llmRaw === undefined ? undefined : JSON.parse(JSON.stringify(llmRaw)),
    },
  });
}

/** Job: premier SMS après l'appel manqué + planification nudge/expire. */
export async function jobStartConversation({ conversationId }: JobPayloads["startConversation"]) {
  const conv = await loadConversation(conversationId);
  if (conv.state !== "GREETING") return; // idempotence retry
  const log = convLogger(conversationId);

  await sendToLead(conv, greetingSms(promptContext(conv.lead.account)));
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { state: "QUALIFYING", lastActivityAt: new Date() },
  });
  await enqueue("nudge", { conversationId }, { delayMs: NUDGE_DELAY_MS, jobId: `nudge-${conversationId}` });
  await enqueue(
    "expireConversation",
    { conversationId },
    { delayMs: EXPIRE_DELAY_MS, jobId: `expire-${conversationId}` },
  );
  log.info("conversation.greeting_sent");
}

/** Job: un tour d'agent sur un message entrant. */
export async function jobAgentTurn({ conversationId, inboundMessageId }: JobPayloads["agentTurn"]) {
  const conv = await loadConversation(conversationId);
  const log = convLogger(conversationId);
  if (["DONE", "OPTED_OUT", "EXPIRED", "FAILED"].includes(conv.state)) return;

  const inbound = conv.messages.find((m) => m.id === inboundMessageId);
  if (!inbound) throw new Error(`Message entrant ${inboundMessageId} introuvable`);

  const history = conv.messages
    .filter((m) => m.id !== inboundMessageId && m.channel === "SMS")
    .map((m) => ({ direction: m.direction, body: m.body }));

  const result = await runAgentTurn(getLLM(), {
    conversationId,
    state: conv.state as never,
    turnCount: conv.turnCount,
    promptVersion: conv.promptVersion.replace(/^qualifier\//, ""),
    context: promptContext(conv.lead.account),
    history,
    inbound: inbound.body,
  });

  if (result.guardrailBlocked.length > 0) {
    await prisma.auditEvent.create({
      data: {
        accountId: conv.lead.accountId,
        kind: "guardrail.blocked",
        payload: { conversationId, violations: result.guardrailBlocked as never },
      },
    });
  }

  await sendToLead(conv, result.reply, result.llmRaw ? { raw: result.llmRaw } : undefined);

  const finalize = result.nextState === "DONE" || result.nextState === "CONFIRMING";
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { state: result.nextState, turnCount: { increment: 1 }, lastActivityAt: new Date() },
  });

  // La qualification est écrite/mise à jour à chaque tour (fiche toujours à jour)
  if (result.output) {
    const e = result.output.extracted;
    const account = conv.lead.account;
    const inScopeGeo =
      e.postalCode && account.departments.length > 0
        ? account.departments.includes(e.postalCode.slice(0, 2))
        : null;
    await prisma.qualification.upsert({
      where: { conversationId },
      create: {
        conversationId,
        tradeNeeded: e.tradeNeeded ?? null,
        urgency: e.urgency,
        postalCode: e.postalCode ?? null,
        description: e.description ?? "",
        ownerSummary: fallbackOwnerSummary({ phone: conv.lead.phone, extracted: e }),
        callbackWindow: e.callbackWindow ?? null,
        inScopeGeo,
        raw: result.output as never,
      },
      update: {
        tradeNeeded: e.tradeNeeded ?? undefined,
        urgency: e.urgency,
        postalCode: e.postalCode ?? undefined,
        description: e.description ?? undefined,
        ownerSummary: fallbackOwnerSummary({ phone: conv.lead.phone, extracted: e }),
        callbackWindow: e.callbackWindow ?? undefined,
        inScopeGeo,
        raw: result.output as never,
      },
    });
    if (e.firstName && !conv.lead.firstName) {
      await prisma.lead.update({ where: { id: conv.leadId }, data: { firstName: e.firstName } });
    }
  }

  if (finalize) {
    await prisma.lead.update({ where: { id: conv.leadId }, data: { status: "QUALIFIED" } });
    await enqueue("notifyOwner", { conversationId }, { jobId: `notify-${conversationId}` });
  }
  log.info({ nextState: result.nextState }, "conversation.turn_done");
}

/** Job: relance douce unique après 25 min de silence, dans la fenêtre légale. */
export async function jobNudge({ conversationId }: JobPayloads["nudge"]) {
  const conv = await loadConversation(conversationId);
  if (conv.state !== "QUALIFYING") return;
  const hasInbound = conv.messages.some((m) => m.direction === "INBOUND");
  if (hasInbound) return; // le prospect a répondu, pas de relance

  if (!canSendProactive()) {
    // replanifie dans la prochaine fenêtre légale (8h-21h, hors dim./fériés)
    await enqueue("nudge", { conversationId }, { delayMs: delayUntilNextWindow(), jobId: `nudge2-${conversationId}` });
    return;
  }
  await sendToLead(
    conv,
    `Bonjour, c'est encore l'assistant de ${conv.lead.account.companyName}. ` +
      `Un simple mot sur votre besoin suffit pour que l'on vous rappelle efficacement. ` +
      `(STOP pour ne plus recevoir de messages)`,
  );
  convLogger(conversationId).info("conversation.nudge_sent");
}

/** Job: expiration à 24h — fiche partielle quand même notifiée. */
export async function jobExpireConversation({ conversationId }: JobPayloads["expireConversation"]) {
  const conv = await loadConversation(conversationId);
  if (["DONE", "OPTED_OUT", "EXPIRED", "FAILED"].includes(conv.state)) return;
  await prisma.conversation.update({ where: { id: conversationId }, data: { state: "EXPIRED" } });
  await enqueue("notifyOwner", { conversationId }, { jobId: `notify-${conversationId}` });
  convLogger(conversationId).info("conversation.expired");
}

const summarizerOutput = z.object({ summary: z.string().min(1).max(300) });

/** Job: notification patron (SMS) — résumé LLM avec repli déterministe. */
export async function jobNotifyOwner({ conversationId }: JobPayloads["notifyOwner"]) {
  const conv = await loadConversation(conversationId);
  const account = conv.lead.account;
  const qual = await prisma.qualification.findUnique({ where: { conversationId } });
  const log = convLogger(conversationId);

  let summary =
    qual?.ownerSummary ??
    fallbackOwnerSummary({ phone: conv.lead.phone, extracted: null });

  // Tentative de résumé "langage patron" par LLM (différenciateur produit) — best effort
  if (qual?.description) {
    try {
      const system = renderSystemPrompt("summarizer", "v1", promptContext(account));
      const res = await getLLM().chatJSON({
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: JSON.stringify({
              phone: conv.lead.phone,
              firstName: conv.lead.firstName,
              ...((qual.raw as { extracted?: unknown })?.extracted ?? {}),
              urgency: qual.urgency,
            }),
          },
        ],
        timeoutMs: 10_000,
      });
      const parsed = summarizerOutput.safeParse(JSON.parse(res.content));
      if (parsed.success) summary = parsed.data.summary;
    } catch (err) {
      log.warn({ err: String(err) }, "notify.summarizer_fallback");
    }
  }

  const urgent = qual?.urgency === "HIGH";
  const inQuiet = withinQuietHours({ start: account.quietHoursStart, end: account.quietHoursEnd });
  if (inQuiet && !(urgent && account.urgentBypassQuiet)) {
    await enqueue("notifyOwner", { conversationId }, { delayMs: delayUntilNextWindow(), jobId: `notify2-${conversationId}` });
    return;
  }

  const line = account.phoneLine;
  if (!line) throw new Error(`Compte ${account.id} sans PhoneLine`);
  const body = `${urgent ? "URGENT — " : ""}Nouveau lead Décroché : ${summary} — Rappeler le ${conv.lead.phone}`;
  await getMessaging().sendSms({ to: account.ownerMobile, from: line.smsNumber, body });
  await prisma.auditEvent.create({
    data: { accountId: account.id, kind: "notify.sms", payload: { conversationId, urgent } },
  });
  log.info("owner.notified");
}

/** Job: email transactionnel (ex. bienvenue post-onboarding) — jamais envoyé
 * de façon synchrone dans une route HTTP (CLAUDE.md §4), toujours via cette queue. */
export async function jobSendEmail({ to, template, vars }: JobPayloads["sendEmail"]) {
  const { subject, html } = renderTemplate(template, vars);
  const { providerId } = await getEmail().sendEmail({ to, subject, html });
  logger.info({ to, template, providerId }, "email.sent");
}

/** Job: commande du bot Telegram admin — l'envoi externe (sendMessage) a
 * lieu ICI (worker), jamais dans la route webhook (CLAUDE.md §4). */
export async function jobTelegramCommand({ chatId, text }: JobPayloads["telegramCommand"]) {
  const command = text.trim().split(/\s+/)[0]?.toLowerCase();
  let reply: string;
  switch (command) {
    case "/status":
      reply = formatStatusMessage(await getOpsStatus());
      break;
    case "/leads":
      reply = formatLeadsMessage(await getRecentQualifiedLeads(5));
      break;
    default:
      reply = TELEGRAM_HELP_TEXT;
  }
  await sendTelegramMessage(chatId, reply);
}

/** Validation d'une sortie de régression (utilisé par prompts/regression/run.ts). */
export function parseAgentOutput(content: string) {
  return agentTurnOutputSchema.parse(JSON.parse(content));
}
