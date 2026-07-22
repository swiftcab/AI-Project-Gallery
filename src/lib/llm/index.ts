import { getConfig } from "../config";
import { DeepSeekProvider } from "./deepseek";
import { FallbackLLMProvider } from "./fallback";
import { OpenAIProvider } from "./openai";
import type { LLMProvider } from "./provider";

let instance: LLMProvider | null = null;

export function getLLM(): LLMProvider {
  if (!instance) {
    const primary = new DeepSeekProvider();
    instance = getConfig().LLM_FALLBACK_PROVIDER === "openai" ? new FallbackLLMProvider(primary, new OpenAIProvider()) : primary;
  }
  return instance;
}

/** Injection pour tests/intégration. */
export function setLLMForTests(provider: LLMProvider | null): void {
  instance = provider;
}
