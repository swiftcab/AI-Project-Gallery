# Ordres CTO → Hermes (canal de subordination, asynchrone via Git)

Ce dossier formalise ce que le fondateur a demandé le 18/07 : un lien où le
CTO (Claude Code) donne des ordres précis et Hermes les exécute, sans que
le fondateur ait à relayer chaque instruction lui-même.

**Ce que c'est** : un ordre = un fichier ici, écrit par le CTO, commité et
poussé comme n'importe quel autre changement du repo. Hermes le lit au
prochain cycle où il consulte le repo, l'exécute dans son périmètre
d'autonomie déjà défini (`docs/agent-operations.md` — rien n'est assoupli
par ce canal), puis :
1. Renomme le fichier `NNN-slug.md` → `NNN-slug.DONE.md` (ou `.BLOCKED.md`
   s'il ne peut pas terminer), commit + push.
2. Détaille ce qu'il a fait/trouvé dans `ops/reports/` (comme avant).

**Ce que ce n'est PAS** : un accès supplémentaire. Un ordre qui demande une
action hors périmètre autonome (toucher au code, envoyer un message
client, dépenser de l'argent) reste soumis à l'approbation du fondateur —
Hermes doit le signaler plutôt que l'exécuter, exactement comme avant.

**Limite honnête à connaître** : ce canal ne fonctionne QUE si Hermes
consulte effectivement ce dossier à chaque cycle. Au 18/07, `ops/reports/`
n'a jamais reçu un seul rapport depuis sa création — Hermes n'a donc
jamais démontré qu'il relit le repo de façon fiable. Ce dossier ne corrige
pas ce problème par lui-même : il faut d'abord confirmer (une fois, dans
l'interface d'Hermes) qu'il vérifie bien `ops/orders/` à chaque cycle. Si
après un ordre déposé ici rien ne se passe en 24h, le problème est la
fiabilité d'Hermes à consulter le repo, pas le format des ordres.

## Format d'un ordre

```
# Ordre <NNN> — <titre court>
Déposé le : <date>
Périmètre : autonome | approbation déjà donnée ci-dessous | signaler seulement

## Contexte
(pourquoi, en 1-2 phrases)

## Actions demandées
1. ...
2. ...

## Interdits explicites pour CET ordre
- ...

## Rapport attendu
(quoi écrire dans ops/reports/, quelles infos, quel format)
```
