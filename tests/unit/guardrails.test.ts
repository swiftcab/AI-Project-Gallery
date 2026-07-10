import { describe, expect, it } from "vitest";
import { checkReply, isOptOut, SAFE_FALLBACK_REPLY } from "@/agent/guardrails";

describe("guardrails — prix", () => {
  it.each([
    "Cela vous coûtera 150 € environ.",
    "Comptez environ 200 euros pour ce type de fuite.",
    "Le déplacement est gratuit.",
    "Une intervention sans frais pour le diagnostic.",
    "C'est 80€ de l'heure.",
  ])("bloque: %s", (reply) => {
    expect(checkReply(reply).length).toBeGreaterThan(0);
  });
});

describe("guardrails — délais/engagements", () => {
  it.each([
    "Nous serons chez vous demain matin.",
    "Il passera dans la journée, promis.",
    "On viendra ce soir sans faute.",
    "Nous interviendrons rapidement chez vous.",
    "Je vous garantis une intervention sous 24h.",
    "Intervention sous 2 heures assurée.",
  ])("bloque: %s", (reply) => {
    expect(checkReply(reply).length).toBeGreaterThan(0);
  });
});

describe("guardrails — conseil technique", () => {
  it("bloque un conseil de manipulation", () => {
    expect(checkReply("Vous pouvez démonter le siphon pour vérifier.").length).toBeGreaterThan(0);
  });
});

describe("guardrails — réponses légitimes NON bloquées", () => {
  it.each([
    "Pouvez-vous me préciser votre commune et votre code postal ?",
    "C'est noté : fuite sous l'évier de la cuisine. Karim vous rappelle dès que possible.",
    "Quel créneau vous arrange pour être rappelé, plutôt matin ou fin de journée ?",
    "C'est Karim qui vous donnera le tarif exact lors de son rappel.",
    "S'agit-il d'une fuite en cours ou d'un projet de rénovation ?",
    SAFE_FALLBACK_REPLY,
  ])("laisse passer: %s", (reply) => {
    expect(checkReply(reply)).toEqual([]);
  });
});

describe("opt-out — détection gateway", () => {
  it.each(["STOP", "stop", " Stop ", "stop sms", "Désinscription", "ne m'écrivez plus", "arrêtez de m'écrire", "plus de messages svp"])(
    "détecte: %s",
    (body) => expect(isOptOut(body)).toBe(true),
  );

  it.each([
    "il faut stopper la fuite d'urgence",
    "je veux un rendez-vous",
    "on ne peut plus arrêter l'eau",
  ])("ne détecte PAS (faux positif interdit): %s", (body) => {
    expect(isOptOut(body)).toBe(false);
  });
});
