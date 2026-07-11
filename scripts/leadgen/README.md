# Prospection automatisée — scripts/leadgen

Génère un CSV de leads artisans BTP qualifiés selon les critères de
`docs/go-to-market.md` §3, priorisés et personnalisés par LLM.

## Pipeline
1. **Apify** (Google Maps Scraper) — une recherche par cible `métier x ville`
   définie dans `targets.json`.
2. **Filtres déterministes** (`criteria.ts`, zéro LLM, gratuits) : mobile
   06/07 visible, 10-80 avis Google, pas "ouvert 24/7", dédoublonnage par
   téléphone (y compris contre les runs précédents via `state/seen-phones.json`).
3. **Enrichissement DeepSeek** (`enrich.ts`, réutilise `src/lib/llm/deepseek.ts`
   — même fournisseur que le produit, un seul compte/budget à suivre) — 1
   accroche de contact + priorité HIGH/MEDIUM/LOW par lead, sans jamais
   inventer de fait sur l'entreprise.
4. **Export CSV** trié par priorité dans `research/leads/leads-<date>.csv`.

Gemini reste configurable (`GEMINI_API_KEY`/`GEMINI_MODEL`) mais **n'est pas
utilisé par défaut** : réservé à une future expérimentation de collecte via
son "grounding" Google Maps/Places, en complément d'Apify — pas branché tant
que ce n'est pas nécessaire (cf. "pas d'implémentation à moitié").

## Utilisation
```bash
cp .env.example .env   # puis renseigner APIFY_API_TOKEN (DEEPSEEK_API_KEY est déjà celle du produit)
npm run leads:generate                 # 100 leads (LEADGEN_MAX_LEADS)
npm run leads:generate -- --max 20     # test rapide, moins cher
```

## Avant un run de 100 leads
- Vérifier dans votre console Apify le coût par résultat de l'acteur
  `compass~crawler-google-places` (ou l'acteur que vous préférez — changez
  `APIFY_ACTOR_ID`) : le prix varie selon les champs demandés.
- Le script demande volontairement 0 avis détaillés et 0 photos par fiche
  (`apify.ts`) pour rester sur le tarif le plus bas.
- `LEADGEN_MAX_PER_QUERY` (défaut 40) plafonne chaque requête Apify — ajuster
  si `targets.json` a peu de cibles mais que vous voulez plus de résultats par ville.

## Étendre
- **Nouvelles villes/métiers** : éditer `targets.json`, aucun code à toucher.
- **Marché US (préparation)** : dupliquer `targets.json` en
  `targets.us.json` avec des villes anglophones et `queryTrade` en anglais
  ("plumber", "electrician"...), puis `--targets targets.us.json` (à ajouter
  dans `run.ts` si besoin — pas fait par défaut pour rester focalisé sur le
  MVP FR, cf. PRD §8 hors-scope international).
- **Automatiser (cron)** : ce script est idempotent (déduplication par
  téléphone) — un cron hebdomadaire est possible dès que le volume d'outreach
  manuel absorbe 100 leads/semaine. Pas fait au MVP (cf. mission : outreach
  manuel d'abord, cf. docs/go-to-market.md).

## Vérifier avant le premier run réel
Le schéma des champs retournés par l'acteur Apify communautaire évolue parfois
(noms de champs). Lancez d'abord `--max 5`, inspectez le CSV, et ajustez
`apify.ts`/`criteria.ts` si `phone`/`reviewsCount`/`totalScore` ne matchent pas.
