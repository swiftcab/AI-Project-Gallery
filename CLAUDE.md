# Décroché — conventions du repo (pour humains et agents IA)

Agent IA de qualification des appels manqués pour artisans BTP.
Lire `docs/PRD.md` avant toute modification de comportement produit.

## Stack
Next.js (App Router) + Prisma/PostgreSQL + Redis/BullMQ + DeepSeek (`deepseek-v4-flash`).
Un seul déployable : app Next + process worker (`src/worker.ts`), Docker Compose sur VPS.

## Commandes
- `npm run dev` / `npm run worker` — dev local (Postgres+Redis via `docker compose up postgres redis`)
- `npm run typecheck` && `npm test` — DOIT être vert avant tout commit
- `INTEGRATION=1 npm run test:int` — flux critiques (nécessite Postgres+Redis)
- `npm run test:prompts` — régression prompts sur le VRAI DeepSeek ; OBLIGATOIRE avant d'activer une nouvelle version de prompt ; jamais en CI
- `npm run db:migrate:dev` / `db:seed` / `account:create`

## Règles non négociables
1. **Jamais de prix, délai ou engagement dans une réponse au prospect.**
   Défense en 3 couches : prompt → `src/agent/guardrails.ts` (regex déterministes,
   testées) → AuditEvent. Toute nouvelle regex = test dans `tests/unit/guardrails.test.ts`
   (cas bloqués ET cas légitimes non bloqués).
2. **Opt-out (STOP) traité dans la gateway** (`api/hooks/sms`), jamais par le LLM.
   `Lead.optedOut` est aussi vérifié au dernier moment dans `sendToLead`.
3. **Aucun prompt inline dans le code.** Prompts = fichiers versionnés
   `prompts/<agent>/<vN>.system.md`. Modifier un prompt = NOUVELLE version +
   entrée CHANGELOG + `test:prompts` vert. Jamais d'édition d'une version publiée.
4. **Aucun envoi externe (SMS/LLM) dans une route HTTP** — tout passe par BullMQ
   (`src/queues/`). Les webhooks écrivent en base et enqueue, c'est tout.
5. **SMS proactifs (nudge, notifs différées) uniquement via `src/lib/sendWindow.ts`**
   (8h–21h Paris, jamais dimanche/férié — règles opérateurs FR).
6. **CI déterministe** : les tests unitaires/intégration utilisent `FakeLLMProvider`
   et `FakeMessagingProvider`, zéro appel réseau. Le LLM réel ne vit que dans
   `test:prompts` (budget capé).
7. **Modèle LLM** : `deepseek-chat`/`deepseek-reasoner` sont dépréciés et refusés
   par la config. Swap de fournisseur = nouvel adapter `src/lib/llm/`, rien d'autre.
8. Logs Pino structurés avec `conversationId` (corrélation). Pas de PII en clair
   (redaction configurée dans `src/lib/logger.ts`).

## Boucle de debug
Un incident de conversation se rejoue avec : `Conversation.promptVersion` +
`Message.llmRaw` + l'historique `Message`. Chaque fix suit le format de
`docs/debug-log.md` (symptôme → cause → fix → test ajouté) et AJOUTE un test.

## Dette
Tout raccourci assumé va dans `docs/tech-debt.md` avec son plan de remboursement.
