import { expect, test } from "@playwright/test";

/**
 * Smoke système (ISTQB niveau 3) : l'app bâtie sert les parcours vitaux.
 * Volontairement peu de tests, mais sur le déployable réel.
 */

test("la landing rend son contenu complet (hero, pricing 3 plans, FAQ)", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("chantier");
  // les 3 plans sont visibles (le bug d'apparition au scroll ne doit jamais revenir)
  await expect(page.locator(".plan")).toHaveCount(3);
  await expect(page.locator(".plan-highlight")).toContainText("79 €");
  await expect(page.locator(".faq details").first()).toBeVisible();
});

test("le checkout sans Stripe configuré retombe proprement (pas d'erreur brute)", async ({ request }) => {
  const res = await request.post("/api/checkout", { data: { plan: "pro" } });
  // 200 (configuré) ou 503 (pas encore configuré) — jamais une 500
  expect([200, 503]).toContain(res.status());
  const body = await res.json();
  expect(body.url ?? body.error).toBeTruthy();
});

test("le health check répond avec sa structure", async ({ request }) => {
  const res = await request.get("/api/health");
  expect([200, 503]).toContain(res.status());
  const body = await res.json();
  expect(body.checks).toBeDefined();
});

test("les pages internes sont hors indexation (robots.txt)", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const txt = await res.text();
  expect(txt).toContain("Disallow: /leads");
  expect(txt).toContain("Disallow: /ops");
});
