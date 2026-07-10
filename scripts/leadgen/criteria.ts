import type { RawPlace } from "./apify";

/**
 * Filtres calqués sur docs/go-to-market.md §3 :
 * - un numéro MOBILE visible (06/07) — pas un standard fixe générique
 * - 10 à 80 avis Google (activité réelle, pas un centre d'appels déjà installé)
 * - pas "ouvert 24h/24" (signale un service déjà structuré avec astreinte)
 */
export interface CandidateLead {
  companyName: string;
  trade: string;
  city: string;
  mobile: string; // E.164
  reviewsCount: number;
  rating: number | null;
  category: string | null;
  source: string; // URL Google Maps
}

const FR_MOBILE_RE = /(?:\+33|0)([67]\d{8})/;

function toE164(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  const m = digits.match(FR_MOBILE_RE);
  if (!m) return null;
  return `+33${m[1]}`;
}

function has24_7(hours: RawPlace["openingHours"]): boolean {
  if (!hours) return false;
  return hours.some((h) => /24\s*h|24\/7|24h\/24/i.test(h.hours ?? ""));
}

export function applyCriteria(
  raw: RawPlace,
  ctx: { trade: string; city: string },
): CandidateLead | null {
  const mobile = toE164(raw.phone ?? raw.phoneUnformatted);
  if (!mobile) return null; // pas de mobile détecté = hors critère (numéro fixe/standard)

  const reviews = raw.reviewsCount ?? 0;
  if (reviews < 10 || reviews > 80) return null;

  if (has24_7(raw.openingHours)) return null;

  if (!raw.title) return null;

  return {
    companyName: raw.title.trim(),
    trade: ctx.trade,
    city: ctx.city,
    mobile,
    reviewsCount: reviews,
    rating: raw.totalScore ?? null,
    category: raw.categoryName ?? null,
    source: raw.url ?? raw.website ?? "",
  };
}

/** Dédoublonnage inter-requêtes (même artisan trouvé sur 2 recherches proches). */
export function dedupeByPhone(leads: CandidateLead[]): CandidateLead[] {
  const seen = new Set<string>();
  const out: CandidateLead[] = [];
  for (const lead of leads) {
    if (seen.has(lead.mobile)) continue;
    seen.add(lead.mobile);
    out.push(lead);
  }
  return out;
}
