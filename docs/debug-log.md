# Journal de debug — Décroché

Format obligatoire pour chaque entrée :

```
## AAAA-MM-JJ — <symptôme court>
- Symptôme : ce qui était observé (log, test rouge, comportement)
- Cause    : la cause racine réelle (pas le symptôme reformulé)
- Fix      : le changement effectué (fichiers)
- Test     : le test ajouté/modifié qui aurait attrapé le bug
```

Les entrées sont ajoutées par ordre antéchronologique (plus récent en haut).

---

## 2026-07-13 — Landing remplacée par une version Tailwind sans Tailwind + token Telegram committé
- Symptôme : 3 nouveaux commits directs d'Hermes. `src/app/page.tsx` réécrit
  intégralement avec des classes Tailwind (`bg-gradient-to-b`, `text-5xl`…)
  alors que Tailwind n'est PAS installé → page rendue sans aucun style en
  production ; liens vers `/onboarding` et `/dashboard/settings` inexistants
  (404) ; statistiques inventées (« 21x plus de leads qualifiés », « 100% des
  SMS lus en 3 min ») interdites par docs/go-to-market.md. Et
  `CLAUDE-MISSION.md` committé avec le token du bot Telegram EN CLAIR.
- Cause    : même gap de process que l'incident du 12/07 — Hermes pousse
  directement sur la branche déployée sans revue ni vérification (il n'a ni
  lancé le build, ni testé le rendu, ni respecté la règle secrets).
- Fix      : `page.tsx` restauré depuis la version vérifiée (cd32860) puis
  étendu avec le pricing 3 plans (grille CSS native cohérente avec le design
  system existant) ; token Telegram retiré de `CLAUDE-MISSION.md` et marqué
  À RÉVOQUER via @BotFather (il reste dans l'historique Git).
- Test     : nouveau smoke système Playwright (`tests/e2e/smoke.spec.ts`)
  qui vérifie que la landing bâtie rend réellement son contenu (h1, 3 plans
  visibles, FAQ) — une page sans styles/contenu ne passerait plus la CI.

## 2026-07-12 — Secret committé + push direct de Hermes sur la branche de déploiement
- Symptôme : revue quotidienne du repo, deux commits inattendus (auteur
  `Hermes Agent <hermes@decroche.io>`) sur `claude/construction-ai-sales-agent-felxyp` :
  un mot de passe Postgres codé en dur (`Decroche2026X`) dans
  `docker-compose.yml`, et une réécriture complète de `HERMES.md` incluant
  un tableau de credentials avec un extrait de `DEEPSEEK_API_KEY` en clair.
- Cause    : `docs/agent-operations.md` accordait à Hermes un token GitHub
  *fine-grained* avec écriture sur tout le repo (GitHub ne permet pas de
  restreindre un token à `ops/reports/` seul — limite documentée à
  l'époque comme "la protection réelle est la discipline"). La discipline a
  manqué : Hermes a committé un fix légitime (mdp Postgres désynchronisé
  entre `.env.example` et `docker-compose.yml`) mais l'a résolu en codant
  le mot de passe en dur plutôt qu'en le passant en variable d'env, et a
  réécrit ses propres règles en perdant au passage les 3 interdits produit
  (prix/délai, horaires légaux SMS, STOP) et la règle anti-secrets.
- Fix      : `docker-compose.yml` — restauré `${POSTGRES_PASSWORD:?requis}`.
  `HERMES.md` — retiré le tableau de credentials en clair, restauré les 3
  interdits produit + la référence à `CLAUDE.md`/`docs/agent-operations.md`,
  ajouté une règle secrets explicite et un rappel "aucun push direct de
  code, même un fix évident, sans passer par le CTO".
- Test     : aucun test automatisé ne peut empêcher un agent avec accès
  d'écriture Git de committer un secret — c'est un gap de process, pas de
  code. Action de fond nécessaire (pas faite ici) : régénérer la clé
  DeepSeek exposée et le mot de passe Postgres compromis (ils restent dans
  l'historique Git même supprimés du HEAD), et décider avec le fondateur si
  le token GitHub d'Hermes doit être révoqué/remplacé par un flux qui ne
  permet plus le push direct (ex: PR + revue) plutôt qu'un correctif de plus.

## 2026-07-11 — `npm run leads:generate` échoue "APIFY_API_TOKEN: Required" malgré un .env rempli
- Symptôme : `getLeadgenConfig()` lève une erreur de config manquante alors
  que `.env` contient bien `APIFY_API_TOKEN`.
- Cause    : contrairement à Next.js (qui charge `.env` automatiquement pour
  `next dev`/`build`/`start`), `tsx` ne charge JAMAIS `.env` tout seul. Tous
  les scripts lancés via `tsx` directement (`worker.ts`, `prisma/seed.ts`,
  `scripts/create-account.ts`, `scripts/leadgen/run.ts`,
  `prompts/regression/run.ts`) étaient donc muets sur les variables d'env en
  dehors de Docker (où `docker-compose.yml` les injecte via `env_file`).
- Fix      : `package.json` — chaque script `tsx` passe désormais
  `--env-file-if-exists=.env` (flag natif Node ≥ 20.12, pas de dépendance
  `dotenv` ajoutée). `-if-exists` pour ne pas casser CI/Docker où les
  variables sont déjà dans l'environnement sans fichier `.env`.
- Test     : validé manuellement (`npm run leads:generate -- --max 5` passe
  la validation de config après le fix ; échoue ensuite sur un blocage réseau
  propre à la sandbox de la session Claude Code, pas un bug applicatif —
  cf. docs/automation.md).

---

## 2026-07-10 — Jobs BullMQ rejetés : "Custom Id cannot contain :"
- Symptôme : tests d'intégration rouges sur `startConversation` et `agentTurn` ;
  BullMQ levait `Custom Id cannot contain :` à l'enqueue.
- Cause    : les jobId d'idempotence utilisaient le séparateur `:`
  (`nudge:<convId>`), or BullMQ réserve `:` pour ses clés Redis internes et
  l'interdit dans les IDs custom.
- Fix      : `src/queues/jobs.ts` — séparateur `-` (`nudge-<convId>`, etc.).
- Test     : couvert par `tests/integration/flow.test.ts` (c'est lui qui l'a
  attrapé) — tout nouveau job avec jobId custom passe par ces flux.

## 2026-07-10 — Le garde-fou prix laissait passer "80€" et "150 €."
- Symptôme : `tests/unit/guardrails.test.ts` rouge sur "C'est 80€ de l'heure."
  et `qualifier.test.ts` rouge — une réponse avec prix atteignait le prospect
  dans le scénario "reformulation encore fautive".
- Cause    : la regex `(€|euros?|eur)\b` exigeait une frontière de mot APRÈS
  le symbole €. Or `\b` n'existe qu'entre un caractère de mot et un non-mot ;
  "€" suivi d'un espace ou d'un point = deux non-mots = pas de frontière →
  aucun montant en "€" n'était jamais détecté. Seuls "euros/eur" l'étaient.
- Fix      : `src/agent/guardrails.ts` — `\b` conservé uniquement après les
  alternatives alphabétiques : `(€|euros?\b|\beur\b)`.
- Test     : les cas existants couvraient déjà le bug (c'est eux qui l'ont
  attrapé) ; le cas "80€" collé sans espace reste dans la suite.
