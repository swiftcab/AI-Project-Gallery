/**
 * Prospection automatisée — génère un CSV de leads BTP qualifiés par critères
 * (docs/go-to-market.md §3) puis priorisés/personnalisés par LLM (Gemini).
 *
 *   npm run leads:generate
 *   npm run leads:generate -- --max 50        (override LEADGEN_MAX_LEADS)
 *
 * Prérequis .env : APIFY_API_TOKEN, GEMINI_API_KEY (voir .env.example).
 * Cibles éditables dans scripts/leadgen/targets.json (métier x ville).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { getLeadgenConfig } from "./config";
import { searchPlaces } from "./apify";
import { applyCriteria, dedupeByPhone, type CandidateLead } from "./criteria";
import { enrichLeads } from "./enrich";
import { writeLeadsCsv } from "./csv";
import { loadSeenPhones, saveSeenPhones } from "./state";

interface Target {
  queryTrade: string;
  trade: string;
  city: string;
}

function parseMaxOverride(): number | null {
  const i = process.argv.indexOf("--max");
  if (i === -1) return null;
  const v = Number(process.argv[i + 1]);
  return Number.isFinite(v) && v > 0 ? v : null;
}

async function main() {
  const cfg = getLeadgenConfig();
  const maxLeads = parseMaxOverride() ?? cfg.LEADGEN_MAX_LEADS;
  const targetsFile = path.join(process.cwd(), "scripts", "leadgen", "targets.json");
  const { targets } = JSON.parse(readFileSync(targetsFile, "utf8")) as { targets: Target[] };

  const seenPhones = loadSeenPhones();
  const candidates: CandidateLead[] = [];

  console.log(`→ Objectif: ${maxLeads} leads. ${targets.length} cibles configurées (targets.json).`);

  for (const target of targets) {
    if (candidates.length >= maxLeads) break;
    const term = `${target.queryTrade} ${target.city}`;
    process.stdout.write(`  scraping "${term}"... `);
    try {
      const raw = await searchPlaces({ term, maxResults: cfg.LEADGEN_MAX_PER_QUERY });
      const filtered = raw
        .map((r) => applyCriteria(r, { trade: target.trade, city: target.city }))
        .filter((c): c is CandidateLead => c !== null)
        .filter((c) => !seenPhones.has(c.mobile));
      console.log(`${raw.length} résultats bruts → ${filtered.length} après critères`);
      candidates.push(...filtered);
    } catch (err) {
      console.log(`échec (${String(err)})`);
    }
  }

  const deduped = dedupeByPhone(candidates).slice(0, maxLeads);
  if (deduped.length === 0) {
    console.log("\nAucun lead trouvé après filtres. Élargir targets.json ou revoir les critères (criteria.ts).");
    return;
  }

  console.log(`\n→ ${deduped.length} leads uniques retenus. Enrichissement Gemini...`);
  const enriched = await enrichLeads(deduped);

  const file = writeLeadsCsv(enriched, cfg.LEADGEN_OUTPUT_DIR);
  deduped.forEach((l) => seenPhones.add(l.mobile));
  saveSeenPhones(seenPhones);

  const byPriority = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  enriched.forEach((l) => byPriority[l.priority]++);

  console.log(`\n✓ ${file}`);
  console.log(`  Priorité HIGH: ${byPriority.HIGH} · MEDIUM: ${byPriority.MEDIUM} · LOW: ${byPriority.LOW}`);
  console.log(`  Import direct dans le fichier de suivi outreach (docs/go-to-market.md §3).`);
}

main().catch((err) => {
  console.error("Échec:", err);
  process.exit(1);
});
