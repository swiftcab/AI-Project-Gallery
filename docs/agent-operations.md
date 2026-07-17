# Opérations agentiques — Hermes (COO) × Claude Code (CTO/cerveau)

Ce document définit qui fait quoi entre les deux agents et le fondateur,
comment ils communiquent, et les limites d'autonomie de chacun. C'est le
fichier à faire lire à Hermes en premier (avec `CLAUDE.md` et `docs/PRD.md`).

## Répartition des rôles

| Rôle | Qui | Où | Responsabilités |
|---|---|---|---|
| **Fondateur (CEO)** | Vous | Partout | Décisions finales : prix, clients, dépenses, communication publique |
| **CTO / cerveau** | Claude Code (cette session + sessions futures) | Cloud (sandboxé) | Architecture, code, revues, docs, stratégie produit/business, rapport quotidien |
| **COO / opérateur** | Hermes | Sur le VPS (accès local réel) | Exécution : déploiements, prospection, monitoring, gestion clientèle de premier niveau |

Le lien entre les deux agents est **le repo Git**, dans les deux sens :
- CTO → VPS : le CTO pousse du code/des docs → le pipeline CD déploie →
  Hermes opère le résultat sur le VPS (`docs/automation.md`).
- VPS → CTO : Hermes écrit ses rapports (quotidien, incidents, audit
  sécurité) dans `ops/reports/` et les commit+push dans le repo. La Routine
  quotidienne du CTO (programmée 06:00 UTC) lit le dernier rapport présent
  via les outils GitHub et l'intègre à sa propre synthèse.

**Lien de subordination (ajouté 18/07, demande explicite du fondateur)** :
le CTO analyse une situation et rédige des ordres précis dans
`ops/orders/` (format et procédure dans `ops/orders/README.md` et
`HERMES.md` §LIEN DE SUBORDINATION) ; Hermes les exécute à chaque cycle,
strictement dans le périmètre d'autonomie défini plus bas dans ce
document — un ordre n'élargit jamais ce périmètre, il ne fait que dire
QUOI faire dans ce qui est déjà permis. Le fondateur garde le dernier mot
sur tout ce qui exige déjà une approbation (argent, clients, code,
infrastructure sensible) ; ce canal accélère l'exécution du travail
autonome, il ne retire aucun garde-fou. **Limite connue** : ce canal
suppose qu'Hermes consulte effectivement `ops/orders/` à chaque cycle —
à vérifier dans les faits (voir l'avertissement dans
`ops/orders/README.md`) plutôt que supposé acquis.

Aucune connexion directe entre les deux agents — ni MCP, ni API, ni accès
réseau du CTO vers le VPS (impossible techniquement, la session cloud du CTO
n'a pas d'accès sortant arbitraire, vérifié). Le contrôle est **asynchrone
et versionné** : chaque rapport d'Hermes est un commit, donc historisé,
diffable, et jamais perdu. C'est un choix, pas une limitation regrettable —
un COO qui rend des comptes par écrit, tracés, plutôt qu'un accès permanent
non audité.

## Charte COO — à coller telle quelle dans la configuration d'Hermes

```
Tu es le COO de Décroché (qualifyourlead.com), un SaaS de qualification
d'appels manqués pour artisans BTP. Ton périmètre et tes limites :

CE QUE TU FAIS EN AUTONOMIE (sans demander) :
- Surveiller la santé du service : GET /api/ops/status (token OPS_API_TOKEN
  dans /opt/decroche/.env), docker compose ps, logs worker.
- Relancer un conteneur unhealthy, relancer un job échoué, vérifier les
  backups (fichier du jour présent dans /opt/decroche/backups).
- Lancer la prospection : cd /opt/decroche && npm run leads:generate
  (max 1 run/semaine, coût Apify).
- Rédiger des brouillons : messages d'outreach, réponses clients, posts.
- Tenir à jour le fichier de suivi outreach (CSV) : statuts, relances dues.

CE QUI EXIGE MON APPROBATION EXPLICITE AVANT D'AGIR :
- Envoyer TOUT message externe (SMS, email, post) à un prospect ou client.
- Toute dépense ou souscription (numéros, API, outils).
- Créer/modifier/désactiver un compte client (POST /api/ops/accounts inclus).
- Modifier le code, un prompt, ou la configuration de production (.env).
- Toute action irréversible (suppression de données, résiliation).

CE QUE TU NE FAIS JAMAIS (même si je le demande dans la précipitation) :
- Donner un prix ou un délai d'intervention à un client final à la place
  d'un artisan (règle produit absolue).
- Envoyer des messages hors 8h-21h Paris, le dimanche ou un jour férié.
- Contourner un opt-out (STOP), sous aucun prétexte.
- Committer un secret dans le repo Git.

FORMAT DE COMMUNICATION (Telegram) :
- Signale les urgences immédiatement (service down, backup manquant,
  guardrail.blocked en hausse) : 2 lignes, fait + impact + action proposée.
- Sinon, groupe tout dans un point quotidien à 8h30 : ✅ fait / ⚠️ à
  surveiller / 🙋 décisions qui m'attendent.
- Quand tu demandes une approbation : une phrase de contexte, l'action
  exacte, le coût/risque, et ta recommandation. Jamais plus de 5 lignes.
```

## Surveillance en couches (watchdog)

Principe emprunté aux équipes de maintenance sérieuses : **jamais un LLM en
première ligne**. Le non-déterminisme et la latence d'un agent n'ont rien à
faire dans la détection ; ils excellent dans le diagnostic.

| Couche | Quoi | Fréquence | Répare |
|---|---|---|---|
| 0 | Healthchecks Docker + `restart: unless-stopped` (+ autoheal) | secondes | redémarrages instantanés |
| 1 | `ops/watchdog.sh` (cron shell, déterministe) | 5 min | restarts anti-flapping (max 3/h), purge disque, renew TLS, détection queue bloquée/backup manquant → écrit `ops/state/alerts.json` |
| 2 | Hermes (cron « sentinelle », voir `HERMES.md`) | 30 min | lit alerts.json, diagnostique via logs + runbook, répare dans son périmètre, trace dans `ops/state/incidents.md` |
| 3 | Fondateur (Telegram) / CTO (repo) | à la demande | décisions, changements de code |

Le silence du watchdog est lui-même surveillé : il pousse un heartbeat vers
un moniteur *Push* Uptime Kuma (option `KUMA_PUSH_URL` de
`ops/install-watchdog.sh`) — si le cron meurt, Kuma alerte.

Mise en place : `sudo bash /opt/decroche/ops/install-watchdog.sh` puis
donner `HERMES.md` à Hermes (section SETUP — il crée ses crons lui-même
avec son outil cron natif, livraison Telegram).

## Rapport quotidien (mis en place côté CTO)

Une Routine planifiée tourne dans la session Claude Code du fondateur,
chaque jour à 06:00 UTC. Elle produit un rapport court :
1. **Réalisations** — commits/déploiements des dernières 24h (lu depuis GitHub).
2. **Côté VPS** — lit le dernier fichier de `ops/reports/` poussé par Hermes
   (s'il existe ; sinon le dit explicitement, ne fabrique rien).
3. **Prochaines actions classées** — impact CA d'abord (pilotes, outreach,
   conversion), amélioration du service ensuite (dette, qualité, prompts).
4. **Décisions en attente du fondateur** — avec recommandation.
Les métriques d'exploitation temps réel (leads/24h, urgences) viennent
d'Hermes, par deux canaux complémentaires : Telegram (immédiat, pour vous)
et `ops/reports/` (versionné, pour la revue du CTO le lendemain).

## Brancher Telegram sur Hermes (10 min, une seule fois)

1. Dans Telegram, parler à **@BotFather** → `/newbot` → choisir un nom
   (ex. "Décroché Ops") et un identifiant (ex. `decroche_ops_bot`).
   BotFather donne un **token** (`123456:ABC-...`).
2. Ce token va dans la configuration d'Hermes sur le VPS (section
   messagerie/connecteurs de son interface — Hermes WebUI que vous avez déjà).
   Le token ne va NI dans le repo, NI dans le chat d'un agent cloud.
3. Envoyer un premier message au bot depuis votre Telegram pour ouvrir le
   canal, puis vérifier qu'Ermes répond.
4. Coller la charte COO ci-dessus dans le prompt système/personnalité d'Hermes.
5. Test de bout en bout : demander sur Telegram "statut du service" →
   Hermes doit appeler `/api/ops/status` et répondre en 3 lignes.

## MCP — outillage recommandé pour Hermes

Principe : **peu de serveurs, bien choisis, en lecture d'abord.** Chaque
outil connecté est une surface d'attaque et une source de distraction pour
l'agent. Ordre de branchement conseillé :

| Priorité | Serveur MCP | Usage | Mode |
|---|---|---|---|
| 1 | GitHub | lire les issues/PR, déclencher `workflow_dispatch` du deploy, **committer `ops/reports/`** (pont vers le CTO) | lecture + écriture scopée à `ops/reports/` |
| 2 | Filesystem (local VPS, scope /opt/decroche) | logs, CSV outreach, backups | lecture/écriture scopée |
| 3 | Telegram (natif Hermes) | canal fondateur | bidirectionnel |
| 4 | Postgres (lecture seule, utilisateur SQL dédié `hermes_ro`) | requêtes ad hoc sur les leads | lecture seule |
| plus tard | Stripe, HubSpot/CRM | quand il y aura des clients payants | lecture d'abord |

Créer l'utilisateur SQL lecture seule (à faire une fois sur le VPS) :
```sql
CREATE USER hermes_ro WITH PASSWORD '<généré>';
GRANT CONNECT ON DATABASE decroche TO hermes_ro;
GRANT USAGE ON SCHEMA public TO hermes_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hermes_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO hermes_ro;
```

**Token GitHub d'Hermes** : créer un *fine-grained personal access token*
(GitHub → Settings → Developer settings → Fine-grained tokens), scope
**Contents: Read and write**, limité au seul repo `swiftcab/AI-Project-Gallery`
— ce token permet le commit dans `ops/reports/` (ligne 1 du tableau
ci-dessus) mais n'a aucune permission spéciale sur `src/`, `prisma/` etc. au
niveau GitHub : la protection réelle est la discipline (Hermes ne modifie
JAMAIS de code, HERMES.md le lui interdit explicitement), pas un scope
technique par dossier — GitHub ne permet pas de restreindre un token à un
sous-répertoire. Le coller dans la configuration d'Hermes (jamais au CTO).

Anti-patterns à refuser : donner à Hermes un token GitHub avec droits sur
d'autres repos, un accès SQL en écriture (tout écrit passe par l'API
`/api/ops/*` validée), ou un accès aux secrets
`.env` en dehors du VPS.

## Évaluer l'efficacité de l'architecture agentique (questions à me poser ici)

Le fondateur peut interroger le CTO (cette session) à tout moment. Les bonnes
questions récurrentes, dans l'ordre d'importance business :
1. Combien de leads qualifiés livrés cette semaine, et combien rappelés < 1h ?
   (la métrique produit n°1 — si elle stagne, rien d'autre ne compte)
2. Taux de conversations FAILED / fallback statique ? (santé de l'agent LLM)
3. Combien de `guardrail.blocked` et pourquoi ? (qualité du prompt, risque)
4. Coût par conversation (SMS + LLM) vs 79 €/mo ? (marge réelle)
5. Combien d'interventions manuelles d'Hermes cette semaine ? (si ça monte,
   c'est un bug d'architecture, pas une charge normale)
