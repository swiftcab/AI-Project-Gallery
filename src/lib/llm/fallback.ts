import { logger } from "../logger";
import type { LLMMessage, LLMProvider, LLMResult } from "./provider";

/**
 * Bascule vers un second fournisseur uniquement si le principal échoue
 * (timeout, HTTP erreur, clé manquante) — jamais de bascule sur un contenu
 * simplement inattendu (ça reste le rôle du retry de src/agent/qualifier.ts,
 * qui rejoue sur le MÊME fournisseur). Une seule tentative de repli, jamais
 * de boucle.
 */
export class FallbackLLMProvider implements LLMProvider {
  constructor(
    private readonly primary: LLMProvider,
    private readonly fallback: LLMProvider,
  ) {}

  async chatJSON(opts: { messages: LLMMessage[]; timeoutMs?: number }): Promise<LLMResult> {
    try {
      return await this.primary.chatJSON(opts);
    } catch (err) {
      logger.warn({ err: String(err) }, "llm.fallback_triggered");
      return await this.fallback.chatJSON(opts);
    }
  }
}
