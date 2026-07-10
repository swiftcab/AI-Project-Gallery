import { describe, expect, it } from "vitest";
import { canSendProactive, delayUntilNextWindow, holidaysCoverYear, withinQuietHours } from "@/lib/sendWindow";

// Dates en UTC ; en juillet Paris = UTC+2.
const parisDate = (iso: string) => new Date(iso);

describe("fenêtre d'envoi proactif (règles opérateurs FR)", () => {
  it("autorise un mardi 10h Paris", () => {
    expect(canSendProactive(parisDate("2026-07-07T08:00:00Z"))).toBe(true); // 10h Paris
  });
  it("bloque à 22h30 Paris", () => {
    expect(canSendProactive(parisDate("2026-07-07T20:30:00Z"))).toBe(false);
  });
  it("bloque à 7h Paris (avant 8h)", () => {
    expect(canSendProactive(parisDate("2026-07-07T05:00:00Z"))).toBe(false);
  });
  it("bloque le dimanche même à 15h", () => {
    expect(canSendProactive(parisDate("2026-07-12T13:00:00Z"))).toBe(false); // dimanche
  });
  it("bloque le 14 juillet (férié)", () => {
    expect(canSendProactive(parisDate("2026-07-14T09:00:00Z"))).toBe(false);
  });
  it("le calendrier des fériés couvre l'année courante et la suivante", () => {
    const y = new Date().getFullYear();
    expect(holidaysCoverYear(y)).toBe(true);
    expect(holidaysCoverYear(y + 1)).toBe(true);
  });
});

describe("delayUntilNextWindow", () => {
  it("retourne 0 quand on est déjà dans la fenêtre", () => {
    expect(delayUntilNextWindow(parisDate("2026-07-07T08:00:00Z"))).toBe(0);
  });
  it("saute la nuit : 23h → ~9h de délai minimum", () => {
    const delay = delayUntilNextWindow(parisDate("2026-07-07T21:00:00Z")); // 23h Paris
    expect(delay).toBeGreaterThan(8 * 3600 * 1000);
    expect(delay).toBeLessThan(10 * 3600 * 1000);
  });
  it("saute le dimanche entier", () => {
    const delay = delayUntilNextWindow(parisDate("2026-07-12T08:00:00Z")); // dimanche 10h
    expect(delay).toBeGreaterThan(20 * 3600 * 1000); // au moins jusqu'à lundi 8h
  });
});

describe("plage de silence patron (traverse minuit)", () => {
  it("21h→7h : 23h Paris est dans la plage", () => {
    expect(withinQuietHours({ start: 21, end: 7, date: parisDate("2026-07-07T21:00:00Z") })).toBe(true);
  });
  it("21h→7h : 12h Paris est hors plage", () => {
    expect(withinQuietHours({ start: 21, end: 7, date: parisDate("2026-07-07T10:00:00Z") })).toBe(false);
  });
  it("start === end = plage désactivée", () => {
    expect(withinQuietHours({ start: 0, end: 0, date: parisDate("2026-07-07T22:00:00Z") })).toBe(false);
  });
});
