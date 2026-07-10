import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { EnrichedLead } from "./enrich";

const HEADERS = [
  "entreprise",
  "metier",
  "ville",
  "mobile",
  "note",
  "avis",
  "priorite",
  "accroche",
  "raison",
  "source",
  "statut",
] as const;

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Écrit le CSV au format attendu par docs/go-to-market.md (colonne "statut" pour le suivi manuel). */
export function writeLeadsCsv(leads: EnrichedLead[], outDir: string): string {
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const file = path.join(outDir, `leads-${stamp}.csv`);

  const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const sorted = [...leads].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  const rows = sorted.map((l) =>
    [
      l.companyName,
      l.trade,
      l.city,
      l.mobile,
      l.rating ?? "",
      l.reviewsCount,
      l.priority,
      l.icebreaker,
      l.reason,
      l.source,
      "NOUVEAU",
    ]
      .map(csvEscape)
      .join(","),
  );

  writeFileSync(file, [HEADERS.join(","), ...rows].join("\n") + "\n", "utf8");
  return file;
}
