import { getConfig } from "../config";
import { logger } from "../logger";
import { LLMError, type LLMMessage, type LLMProvider, type LLMResult } from "./provider";

// Tarifs deepseek-v4-flash (07/2026) pour le log de coût — indicatif uniquement.
const USD_PER_M_INPUT = 0.14;
const USD_PER_M_OUTPUT = 0.28;

export class DeepSeekProvider implements LLMProvider {
  async chatJSON({ messages, timeoutMs = 20_000 }: { messages: LLMMessage[]; timeoutMs?: number }): Promise<LLMResult> {
    const cfg = getConfig();
    if (!cfg.DEEPSEEK_API_KEY) throw new LLMError("DEEPSEEK_API_KEY manquant");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${cfg.DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${cfg.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: cfg.DEEPSEEK_MODEL,
          messages,
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 700,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new LLMError(`DeepSeek HTTP ${res.status}: ${body.slice(0, 300)}`);
      }
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new LLMError("Réponse DeepSeek vide");

      const inputTokens = data.usage?.prompt_tokens ?? 0;
      const outputTokens = data.usage?.completion_tokens ?? 0;
      logger.debug(
        {
          llm: "deepseek",
          model: cfg.DEEPSEEK_MODEL,
          inputTokens,
          outputTokens,
          estUsd: (inputTokens * USD_PER_M_INPUT + outputTokens * USD_PER_M_OUTPUT) / 1_000_000,
        },
        "llm.call",
      );
      return { content, inputTokens, outputTokens };
    } catch (err) {
      if (err instanceof LLMError) throw err;
      throw new LLMError("Appel DeepSeek échoué", err);
    } finally {
      clearTimeout(timer);
    }
  }
}
