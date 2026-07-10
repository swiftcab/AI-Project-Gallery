import { describe, expect, it } from "vitest";
import { FakeLLMProvider } from "@/lib/llm/fake";
import { runAgentTurn, fallbackOwnerSummary, type AgentTurnInput } from "@/agent/qualifier";
import { SAFE_FALLBACK_REPLY } from "@/agent/guardrails";

const baseInput: Omit<AgentTurnInput, "inbound"> = {
  conversationId: "test-conv",
  state: "QUALIFYING",
  turnCount: 1,
  promptVersion: "v1",
  context: {
    companyName: "Plomberie Karim",
    ownerFirstName: "Karim",
    trade: "PLOMBIER",
    departments: ["69"],
  },
  history: [{ direction: "OUTBOUND", body: "Bonjour, ici l'assistant de Plomberie Karim…" }],
};

const validOutput = {
  reply: "S'agit-il d'une fuite en cours ou d'un projet planifiable ?",
  extracted: {
    tradeNeeded: "PLOMBIER",
    urgency: "UNKNOWN",
    postalCode: null,
    description: "problème de fuite évoqué",
    callbackWindow: null,
    firstName: null,
  },
  stateSuggestion: "QUALIFYING",
};

describe("runAgentTurn — chemin nominal", () => {
  it("parse la sortie, applique la suggestion, conserve le raw", async () => {
    const llm = new FakeLLMProvider();
    llm.enqueueJSON(validOutput);
    const res = await runAgentTurn(llm, { ...baseInput, inbound: "J'ai une fuite" });
    expect(res.reply).toBe(validOutput.reply);
    expect(res.nextState).toBe("QUALIFYING");
    expect(res.output?.extracted.tradeNeeded).toBe("PLOMBIER");
    expect(res.llmRaw).toContain("fuite");
    expect(res.guardrailBlocked).toEqual([]);
  });

  it("le prompt système contient les interdictions et le contexte du compte", async () => {
    const llm = new FakeLLMProvider();
    llm.enqueueJSON(validOutput);
    await runAgentTurn(llm, { ...baseInput, inbound: "bonjour" });
    const system = llm.calls[0][0];
    expect(system.role).toBe("system");
    expect(system.content).toContain("Plomberie Karim");
    expect(system.content).toContain("JAMAIS");
    expect(system.content).toContain("prix");
  });
});

describe("runAgentTurn — JSON invalide", () => {
  it("retry une fois puis accepte", async () => {
    const llm = new FakeLLMProvider();
    llm.enqueue("pas du json du tout");
    llm.enqueueJSON(validOutput);
    const res = await runAgentTurn(llm, { ...baseInput, inbound: "J'ai une fuite" });
    expect(res.reply).toBe(validOutput.reply);
    expect(llm.calls.length).toBe(2);
  });

  it("2 échecs JSON → repli sûr, jamais de silence", async () => {
    const llm = new FakeLLMProvider();
    llm.enqueue("nope", "{broken");
    const res = await runAgentTurn(llm, { ...baseInput, inbound: "J'ai une fuite" });
    expect(res.reply).toBe(SAFE_FALLBACK_REPLY);
    expect(res.output).toBeNull();
  });

  it("erreur LLM totale → repli sûr", async () => {
    const llm = new FakeLLMProvider();
    llm.enqueue(new Error("timeout"), new Error("timeout"));
    const res = await runAgentTurn(llm, { ...baseInput, inbound: "??" });
    expect(res.reply).toBe(SAFE_FALLBACK_REPLY);
  });
});

describe("runAgentTurn — guardrails (l'agent ne donne JAMAIS prix/délai)", () => {
  it("réponse avec prix → retry de reformulation qui passe", async () => {
    const llm = new FakeLLMProvider();
    llm.enqueueJSON({ ...validOutput, reply: "Cela coûtera environ 150 € selon la fuite." });
    llm.enqueueJSON({ ...validOutput, reply: "C'est Karim qui vous donnera le tarif exact lors de son rappel." });
    const res = await runAgentTurn(llm, { ...baseInput, inbound: "C'est combien ?" });
    expect(res.reply).toContain("tarif exact lors de son rappel");
    expect(res.guardrailBlocked.length).toBeGreaterThan(0); // violation tracée pour l'audit
  });

  it("reformulation encore fautive → repli sûr", async () => {
    const llm = new FakeLLMProvider();
    llm.enqueueJSON({ ...validOutput, reply: "Environ 150 €." });
    llm.enqueueJSON({ ...validOutput, reply: "Nous serons chez vous demain matin pour 80 euros." });
    const res = await runAgentTurn(llm, { ...baseInput, inbound: "C'est combien ?" });
    expect(res.reply).toBe(SAFE_FALLBACK_REPLY);
  });
});

describe("fallbackOwnerSummary", () => {
  it("sans extraction → fiche minimale à rappeler", () => {
    const s = fallbackOwnerSummary({ phone: "+33612345678", extracted: null });
    expect(s).toContain("+33612345678");
    expect(s.toLowerCase()).toContain("rappeler");
  });
  it("avec extraction → fiche exploitable", () => {
    const s = fallbackOwnerSummary({
      phone: "+33612345678",
      extracted: {
        tradeNeeded: "PLOMBIER",
        urgency: "HIGH",
        postalCode: "69003",
        description: "fuite sous évier cuisine",
        callbackWindow: "avant 9h",
        firstName: "Sophie",
      },
    });
    expect(s).toContain("Sophie");
    expect(s).toContain("69003");
    expect(s).toContain("URGENT");
    expect(s).toContain("avant 9h");
  });
});
