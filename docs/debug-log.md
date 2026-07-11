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
