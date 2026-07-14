import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

// Environnements avec Chromium pré-installé (sandbox Claude Code) : on
// l'utilise au lieu de télécharger. En CI, `playwright install` fournit le sien.
const PREINSTALLED_CHROMIUM = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/**
 * Tests système (ISTQB niveau 3) — exercent l'application COMPLÈTE bâtie et
 * servie, pas des modules isolés. Cf. docs/testing-strategy.md.
 *
 * Local :  npm run build && npm run start &  puis  npm run test:e2e
 * CI :     job "e2e" de .github/workflows/ci.yml (build + services réels)
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 1280, height: 900 },
    ...(existsSync(PREINSTALLED_CHROMIUM) && !process.env.CI
      ? { launchOptions: { executablePath: PREINSTALLED_CHROMIUM } }
      : {}),
  },
  reporter: process.env.CI ? "github" : "list",
});
