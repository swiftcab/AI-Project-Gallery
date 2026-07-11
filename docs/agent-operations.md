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

Le lien entre les deux agents est **le repo Git** : le CTO pousse du code/des
docs → le pipeline CD déploie → Hermes opère le résultat sur le VPS et remonte
les signaux (logs, incidents, métriques) au fondateur, qui peut les rapporter
au CTO ici pour analyse. Ni magie ni couplage direct : un artefact versionné,
auditable, réversible. C'est volontaire.

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

## Rapport quotidien (mis en place côté CTO)

Une Routine planifiée tourne dans la session Claude Code du fondateur,
chaque jour ouvré à ~8h Paris. Elle produit un rapport court :
1. **Réalisations** — commits/déploiements des dernières 24h (lu depuis GitHub).
2. **Prochaines actions classées** — impact CA d'abord (pilotes, outreach,
   conversion), amélioration du service ensuite (dette, qualité, prompts).
3. **Décisions en attente du fondateur** — avec recommandation.
Les métriques d'exploitation temps réel (leads/24h, urgences) viennent
d'Hermes via `/api/ops/status` — le CTO cloud n'a pas accès réseau au VPS
(sandbox), c'est le point quotidien Telegram d'Hermes qui les porte.

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
| 1 | GitHub | lire les issues/PR, déclencher `workflow_dispatch` du deploy | lecture + 1 action |
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

Anti-patterns à refuser : donner à Hermes le token GitHub avec droits d'écriture
sur le code (le code passe par le CTO + revue), un accès SQL en écriture
(tout écrit passe par l'API `/api/ops/*` validée), ou un accès aux secrets
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
