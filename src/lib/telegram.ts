import { getConfig } from "./config";
import { logger } from "./logger";
import type { getOpsStatus, getRecentQualifiedLeads } from "./ops/status";

export const TELEGRAM_HELP_TEXT =
  "Commandes disponibles :\n" +
  "/status — santé produit (comptes, leads 24h, urgences)\n" +
  "/leads — les 5 derniers leads qualifiés\n" +
  "/aide — cette liste";

export function formatStatusMessage(status: Awaited<ReturnType<typeof getOpsStatus>>): string {
  return (
    `<b>Statut Décroché</b>\n` +
    `Comptes actifs : ${status.accounts}\n` +
    `Leads (24h) : ${status.last24h.leads} — qualifiés : ${status.last24h.qualified}\n` +
    `Garde-fous bloqués (24h) : ${status.last24h.guardrailBlocks}\n` +
    `Urgences ouvertes : ${status.urgentOpen}`
  );
}

export function formatLeadsMessage(leads: Awaited<ReturnType<typeof getRecentQualifiedLeads>>): string {
  if (leads.length === 0) return "Aucun lead qualifié pour le moment.";
  const lines = leads.map((lead) => {
    const q = lead.conversations[0]?.qualification;
    const urgent = q?.urgency === "HIGH" ? "🔴 " : "";
    return `${urgent}${lead.firstName ?? "Prospect"} (${lead.phone}) — ${q?.ownerSummary ?? "pas de résumé"}`;
  });
  return `<b>Derniers leads qualifiés</b>\n${lines.join("\n")}`;
}

/**
 * Client Telegram minimal (fetch natif, pas de SDK — cf. smsmode.ts/twilio.ts)
 * pour le bot ADMIN du produit (distinct du bot COO d'Hermes, natif à son
 * agent — cf. docs/agent-operations.md). N'enregistre jamais lui-même de
 * webhook auprès de Telegram : ça reste une action manuelle (voir le guide),
 * précisément pour ne jamais toucher par erreur au bot d'Hermes.
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const cfg = getConfig();
  if (!cfg.TELEGRAM_BOT_TOKEN) {
    logger.warn("telegram.bot_token_missing");
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${cfg.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error({ status: res.status, body: body.slice(0, 300) }, "telegram.send_failed");
  }
}
