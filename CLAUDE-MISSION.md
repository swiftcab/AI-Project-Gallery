# Mission Claude Code — Décroché : Architecture Hermes ↔ Claude Code

## 1. Architecture de collaboration

```
[Fondateur (Telegram)]
    ↕
[Hermes Agent — COO technique] ←→ [Claude Code — CTO]
    ↕                                  ↕
[VPS Production]                  [Repo GitHub]
- Monitoring 24/7                  - Code produit
- Crons (sentinelle, backup)        - Landing page
- Santé infra                      - Composants 21st.dev
- Rapports quotidiens               - Stripe paiement
```

**Règles de collaboration :**
- **Claude Code** = responsable du CODE : features, landing page, composants, déploiement via CD
- **Hermes** = responsable de l'OPS : VPS, monitoring, crons, santé, rapports
- **Communication** : via GitHub (Claude Code push → Hermes voit les changements dans le repo)
- **Ne JAMAIS** modifier le travail de l'autre sans coordination explicite
- **Toujours** pull/rebase avant push pour éviter les conflits

## 2. Mission landing page

### Design
- Inspiré de 21st.dev (composants React, animations sophistiquées)
- Thème sombre (dark mode) avec accents cyan/bleu (cohérent avec la page existante)
- Animations : fade-in au scroll, micro-interactions, gradients dynamiques
- Responsive mobile-first (les artisans BTP sont sur téléphone)

### Sections obligatoires
1. **Hero** : proposition de valeur choc, CTA "Essai gratuit", preuve sociale (statistiques)
2. **Comment ça marche** : 3 étapes visuelles (appel manqué → SMS IA → fiche lead)
3. **Bénéfices** : "Ne perdez plus jamais un client parce que vous étiez sur un chantier"
4. **Pricing** : 3 plans — Gratuit (14j) / Pro 79€ / Artisan+ 149€
5. **Témoignages** : placeholder pour future preuve sociale
6. **FAQ** : questions fréquentes (RGPD, fonctionnement, résiliation)
7. **CTA final** : "Créez votre compte gratuitement — 14 jours sans CB"

### Technique
- Utiliser Tailwind CSS (déjà configuré dans Next.js)
- Utiliser Framer Motion ou CSS animations pour les transitions
- Composants React Server Components (RSC) pour la perf
- Stripe Checkout ou Stripe Elements pour le paiement
- i18n : français uniquement

## 3. Funnel de vente (Alex Hormozi / Russell Brunson)

1. **Lead magnet** : Guide gratuit "5 astuces pour ne plus perdre de clients quand on est sur un chantier" (PDF à télécharger)
2. **Email sequence** : 7 emails de nurturing (automatisé via SendGrid/Brevo)
3. **Call to action** : Essai gratuit 14 jours, pas de CB, activation en 5 min
4. **Upsell** : De "Pro" à "Artisan+" après 30 jours
5. **Downsell** : Si abandon du paiement, offre à 49€/mois limitée

## 4. Structure des pages

```
/                    → Landing page (hero + features + pricing + FAQ)
/onboarding          → Inscription (email + métier + téléphone)
/dashboard/leads     → Liste des leads qualifiés
/dashboard/settings  → Paramètres (périmètre géo, horaires)
/api/checkout        → Stripe Checkout session
/api/webhook/stripe  → Stripe webhook
/api/ops/*           → Endpoints pour Hermes
```

## 5. Tokenisation et optimisation DeepSeek

Le système utilise déjà `deepseek-v4-flash` (le plus rentable). Pour scaler :

| Tâche | Modèle | Max tokens | Coût estimé |
|---|---|---|---|
| Qualification SMS | deepseek-v4-flash | 700 | 0,003€/tour |
| Résumé patron | deepseek-v4-flash | 300 | 0,001€/appel |
| Landing page (LLM) | deepseek-v4-flash | 2000 | N/A |
| Email marketing | deepseek-v4-flash | 1000 | N/A |
| Analyse leads | deepseek-v4-flash | 500 | 0,001€/lead |

La config dans `src/lib/llm/` supporte le swap de modèle sans code.

## 6. Configuration Stripe

```env
STRIPE_SECRET_KEY=sk_live_*** (à ajouter dans .env sur le VPS)
```

➡️ **Ajouter la clé publiable** dans .env sur le VPS

## 7. Objectifs

- **J1** : Landing page déployée + Stripe connecté
- **J7** : Premier client payant
- **J30** : 10 clients → 790€ MRR
- **J60** : 130 clients → 10 000€ MRR

## 8. Comment Hermes et Claude Code synchronisent

1. Claude Code push sur GitHub → Hermes voit le commit via cron vérif-repo
2. Hermes rapporte "Nouveau commit : feat: landing page" au fondateur
3. Si modification du code nécessite rebuild Docker : Claude Code l'indique dans le commit message
4. Pour tout déploiement urgent : le fondateur contacte Hermes qui contacte Claude Code via le repo

## 9. Astuces marketing (Top 1% marketers)

- **Alex Hormozi** : L'offre doit être 10x meilleure ou 10x moins chère. Ici → 79€ vs 200€+ pour un télésecrétariat
- **Russell Brunson** : "Le prospect ne veut pas un appel qualifié, il veut ne PLUS JAMAIS perdre de client"
- **Copywriting** : Parler au "vous" des artisans, pas de jargon SaaS
- **Positionnement** : "Le télésecrétariat qui ne dort jamais" plutôt que "solution IA"
