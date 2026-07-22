import { NextRequest, NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import { enqueue } from "@/queues";

export const dynamic = "force-dynamic";

/**
 * Webhook du bot Telegram ADMIN du produit — distinct du bot COO d'Hermes
 * (natif à son agent, cf. docs/agent-operations.md). Ce webhook n'est
 * enregistré nulle part par du code : c'est une action manuelle (guide
 * fourni au fondateur) pour ne jamais toucher par erreur au bot d'Hermes,
 * qui utilise probablement le long-polling — un setWebhook sur SON token
 * le désactiverait silencieusement.
 *
 * Vérifie le secret_token (X-Telegram-Bot-Api-Secret-Token) puis n'accepte
 * de commandes que du chat admin whitelisté (TELEGRAM_ADMIN_CHAT_ID) — un
 * bot dont le nom se découvre ne doit jamais exposer les leads à qui le
 * trouve. Écrit/enqueue uniquement ici (CLAUDE.md §4) ; l'envoi réel de la
 * réponse a lieu dans le worker (jobTelegramCommand).
 */
export async function POST(req: NextRequest) {
  const cfg = getConfig();
  const secret = cfg.TELEGRAM_WEBHOOK_SECRET;
  const provided = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  const authorized = secret ? provided === secret : cfg.NODE_ENV !== "production";
  if (!authorized) {
    logger.warn("telegram.invalid_secret");
    return new NextResponse("forbidden", { status: 403 });
  }

  let update: { message?: { chat?: { id?: number | string }; text?: string } };
  try {
    update = await req.json();
  } catch {
    return new NextResponse("bad request", { status: 400 });
  }

  const chatId = update.message?.chat?.id;
  const text = update.message?.text;
  if (chatId === undefined || !text) {
    return NextResponse.json({ ok: true }); // autre type d'update (edited_message, etc.) — ignoré
  }

  if (!cfg.TELEGRAM_ADMIN_CHAT_ID || String(chatId) !== cfg.TELEGRAM_ADMIN_CHAT_ID) {
    logger.warn({ chatId }, "telegram.unauthorized_chat");
    return NextResponse.json({ ok: true }); // silence — ne confirme rien à qui n'est pas admin
  }

  await enqueue("telegramCommand", { chatId: String(chatId), text });
  return NextResponse.json({ ok: true });
}
