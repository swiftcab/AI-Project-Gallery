/**
 * Fenêtres horaires légales pour les SMS émis À NOTRE INITIATIVE (nudge, notif
 * différée) : jamais 22h–8h, jamais le dimanche, jamais les jours fériés
 * (règles opérateurs FR pour le trafic marketing — on applique la règle
 * conservatrice 8h–21h à tout message proactif).
 * Les RÉPONSES à un message entrant du prospect ne passent pas par ici.
 */

const TZ = "Europe/Paris";

export const PROACTIVE_START_HOUR = 8;
export const PROACTIVE_END_HOUR = 21; // dernier envoi à 20:59

// Fériés France métropolitaine — fixes + mobiles pré-calculés 2026-2027.
// À étendre chaque année (test dédié qui casse si l'année courante manque).
const HOLIDAYS = new Set([
  // 2026
  "2026-01-01", "2026-04-06", "2026-05-01", "2026-05-08", "2026-05-14",
  "2026-05-25", "2026-07-14", "2026-08-15", "2026-11-01", "2026-11-11", "2026-12-25",
  // 2027
  "2027-01-01", "2027-03-29", "2027-05-01", "2027-05-06", "2027-05-08",
  "2027-05-17", "2027-07-14", "2027-08-15", "2027-11-01", "2027-11-11", "2027-12-25",
]);

export function holidaysCoverYear(year: number): boolean {
  return [...HOLIDAYS].some((d) => d.startsWith(`${year}-`));
}

interface ParisParts {
  ymd: string;
  hour: number;
  weekday: number; // 0 = dimanche
}

function parisParts(date: Date): ParisParts {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdays = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  return {
    ymd: `${get("year")}-${get("month")}-${get("day")}`,
    hour: parseInt(get("hour"), 10) % 24,
    weekday: weekdays.indexOf(get("weekday")),
  };
}

/** Peut-on envoyer un SMS proactif maintenant (heure de Paris) ? */
export function canSendProactive(date: Date = new Date()): boolean {
  const { ymd, hour, weekday } = parisParts(date);
  if (weekday === 0) return false; // dimanche
  if (HOLIDAYS.has(ymd)) return false;
  return hour >= PROACTIVE_START_HOUR && hour < PROACTIVE_END_HOUR;
}

/**
 * Prochain instant autorisé (délai en ms à passer à BullMQ).
 * Avance heure par heure — simple, correct, et trivial à tester.
 */
export function delayUntilNextWindow(from: Date = new Date()): number {
  const cursor = new Date(from);
  for (let i = 0; i < 24 * 8; i++) {
    if (canSendProactive(cursor)) return Math.max(0, cursor.getTime() - from.getTime());
    cursor.setTime(cursor.getTime() + 15 * 60 * 1000);
    // aligne le curseur sur le quart d'heure pour des délais propres
    cursor.setSeconds(0, 0);
  }
  throw new Error("Aucune fenêtre d'envoi trouvée sous 8 jours (fériés manquants ?)");
}

/** Plage de silence du patron (notifications non urgentes différées). */
export function withinQuietHours(opts: { start: number; end: number; date?: Date }): boolean {
  const { hour } = parisParts(opts.date ?? new Date());
  const { start, end } = opts;
  if (start === end) return false;
  // plage qui traverse minuit (ex 21h → 7h)
  if (start > end) return hour >= start || hour < end;
  return hour >= start && hour < end;
}
