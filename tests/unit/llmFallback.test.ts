import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("OpenAIProvider", () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-openai-key";
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
    vi.unstubAllGlobals();
  });

  it("appelle l'API chat completions OpenAI avec response_format json_object", async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe("https://api.openai.com/v1/chat/completions");
      const body = JSON.parse(init.body as string);
      expect(body.response_format).toEqual({ type: "json_object" });
      return new Response(
        JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }], usage: { prompt_tokens: 10, completion_tokens: 5 } }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const { resetConfigForTests } = await import("@/lib/config");
    resetConfigForTests();
    const { OpenAIProvider } = await import("@/lib/llm/openai");
    const result = await new OpenAIProvider().chatJSON({ messages: [{ role: "user", content: "salut" }] });

    expect(result.content).toBe('{"ok":true}');
    expect(result.inputTokens).toBe(10);
  });

  it("lève LLMError si OPENAI_API_KEY manque", async () => {
    delete process.env.OPENAI_API_KEY;
    const { resetConfigForTests } = await import("@/lib/config");
    resetConfigForTests();
    const { OpenAIProvider } = await import("@/lib/llm/openai");
    const { LLMError } = await import("@/lib/llm/provider");

    await expect(new OpenAIProvider().chatJSON({ messages: [] })).rejects.toThrow(LLMError);
  });
});

describe("FallbackLLMProvider", () => {
  it("bascule vers le fallback si le principal échoue", async () => {
    const { FallbackLLMProvider } = await import("@/lib/llm/fallback");
    const { LLMError } = await import("@/lib/llm/provider");

    const primary = { chatJSON: vi.fn(async () => { throw new LLMError("DeepSeek down"); }) };
    const fallback = { chatJSON: vi.fn(async () => ({ content: '{"fallback":true}' })) };

    const provider = new FallbackLLMProvider(primary, fallback);
    const result = await provider.chatJSON({ messages: [] });

    expect(result.content).toBe('{"fallback":true}');
    expect(primary.chatJSON).toHaveBeenCalledOnce();
    expect(fallback.chatJSON).toHaveBeenCalledOnce();
  });

  it("n'appelle jamais le fallback si le principal réussit", async () => {
    const { FallbackLLMProvider } = await import("@/lib/llm/fallback");
    const primary = { chatJSON: vi.fn(async () => ({ content: '{"primary":true}' })) };
    const fallback = { chatJSON: vi.fn() };

    const result = await new FallbackLLMProvider(primary, fallback).chatJSON({ messages: [] });

    expect(result.content).toBe('{"primary":true}');
    expect(fallback.chatJSON).not.toHaveBeenCalled();
  });
});

describe("getLLM() routage du fallback", () => {
  const OLD_ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...OLD_ENV };
    vi.resetModules();
  });

  it("retourne un FallbackLLMProvider quand LLM_FALLBACK_PROVIDER=openai", async () => {
    vi.resetModules();
    process.env.LLM_FALLBACK_PROVIDER = "openai";
    const { resetConfigForTests } = await import("@/lib/config");
    resetConfigForTests();
    const { getLLM } = await import("@/lib/llm");
    const { FallbackLLMProvider } = await import("@/lib/llm/fallback");
    expect(getLLM()).toBeInstanceOf(FallbackLLMProvider);
  });

  it("retourne DeepSeekProvider seul par défaut (LLM_FALLBACK_PROVIDER=none)", async () => {
    vi.resetModules();
    delete process.env.LLM_FALLBACK_PROVIDER;
    const { resetConfigForTests } = await import("@/lib/config");
    resetConfigForTests();
    const { getLLM } = await import("@/lib/llm");
    const { DeepSeekProvider } = await import("@/lib/llm/deepseek");
    expect(getLLM()).toBeInstanceOf(DeepSeekProvider);
  });
});
