# PROJECT LOG — Décroché : piste d'audit et décisions

## 14/07/2026

### 🔴 Incident sécurité — Clés compromises
**Cause** : Les clés Stripe et Telegram ont transité dans des fichiers et messages Hermes.
**Action** : À régénérer par le fondateur (Stripe Dashboard + @BotFather Telegram).
**Leçon** : Les credentials ne DOIVENT JAMAIS être dans les fichiers du repo ou dans les messages. 
- Stripe → uniquement dans `.env` sur le VPS
- Telegram → uniquement dans config Hermes
- Toujours utiliser `***` dans les commits

### ✅ Correction landing page
**Cause** : Hermes a poussé une page avec Tailwind non installé, liens 404, stats inventées.
**Fix** : Claude Code a restauré la version vérifiée + tests Playwright E2E.
**Leçon** : Ne pas modifier du code React/Next.js sans build/test. Flux PR recommandé.

### ✅ Stripe Checkout déployé
3 plans dans `src/lib/pricing.ts` : Découverte gratuit / Pro 79€ / Artisan+ 149€
API : `/api/checkout` crée session, `/api/hooks/stripe` webhook confirme paiement.

### ✅ Tests ISTQB N1-2-3
N1 : Unitaires (vitest) — déjà existants
N2 : Intégration (vitest + base réelle) — déjà existants  
N3 : E2E (Playwright) — ajoutés par Claude Code, vérifiés en local

### 🔄 Décision en attente
**Flux PR-revue** : Claude Code recommande de passer en Pull Request + revue avant merge.
À trancher par le fondateur.
