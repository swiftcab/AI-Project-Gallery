import { z } from "zod";
import type { CandidateLead } from "./criteria";
import { DeepSeekProvider } from "../../src/lib/llm/deepseek";

const enrichmentSchema = z.object({
  icebreaker: z.string().min(1).max(220),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  reason: z.string().max(160),
});

export interface EnrichedLead extends CandidateLead {
  icebreaker: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
}

const SYSTEM_PROMPT = `Tu aides un solopreneur à prioriser des prospects artisans BTP pour un
produit d'agent IA de qualification des appels manqués (79€/mois). Pour chaque
fiche entreprise, tu écris UNE phrase d'accroche courte et concrète (pas de
superlatifs creux) que le vendeur pourra dire au téléphone ou en SMS s'il ne
décroche pas, et tu classes la priorité de contact.

Priorité HIGH : activité visiblement individuelle/petite structure (nom de
personne dans le nom d'entreprise, peu d'avis mais réguliers) — probablement
LE seul décideur, joignable directement sur ce mobile.
Priorité LOW : nom suggérant une structure plus grande (agence, groupe,
franchise) où le mobile affiché n'est peut-être pas celui du décideur.
MEDIUM sinon.

Ne JAMAIS inventer d'informations sur l'entreprise (pas d'avis clients
fabriqués, pas de faits non fournis). Réponds UNIQUEMENT en JSON :
{"icebreaker": "...", "priority": "HIGH|MEDIUM|LOW", "reason": "..."}`;

const llm = new DeepSeekProvider();

async function callDeepSeek(userContent: string): Promise<string> {
  const res = await llm.chatJSON({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    timeoutMs: 20_000,
  });
  return res.content;
}

/** Enrichit une liste de leads avec un léger throttle (reste courtois vis-à-vis de l'API). */
export async function enrichLeads(leads: CandidateLead[]): Promise<EnrichedLead[]> {
  const out: EnrichedLead[] = [];
  for (const lead of leads) {
    try {
      const raw = await callDeepSeek(
        JSON.stringify({
          entreprise: lead.companyName,
          metier: lead.trade,
          ville: lead.city,
          categorieGoogle: lead.category,
          note: lead.rating,
          nombreAvis: lead.reviewsCount,
        }),
      );
      const parsed = enrichmentSchema.parse(JSON.parse(raw));
      out.push({ ...lead, ...parsed });
    } catch (err) {
      console.warn(`⚠ enrichissement échoué pour "${lead.companyName}": ${String(err)}`);
      out.push({
        ...lead,
        icebreaker: "",
        priority: "MEDIUM",
        reason: "enrichissement indisponible — à qualifier manuellement",
      });
    }
    await new Promise((r) => setTimeout(r, 250)); // throttle doux
  }
  return out;
}
