import { DeepSeekProvider } from "./deepseek";
import type { LLMProvider } from "./provider";

let instance: LLMProvider | null = null;

export function getLLM(): LLMProvider {
  if (!instance) instance = new DeepSeekProvider();
  return instance;
}

/** Injection pour tests/intégration. */
export function setLLMForTests(provider: LLMProvider | null): void {
  instance = provider;
}
