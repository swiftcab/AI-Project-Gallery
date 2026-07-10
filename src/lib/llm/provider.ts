export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResult {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Abstraction LLM : tout le produit ne connaît que cette interface.
 * Swap DeepSeek → autre fournisseur = un nouveau fichier, zéro changement ailleurs.
 */
export interface LLMProvider {
  /** Chat avec sortie JSON forcée (json_object). Doit lever LLMError en cas d'échec. */
  chatJSON(opts: { messages: LLMMessage[]; timeoutMs?: number }): Promise<LLMResult>;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LLMError";
  }
}
