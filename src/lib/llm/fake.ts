import { LLMError, type LLMMessage, type LLMProvider, type LLMResult } from "./provider";

/**
 * Provider déterministe pour les tests (CI 100 % sans réseau).
 * On empile des réponses scriptées ; chaque appel dépile la suivante.
 */
export class FakeLLMProvider implements LLMProvider {
  public readonly calls: LLMMessage[][] = [];
  private queue: (string | Error)[] = [];

  enqueue(...responses: (string | Error)[]): void {
    this.queue.push(...responses);
  }

  enqueueJSON(...objects: object[]): void {
    this.queue.push(...objects.map((o) => JSON.stringify(o)));
  }

  async chatJSON({ messages }: { messages: LLMMessage[] }): Promise<LLMResult> {
    this.calls.push(messages);
    const next = this.queue.shift();
    if (next === undefined) throw new LLMError("FakeLLMProvider: file de réponses vide");
    if (next instanceof Error) throw next;
    return { content: next, inputTokens: 0, outputTokens: 0 };
  }
}
