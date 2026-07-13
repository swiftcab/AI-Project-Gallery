# CLAUDE-MISSION.md — Mission complète Décroché

## Architecture Hermes ↔ Claude Code

```
Fondateur → Hermes (COO/DevOps) ↔ Claude Code (CTO/Développement)
                 ↕                           ↕
           VPS Production              GitHub Repository
         - Monitoring 24/7            - Code source
         - 7 crons actifs             - Features produit
         - Santé infra                - Landing page
         - Rapports Telegram          - Stripe paiement
```

**Règles de synchronisation :**
1. Claude Code push sur `claude/construction-ai-sales-agent-felxyp`
2. Hermes détecte automatiquement les nouveaux commits via cron
3. Hermes rebuild/déploie si nécessaire
4. Toujours `git pull --rebase` avant push (évite les conflits avec Hermes)

## Mission 1 — Landing page (PRIORITAIRE)

### Design (inspiré 21st.dev)
- Thème sombre (dark mode) avec accents cyan/bleu (#06b6d4 → #3b82f6)
- Animations : fade-in au scroll, micro-interactions hover, gradients dynamiques
- Typographie : gras, impactante (taille héro 5xl-7xl)
- Responsive mobile-first (artisans sur téléphone)
- Performant (RSC, images optimisées)

### Structure
```
/  → Landing complète (héro, features, pricing, FAQ, CTA)
/onboarding → Inscription (email, métier, téléphone, numéro)
/dashboard/leads → Liste leads qualifiés
/dashboard/settings → Config (géographie, horaires)
/api/checkout → Stripe Checkout session
/api/webhook/stripe → Stripe webhook notifications
```

### Sections landing
1. **Hero** : "Ne perdez plus jamais un client parce que vous étiez sur un chantier" + CTA "Essai gratuit 14 jours"
2. **Statistiques** : 3 sec réponse, 21x plus de leads, 79€/mois
3. **Comment ça marche** : 3 étapes visuelles
4. **Pricing** : Gratuit (14j) / Pro 79€ / Artisan+ 149€ (avec mise en avant Pro)
5. **Témoignages** : Placeholder
6. **FAQ** : RGPD, fonctionnement, résiliation
7. **CTA final**

### Stripe paiement (config)
- Stripe Checkout pour les 3 plans
- Webhook `/api/webhook/stripe` pour confirmer les paiements
- Pricing dans `src/lib/pricing.ts`

### Stripe Keys
Les mettre dans `.env.local` :
```
STRIPE_SECRET_KEY=*** (à ajouter dans .env)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=*** (récupérer dans le dashboard Stripe)
```

## Mission 2 — Tests ISTQB + Watchdog

### Tests existants dans le repo
- `tests/unit/guardrails.test.ts` — 5 blocs de test
- `tests/unit/stateMachine.test.ts` — transitions
- `tests/unit/qualifier.test.ts` — agent turns
- `tests/unit/sendWindow.test.ts` — fenêtres horaires
- `tests/unit/config.test.ts` — validation env
- `tests/unit/prompts.test.ts` — prompts
- `tests/integration/flow.test.ts` — flux complet
- `tests/integration/ops.test.ts` — API ops

### Nouvelles règles de qualité (ISTQB)
- Chaque nouveau module DOIT avoir des tests unitaires
- Les tests CI doivent passer avant merge
- Niveau 1 : Tests unitaires (déterministes)
- Niveau 2 : Tests intégration (avec base réelle)
- Niveau 3 : Tests système (watchdog E2E)

## Mission 3 — Marketing outbound

### Sources de prospects (Apify + Google Maps)
- Apify Actor `compass~crawler-google-places` pour scraper
- Cibles : plombiers, électriciens, chauffagistes, maçons par département
- Chercher les emails sur les sites via Google Maps scraper
- Enrichir avec le numéro de téléphone pour qualification

### Email outreach
- Séquences automatisées (7 jours) :
  1. Jour 1 : "Vous avez raté des appels cette semaine ?"
  2. Jour 3 : "Votre répondeur ne qualifie pas vos clients"
  3. Jour 5 : "Décroché vous répond déjà [prénom]"
  4. Jour 7 : "14 jours gratuits - testez sans CB"
  5. Jour 10 : Suivi + offre 79€/mois
  6. Jour 14 : "Dernière chance essai gratuit"
  7. Jour 21 : Offre spéciale 49€/mois limitée

## Mission 4 — Chatbot Telegram IA

### Architecture
- Bot Telegram (token : 8685856014:AAHwF4JJoQWBmmNGwEgJslzsjDMu9RkhmxY)
- Backend : DeepSeek v4-flash via l'API Décroché
- Fonctionnalités :
  - Recevoir les notifications de leads qualifiés
  - Consulter les leads récents
  - Interagir avec le fondateur en langage naturel
  - Commandes : /status, /leads, /rapport, /aide

## Mission 5 — Objectif 10 000€ MRR / 60 jours

### Funnel (Alex Hormozi / Russell Brunson)
1. **Lead magnet** : Guide "5 astuces pour ne plus perdre un client sur le chantier" (opt-in email)
2. **Essai gratuit** : 14 jours sans CB
3. **Conversion** : À J+14, demande de CB ou arrêt
4. **Upsell** : Pro → Artisan+ (50€ de plus, multi-comptes)
5. **Downsell** : Abandon → offre à 49€/mois

### KPIs
| Métrique | Objectif |
|---|---|
| Leads/semaine | 100 |
| Taux de conversion essai → payant | 20% |
| MRR J30 | 790€ (10 clients) |
| MRR J60 | 10 000€ (130 clients) |
| Coût acquisition client | < 30€ |
| LTV | > 500€ |

### Channels de distribution
1. **Google Maps** (Apify) + Email outreach
2. **Facebook groups** artisans BTP
3. **LinkedIn** (posts techniques)
4. **Bouche-à-oreille** via les premiers clients
5. **PagesJaunes** référencement
