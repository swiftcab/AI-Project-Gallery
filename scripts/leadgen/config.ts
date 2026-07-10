import { z } from "zod";

/**
 * Config dédiée au script de prospection — séparée de src/lib/config.ts
 * (l'app produit n'a jamais besoin d'Apify/Gemini, seul ce script les utilise).
 */
const schema = z.object({
  APIFY_API_TOKEN: z.string().min(1, "APIFY_API_TOKEN manquant dans .env"),
  // Vérifier le slug exact dans votre compte Apify avant le premier run
  // (Apify renomme/déplace parfois ses acteurs communautaires).
  APIFY_ACTOR_ID: z.string().default("compass~crawler-google-places"),

  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY manquant dans .env"),
  // flash-lite: largement suffisant pour scorer/personnaliser 100 leads,
  // ~10x moins cher que Pro. Monter en gamme seulement si la qualité déçoit.
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
