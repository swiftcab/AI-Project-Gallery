import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    testTimeout: 10_000,
    // Les suites d'intégration partagent une seule base Postgres et des
    // assertions sur des compteurs globaux (ex: nombre total de comptes) —
    // en parallèle sur plusieurs fichiers, ces suites se marchent dessus
    // (chacune nettoie/lit la même table en même temps). Les tests unitaires
    // n'en souffrent pas (rapides, isolés) : le coût de la séquentialité est
    // négligeable pour le gain de fiabilité.
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
