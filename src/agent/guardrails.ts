/**
 * Garde-fous DÉTERMINISTES appliqués à toute réponse sortante de l'agent.
 * Règle produit absolue : l'agent ne donne JAMAIS un prix, un délai
 * d'intervention ni un engagement contractuel. Ces regex sont le 2e rempart
 * (le 1er est le prompt, le 3e l'audit) — elles doivent rester testables sans LLM.
 */

export interface GuardrailViolation {
  rule: string;
  match: string;
}

interface Rule {
  name: string;
  pattern: RegExp;
}

const RULES: Rule[] = [
  // --- Prix / argent ---
  // NB: pas de \b après "€" — il n'y a jamais de frontière de mot entre deux
  // non-mots (€ suivi d'un espace/point), cf. docs/debug-log.md 2026-07-10.
  { name: "price.amount", pattern: /\d[\d\s.,]*\s*(€|euros?\b|\beur\b)/i },
  { name: "price.commitment", pattern: /\b(ça|cela|ce sera|le tarif|le prix)\s+(vous\s+)?co[uû]tera?\b/i },
  { name: "price.estimate", pattern: /\b(comptez|pr[ée]voyez)\s+(environ|autour de|à peu près)\b/i },
  { name: "price.free", pattern: /\b(gratuit(e|ement)?|sans frais|offert)\b/i },
  // --- Délais / promesses d'intervention ---
  {
    name: "delay.promise",
    pattern:
      /\b(nous|on|il|elle)\s+(serons?|sera|seront|passera|passerons|viendra|viendrons|arrivera|arriverons|interviendra|interviendrons)\b/i,
  },
  { name: "delay.timeframe", pattern: /\bintervention\s+(sous|dans|en)\s+\d+\s*(h|heures?|jours?|min)/i },
  { name: "delay.sameday", pattern: /\b(aujourd'hui|demain|ce soir|dans la journée)\s+(même\s+)?(sans faute|c'est s[ûu]r|promis|garanti)/i },
  // --- Engagements contractuels ---
  { name: "commitment.guarantee", pattern: /\b(je vous garantis|nous garantissons|c'est garanti)\b/i },
  { name: "commitment.contract", pattern: /\b(devis accept[ée]|contrat|nous nous engageons)\b/i },
  // --- Conseil technique métier (redirigé vers le rappel du patron) ---
  { name: "technical.advice", pattern: /\b(vous pouvez|il faut|il suffit de)\s+(remplacer|couper|d[ée]monter|percer|brancher|d[ée]visser)\b/i },
];

/** Vérifie une réponse candidate. Retourne la liste des violations (vide = OK). */
export function checkReply(reply: string): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  for (const rule of RULES) {
    const m = reply.match(rule.pattern);
    if (m) violations.push({ rule: rule.name, match: m[0] });
  }
  return violations;
}

/** Phrase de repli sûre quand l'agent n'arrive pas à produire une réponse conforme. */
export const SAFE_FALLBACK_REPLY =
  "Merci pour votre message. Je transmets tout cela et l'on vous rappelle dès que possible pour vous répondre précisément.";

/**
 * Détection d'opt-out — appliquée dans la GATEWAY, jamais déléguée au LLM.
 * STOP standard + formulations naturelles fréquentes.
 */
const OPT_OUT_PATTERNS: RegExp[] = [
  /^\s*stop\s*$/i,
  /\bstop sms\b/i,
  /\bd[ée]sinscription\b/i,
  /\bd[ée]sabonn/i,
  /\bne\s+m'[ée]crivez\s+plus\b/i,
  /\barr[êe]te(z)?\s+(de\s+m'[ée]crire|les\s+messages|les\s+sms)\b/i,
  /\bplus\s+de\s+(message|sms)s?\b/i,
  /\bunsubscribe\b/i,
];

export function isOptOut(body: string): boolean {
  return OPT_OUT_PATTERNS.some((p) => p.test(body));
}

export const OPT_OUT_CONFIRMATION =
  "C'est noté, vous ne recevrez plus de messages de notre part. Bonne journée.";
