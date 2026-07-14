# Stratégie de test — alignement ISTQB (niveaux 1-2-3)

Cartographie des niveaux de test ISTQB sur l'outillage réel du repo. Règle
transverse (CI) : **tout doit être déterministe** — `FakeLLMProvider`,
`FakeMessagingProvider`, Stripe injecté (`setStripeForTests`) ; zéro appel
réseau en CI. Le LLM réel ne vit que dans `test:prompts` (manuel, budget capé).

## Niveau 1 — Tests de composants (unit)

- **Où** : `tests/unit/` · **Commande** : `npm test` · **CI** : bloquant
- **Quoi** : guardrails (regex prix/délai, cas bloqués ET légitimes), state
  machine, fenêtres horaires légales, config env (refus modèles dépréciés),
  prompts versionnés, tour d'agent avec LLM fake, **billing** (plans,
  checkout 400/503/200, signature webhook rejetée).
- **Règle** : chaque nouveau module = ses tests unitaires dans la même PR.
  Chaque bug corrigé = un test qui l'aurait attrapé (docs/debug-log.md).

## Niveau 2 — Tests d'intégration

- **Où** : `tests/integration/` · **Commande** : `INTEGRATION=1 npm run test:int`
  (Postgres + Redis réels) · **CI** : bloquant (services GitHub Actions)
- **Quoi** : flux critiques de bout en bout côté serveur — appel manqué →
  greeting → tour d'agent → qualification → notification patron ; opt-out
  STOP en gateway ; API `/api/ops/*` (auth Bearer, création de compte).
- **Frontière** : les fournisseurs externes restent des fakes ; la base et
  la queue sont réelles.

## Niveau 3 — Tests système (E2E)

- **Où** : `tests/e2e/` (Playwright) · **Commande** : `npm run test:e2e`
  contre l'app **bâtie et servie** (`npm run build && npm run start`)
- **Quoi** : smoke des parcours vitaux sur le déployable réel — landing
  complète rendue (3 plans visibles : la régression d'apparition au scroll ne
  peut pas revenir), checkout qui dégrade proprement sans config Stripe,
  health check structuré, robots.txt qui protège les pages internes.
- **CI** : job `e2e` séparé (build + services), bloquant.
- **Complément production** : le watchdog (`ops/watchdog.sh`, 5 min) et la
  sentinelle Hermes jouent le rôle de tests système CONTINUS en prod —
  même niveau ISTQB, autre moment du cycle.

## Hors pyramide CI (mais dans la stratégie)

| Suite | Rôle | Quand |
|---|---|---|
| `npm run test:prompts` | Régression des prompts sur le VRAI DeepSeek (~10 cas, guardrails + extraction) | Manuel, OBLIGATOIRE avant d'activer une nouvelle version de prompt |
| `ops/security-audit.sh` | Audit sécurité vs baseline | Hebdo (cron Hermes) + à la demande |
| Test "wow" onboarding | Acceptance utilisateur réel (appel manqué vécu) | À chaque onboarding pilote |

## Politique d'échec

Un test rouge en CI bloque le merge — pas d'exception, pas de skip ajouté
pour "passer". Un test flaky est un bug : il se corrige ou se supprime avec
justification dans la PR, jamais ignoré.
