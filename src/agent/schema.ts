import { z } from "zod";

/** Miroir de l'enum Prisma `Trade` — garder synchronisé avec prisma/schema.prisma. */
export const TRADES = [
  "PLOMBIER",
  "ELECTRICIEN",
  "MACON",
  "COUVREUR",
  "CHAUFFAGISTE",
  "MENUISIER",
  "PEINTRE",
  "MULTI",
  "AUTRE",
] as const;

export const URGENCIES = ["HIGH", "NORMAL", "LOW", "UNKNOWN"] as const;

export const extractedSchema = z.object({
  tradeNeeded: z.enum(TRADES).nullish(),
  urgency: z.enum(URGENCIES).default("UNKNOWN"),
  postalCode: z
    .string()
    .regex(/^\d{5}$/)
    .nullish(),
  description: z.string().max(1000).nullish(),
  callbackWindow: z.string().max(200).nullish(),
  firstName: z.string().max(80).nullish(),
});

/**
 * Contrat de sortie STRICT de chaque tour d'agent.
 * Le LLM répond en JSON ; tout écart = retry puis FAILED (jamais envoyé au prospect).
 */
export const agentTurnOutputSchema = z.object({
  // 480 chars ≈ 3 segments SMS max
  reply: z.string().min(1).max(480),
  extracted: extractedSchema,
  stateSuggestion: z.enum(["QUALIFYING", "CONFIRMING", "DONE"]),
});

export type Extracted = z.infer<typeof extractedSchema>;
export type AgentTurnOutput = z.infer<typeof agentTurnOutputSchema>;
