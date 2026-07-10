/**
 * Machine à états de la conversation (cf. PRD §6).
 * Les transitions sont volontairement restrictives : le LLM SUGGÈRE un état,
 * le code DÉCIDE.
 */

export type ConversationState =
  | "GREETING"
  | "QUALIFYING"
  | "CONFIRMING"
  | "DONE"
  | "OPTED_OUT"
  | "EXPIRED"
  | "FAILED";

export const MAX_TURNS = 8;

const TERMINAL_STATES: ConversationState[] = ["DONE", "OPTED_OUT", "EXPIRED", "FAILED"];

export function isTerminal(state: ConversationState): boolean {
  return TERMINAL_STATES.includes(state);
}

const ALLOWED: Record<ConversationState, ConversationState[]> = {
  GREETING: ["QUALIFYING", "OPTED_OUT", "EXPIRED", "FAILED"],
  QUALIFYING: ["QUALIFYING", "CONFIRMING", "DONE", "OPTED_OUT", "EXPIRED", "FAILED"],
  CONFIRMING: ["DONE", "QUALIFYING", "OPTED_OUT", "EXPIRED", "FAILED"],
  DONE: [],
  OPTED_OUT: [],
  EXPIRED: [],
  FAILED: [],
};

export function canTransition(from: ConversationState, to: ConversationState): boolean {
  return ALLOWED[from].includes(to);
}

/**
 * Décide de l'état suivant à partir de la suggestion du LLM, de l'état courant
 * et du nombre de tours. Ne lève jamais : retombe sur un état sûr.
 */
export function resolveNextState(opts: {
  current: ConversationState;
  suggestion: ConversationState;
  turnCount: number;
}): ConversationState {
  const { current, suggestion, turnCount } = opts;
  if (isTerminal(current)) return current;

  // Cap dur : au-delà de MAX_TURNS on clôt avec ce qu'on a (fiche partielle).
  if (turnCount >= MAX_TURNS) return "DONE";

  if (canTransition(current, suggestion)) return suggestion;

  // Suggestion illégale → on reste en qualification (état sûr non terminal).
  return current === "GREETING" ? "QUALIFYING" : current;
}
