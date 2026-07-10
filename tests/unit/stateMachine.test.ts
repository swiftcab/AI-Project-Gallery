import { describe, expect, it } from "vitest";
import { canTransition, isTerminal, MAX_TURNS, resolveNextState } from "@/agent/stateMachine";

describe("state machine — transitions", () => {
  it("GREETING → QUALIFYING autorisé", () => {
    expect(canTransition("GREETING", "QUALIFYING")).toBe(true);
  });
  it("GREETING → DONE interdit (pas de clôture sans échange)", () => {
    expect(canTransition("GREETING", "DONE")).toBe(false);
  });
  it("CONFIRMING → QUALIFYING autorisé (le prospect corrige le récap)", () => {
    expect(canTransition("CONFIRMING", "QUALIFYING")).toBe(true);
  });
  it("les états terminaux n'ont aucune sortie", () => {
    for (const s of ["DONE", "OPTED_OUT", "EXPIRED", "FAILED"] as const) {
      expect(isTerminal(s)).toBe(true);
      expect(canTransition(s, "QUALIFYING")).toBe(false);
    }
  });
});

describe("resolveNextState — le code décide, pas le LLM", () => {
  it("suit une suggestion légale", () => {
    expect(resolveNextState({ current: "QUALIFYING", suggestion: "CONFIRMING", turnCount: 3 })).toBe("CONFIRMING");
  });
  it("rejette une suggestion illégale et reste en état sûr", () => {
    expect(resolveNextState({ current: "GREETING", suggestion: "DONE", turnCount: 1 })).toBe("QUALIFYING");
  });
  it("cap dur à MAX_TURNS → DONE forcé", () => {
    expect(resolveNextState({ current: "QUALIFYING", suggestion: "QUALIFYING", turnCount: MAX_TURNS })).toBe("DONE");
  });
  it("un état terminal ne bouge plus", () => {
    expect(resolveNextState({ current: "OPTED_OUT", suggestion: "QUALIFYING", turnCount: 2 })).toBe("OPTED_OUT");
  });
});
