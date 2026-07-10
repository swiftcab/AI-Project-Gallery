import { readFileSync } from "node:fs";
import path from "node:path";

export interface PromptContext {
  companyName: string;
  ownerFirstName: string;
  trade: string;
  departments: string[];
}

const TRADE_LABELS: Record<string, string> = {
  PLOMBIER: "plomberie",
  ELECTRICIEN: "électricité",
  MACON: "maçonnerie",
  COUVREUR: "couverture/toiture",
  CHAUFFAGISTE: "chauffage",
  MENUISIER: "menuiserie",
  PEINTRE: "peinture",
  MULTI: "tous corps d'état",
  AUTRE: "bâtiment",
};

export function tradeLabel(trade: string): string {
  return TRADE_LABELS[trade] ?? "bâtiment";
}

const cache = new Map<string, string>();

function loadTemplate(agent: string, version: string): string {
  const key = `${agent}/${version}`;
  let tpl = cache.get(key);
  if (!tpl) {
    const file = path.join(process.cwd(), "prompts", agent, `${version}.system.md`);
    tpl = readFileSync(file, "utf8");
    cache.set(key, tpl);
  }
  return tpl;
}

/** Rend le prompt système versionné avec le contexte du compte. */
export function renderSystemPrompt(agent: "qualifier" | "summarizer", version: string, ctx: PromptContext): string {
  const tpl = loadTemplate(agent, version);
  return tpl
    .replaceAll("{{companyName}}", ctx.companyName)
    .replaceAll("{{ownerFirstName}}", ctx.ownerFirstName)
    .replaceAll("{{tradeLabel}}", tradeLabel(ctx.trade))
    .replaceAll("{{departments}}", ctx.departments.join(", ") || "non précisé");
}

/** Premier SMS (GREETING) — statique par conception : zéro LLM, zéro risque, latence minimale. */
export function greetingSms(ctx: PromptContext): string {
  return (
    `Bonjour, ici l'assistant de ${ctx.companyName} (${tradeLabel(ctx.trade)}). ` +
    `${ctx.ownerFirstName} est sur un chantier et vous rappelle dès que possible. ` +
    `Pour préparer son rappel, pouvez-vous me dire en quelques mots de quoi il s'agit ? ` +
    `(STOP pour ne plus recevoir de messages)`
  );
}
