import { describe, expect, it } from "vitest";
import { greetingSms, renderSystemPrompt } from "@/agent/prompts";

const ctx = {
  companyName: "Élec Marchal",
  ownerFirstName: "Julie",
  trade: "ELECTRICIEN",
  departments: ["54", "57"],
};

describe("prompts versionnés", () => {
  it("rend le prompt qualifier v1 avec le contexte injecté", () => {
    const p = renderSystemPrompt("qualifier", "v1", ctx);
    expect(p).toContain("Élec Marchal");
    expect(p).toContain("Julie");
    expect(p).toContain("électricité");
    expect(p).toContain("54, 57");
    expect(p).not.toContain("{{"); // aucun placeholder oublié
  });

  it("une version inexistante lève une erreur explicite (pas de prompt silencieusement vide)", () => {
    expect(() => renderSystemPrompt("qualifier", "v999", ctx)).toThrow();
  });

  it("le greeting est statique, identifie l'entreprise et contient la mention STOP", () => {
    const sms = greetingSms(ctx);
    expect(sms).toContain("Élec Marchal");
    expect(sms).toContain("STOP");
    expect(sms.length).toBeLessThanOrEqual(320); // 2 segments SMS max
  });
});
