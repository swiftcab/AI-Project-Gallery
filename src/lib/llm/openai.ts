import { getConfig } from "../config";
import { LLMError, type LLMMessage, type LLMProvider, type LLMResult } from "./provider";

/**
 * Adapter OpenAI — même contrat que DeepSeekProvider (fetch natif, pas de
 * SDK, cf. deepseek.ts). Utilisé uniquement comme fallback (LLM_FALLBACK_PROVIDER)
 * quand DeepSeek échoue ; jamais le fournisseur principal sans décision
 * explicite (CLAUDE.md §7 : swap de fournisseur = nouvel adapter, pas plus).
 */
export class OpenAIProvider implements LLMProvider {
  async chatJSON({ messages, timeoutMs = 20_000 }: { messages: LLMMessage[]; timeoutMs?: number }): Promise<LLMResult> {
    const cfg = getConfig();
    if (!cfg.OPENAI_API_KEY) throw new LLMError("OPENAI_API_KEY manquant");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${cfg.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: cfg.OPENAI_MODEL,
          messages,
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 700,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new LLMError(`OpenAI HTTP ${res.status}: ${body.slice(0, 300)}`);
      }
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new LLMError("OpenAI: réponse sans contenu");
      return { content, inputTokens: data.usage?.prompt_tokens, outputTokens: data.usage?.completion_tokens };
    } catch (err) {
      if (err instanceof LLMError) throw err;
      throw new LLMError("OpenAI: appel échoué", err);
    } finally {
      clearTimeout(timer);
    }
  }
}
