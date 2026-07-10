import { getLeadgenConfig } from "./config";

/**
 * Champ brut tel que renvoyé par l'acteur Apify Google Maps Scraper.
 * ⚠️ Les acteurs communautaires changent parfois leurs noms de champs —
 * ce type est défensif (tout optionnel) ; vérifier contre une vraie réponse
 * au premier run (voir README.md de ce dossier).
 */
export interface RawPlace {
  title?: string;
  phone?: string;
  phoneUnformatted?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  totalScore?: number;
  reviewsCount?: number;
  categoryName?: string;
  openingHours?: { day?: string; hours?: string }[];
  url?: string;
  website?: string;
}

export interface SearchQuery {
  term: string; // ex: "plombier Lyon"
  maxResults: number;
}

/**
 * Lance l'acteur Apify en mode synchrone (run-sync-get-dataset-items) et
 * retourne les résultats bruts. Un appel = une requête (métier + ville).
 */
export async function searchPlaces(query: SearchQuery): Promise<RawPlace[]> {
  const cfg = getLeadgenConfig();
  const url = `https://api.apify.com/v2/acts/${cfg.APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${cfg.APIFY_API_TOKEN}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      searchStringsArray: [query.term],
      maxCrawledPlacesPerSearch: query.maxResults,
      language: "fr",
      // On ne demande pas les avis détaillés / photos : plus rapide, moins cher.
      scrapeReviewsPersonalData: false,
      maxReviews: 0,
      maxImages: 0,
    }),
    // Le run peut prendre plusieurs dizaines de secondes selon maxResults.
    signal: AbortSignal.timeout(180_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Apify HTTP ${res.status} pour "${query.term}": ${body.slice(0, 300)}`);
  }
  return (await res.json()) as RawPlace[];
}
