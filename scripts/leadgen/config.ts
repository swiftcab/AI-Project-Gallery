import { z } from "zod";

/**
 * Config dédiée au script de prospection — séparée de src/lib/config.ts
 * (l'app produit n'a jamais besoin d'Apify, seul ce script l'utilise).
 *
 * Choix fournisseur LLM : DeepSeek partout où c'est possible (déjà le
 * fournisseur du produit, un seul compte/budget à suivre) — réutilise
 * directement src/lib/llm/deepseek.ts. Gemini reste dispo mais NON requis
 * ici : réservé à un usage futur de collecte via son "grounding" Google
 * Maps/Places, distinct de l'enrichissement (qui tourne sur DeepSeek).
 */
const schema = z.object({
  APIFY_API_TOKEN: z.string().min(1, "APIFY_API_TOKEN manquant dans .env"),
  // Vérifier le slug exact dans votre compte Apify avant le premier run
  // (Apify renomme/déplace parfois ses acteurs communautaires).
  APIFY_ACTOR_ID: z.string().default("compass~crawler-google-places"),

  // Optionnel — non utilisé par l'enrichissement (DeepSeek), réservé à une
  // future collecte assistée par Gemini si besoin.
  GEMINI_API_KEY: z.string().default(""),
  GEMINI_MODEL: z.string().default("gemini-3.1-flash-lite"),

  LEADGEN_MAX_LEADS: z.coerce.number().int().positive().default(100),
  LEADGEN_OUTPUT_DIR: z.string().default("research/leads"),
  // Limite les résultats Apify par requête (métier x ville) pour maîtriser le coût
  LEADGEN_MAX_PER_QUERY: z.coerce.number().int().positive().default(40),
});

export type LeadgenConfig = z.infer<typeof schema>;

let cached: LeadgenConfig | null = null;

export function getLeadgenConfig(): LeadgenConfig {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(
        `Configuration prospection invalide:\n${parsed.error.issues.map((i) => `  - ${i.path}: ${i.message}`).join("\n")}`,
      );
    }
    cached = parsed.data;
  }
  return cached;
}
