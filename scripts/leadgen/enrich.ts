import { z } from "zod";
import { getLeadgenConfig } from "./config";
import type { CandidateLead } from "./criteria";

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

async function callGemini(userContent: string): Promise<string> {
  const cfg = getLeadgenConfig();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.GEMINI_MODEL}:generateContent?key=${cfg.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Réponse Gemini vide");
  return text;
}

/** Enrichit une liste de leads avec un léger throttle (évite le rate-limit Gemini). */
export async function enrichLeads(leads: CandidateLead[]): Promise<EnrichedLead[]> {
  const out: EnrichedLead[] = [];
  for (const lead of leads) {
    try {
      const raw = await callGemini(
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
