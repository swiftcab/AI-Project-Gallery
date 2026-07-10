import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const STATE_FILE = path.join(process.cwd(), "scripts", "leadgen", "state", "seen-phones.json");

/** Numéros déjà exportés lors d'un run précédent — évite de re-scraper/re-facturer les mêmes fiches. */
export function loadSeenPhones(): Set<string> {
  if (!existsSync(STATE_FILE)) return new Set();
  try {
    return new Set(JSON.parse(readFileSync(STATE_FILE, "utf8")) as string[]);
  } catch {
    return new Set();
  }
}

export function saveSeenPhones(phones: Set<string>): void {
  mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify([...phones], null, 2), "utf8");
}
