# Automatisation — CD, interface Cowork/Hermes, domaine

Ce document explique comment le déploiement et l'exploitation de Décroché
sont automatisés, et comment un agent (Cowork, Hermes, ou tout autre)
interagit avec le système sans jamais avoir besoin d'un accès SSH direct.

## Pourquoi pas d'accès SSH direct pour l'agent

Deux raisons, pas une seule commodité technique :
1. **Réseau** : une session Claude Code dans le cloud (comme celle qui a
   écrit ce code) n'a pas d'accès sortant arbitraire — testé, le port 22
   est bloqué par la politique réseau de l'environnement. Un agent cloud ne
   peut physiquement pas se connecter en SSH à votre VPS.
2. **Sécurité** : même quand c'est techniquement possible (Hermes, qui
   tourne *sur* le VPS, en est capable), donner un accès shell root complet
   à un agent pour une tâche qui ne nécessite que "créer un compte" ou
   "vérifier le statut" est une surface d'attaque disproportionnée. On
   expose uniquement ce qui est nécessaire, jamais plus.

D'où l'architecture à trois couches ci-dessous : chaque couche a le
minimum de pouvoir nécessaire à son rôle.

## Couche 1 — Déploiement continu (GitHub Actions)

`.github/workflows/deploy.yml` : à chaque push sur la branche de production
(`claude/construction-ai-sales-agent-felxyp`), GitHub Actions se connecte en
SSH à votre VPS avec une **clé dédiée au déploiement uniquement** (jamais vue
par moi, jamais vue par un agent cloud) et exécute `git pull` + rebuild +
migration + redémarrage + vérification santé.

**Secrets à ajouter une seule fois** dans GitHub (Settings → Secrets and
variables → Actions → New repository secret) :

| Secret | Valeur |
|---|---|
| `DEPLOY_HOST` | IP publique de votre VPS |
| `DEPLOY_USER` | `deploy` (créé par `ops/bootstrap.sh`) |
| `DEPLOY_SSH_KEY` | clé privée **dédiée**, générée en local (jamais réutilisée ailleurs) |

Génération de la clé (en local, sur votre machine — pas dans ce chat) :
```bash
ssh-keygen -t ed25519 -f decroche_deploy_key -C deploy@decroche -N ""
```
- Collez le contenu de `decroche_deploy_key` (la **privée**) dans le secret
  GitHub `DEPLOY_SSH_KEY`.
- Collez le contenu de `decroche_deploy_key.pub` (la **publique**) dans
  `/home/deploy/.ssh/authorized_keys` sur le VPS (`ops/bootstrap.sh` prépare
  le fichier, vide, prêt à recevoir cette clé).
- Supprimez la copie locale des deux fichiers une fois faite (ou gardez-la
  dans un gestionnaire de secrets, jamais dans ce repo).

**Déclenchement manuel** (utile pour Cowork/Hermes ou vous-même, sans push) :
```bash
gh workflow run deploy.yml --repo swiftcab/AI-Project-Gallery
```
Ceci nécessite un token GitHub avec accès Actions — même logique : le token
va dans la config de l'agent qui l'appelle, jamais dans ce repo.

## Couche 2 — Interface HTTP pour agents (`/api/ops/*`)

Une fois l'app déployée, elle expose une petite API pensée pour être appelée
par Cowork/Hermes en continu (santé, onboarding client) — volontairement
**pas** de déploiement ni d'exécution shell arbitraire ici (cf. rationale
ci-dessus). Protégée par un unique token Bearer (`OPS_API_TOKEN` dans `.env`
du VPS, à générer avec `openssl rand -hex 32`).

| Endpoint | Méthode | Usage |
|---|---|---|
| `/api/ops/status` | GET | Santé produit : comptes, leads/qualifiés/guardrails des dernières 24h |
| `/api/ops/accounts` | POST | Onboarder un compte pilote (voir schéma ci-dessous) |

```bash
curl -H "Authorization: Bearer $OPS_API_TOKEN" https://qualifyourlead.com/api/ops/status

curl -X POST https://qualifyourlead.com/api/ops/accounts \
  -H "Authorization: Bearer $OPS_API_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "companyName": "Plomberie Karim", "trade": "PLOMBIER",
    "ownerFirstName": "Karim", "ownerMobile": "+33612345678",
    "voiceNumber": "+33900000001", "smsNumber": "+33700000001",
    "email": "karim@example.fr", "departments": ["69","01"]
  }'
```

Volontairement absent de cette API (cf. `src/app/api/ops/accounts/route.ts`) :
provisioning automatique des numéros Twilio/smsmode (dette `tech-debt.md`
#2 — reste manuel), suppression/désactivation de compte, toute action qui
touche à l'argent ou aux communications externes. Ce qui est sûr à
automatiser l'est ; ce qui ne l'est pas reste un geste humain délibéré.

## Couche 3 — Interface humaine (`/ops`)

Page `https://qualifyourlead.com/ops` (protégée par le même Basic Auth que
`/leads`, `DASHBOARD_USER`/`DASHBOARD_PASS`) : mêmes métriques que
`/api/ops/status`, plus un formulaire de création de compte pilote — pour
vous, sans écrire de commande. Elle appelle la même fonction partagée que
l'API (`src/lib/ops/createAccount.ts`), donc les deux interfaces restent
toujours cohérentes entre elles (une seule implémentation).

## Couche 4 — Hermes (exécution locale sur le VPS)

Hermes tourne déjà sur votre VPS (`Hermes WebUI`, vu dans votre panel
Hostinger) : il a un accès local légitime au système de fichiers et au shell,
contrairement à un agent cloud. Deux façons de le brancher, selon ce que
vous préférez :
- **Le plus simple** : Hermes appelle `/api/ops/*` en HTTP comme n'importe
  quel agent (couche 2), avec le token `OPS_API_TOKEN` dans sa config.
- **Le plus direct** (pour ce que l'API n'expose pas exprès, ex. prospection) :
  Hermes exécute directement les scripts déjà prévus pour ça, dans le
  répertoire de l'app sur le VPS : `npm run leads:generate`,
  `ops/backup.sh`, `npm run db:seed`. Ces scripts ont accès aux clés
  (Apify/Gemini) via le `.env` du VPS — jamais transmises à un agent cloud.

Je n'ai pas branché `leads:generate` derrière `/api/ops/*` volontairement :
c'est un script qui consomme des API payantes (Apify, Gemini) — l'exposer
en HTTP demanderait une protection anti-abus (quota, verrou anti-double-run)
que je n'ai pas voulu bâtir à moitié. Exécution locale par Hermes = plus
simple et plus sûr tant que le volume reste artisanal.

## Domaine — qualifyourlead.com

VPS : `srv1445056.hstgr.cloud`, IP publique **187.77.171.238** (relevé
2026-07-11 dans le panel Hostinger — si le VPS est recréé un jour, cette IP
change et les enregistrements DNS ci-dessous doivent être mis à jour, mais
rien dans le code ne la code en dur : `.github/workflows/deploy.yml` lit
`secrets.DEPLOY_HOST`).

1. Chez le registrar du domaine (Hostinger → Domaines → Zone DNS, si
   `qualifyourlead.com` y est aussi enregistré ; sinon chez le registrar où
   il a été acheté) : ajouter
   - Enregistrement **A**, hôte `@`, valeur `187.77.171.238`
   - Enregistrement **A**, hôte `www`, valeur `187.77.171.238`
2. Récupérer l'IP publique du VPS (panel Hostinger → VPS → Aperçu général) —
   utile pour vérifier qu'elle n'a pas changé avant de relancer certbot.
3. Propagation : quelques minutes à quelques heures. Vérifier avec
   `dig qualifyourlead.com +short`.
4. Une fois propagé : `certbot --nginx -d qualifyourlead.com -d www.qualifyourlead.com`
   (déjà dans `ops/bootstrap.sh`, à relancer seul si le DNS n'était pas encore prêt).

`ops/nginx.conf` et `.env.example` pointent déjà vers `qualifyourlead.com` —
rien d'autre à changer dans le code une fois le DNS branché.

## Checklist de mise en route (dans l'ordre)

1. [ ] `ssh-keygen` en local → clé de déploiement (voir Couche 1)
2. [ ] Coller la clé **publique** dans le Terminal Hostinger, dans
       `ops/bootstrap.sh` avant de le lancer (ou juste après, dans
       `/home/deploy/.ssh/authorized_keys`)
3. [ ] Lancer `ops/bootstrap.sh` dans le Terminal Hostinger (root)
4. [ ] Compléter `/opt/decroche/.env` sur le VPS (secrets réels, y compris
       `OPS_API_TOKEN`)
5. [ ] Pointer le DNS `qualifyourlead.com` vers l'IP du VPS
6. [ ] `certbot --nginx -d qualifyourlead.com -d www.qualifyourlead.com`
7. [ ] Premier démarrage manuel (commandes dans `ops/bootstrap.sh` / runbook §3)
8. [ ] Ajouter les 3 secrets GitHub (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`)
9. [ ] Push sur la branche → vérifier que le workflow `deploy.yml` passe au vert
10. [ ] Configurer les webhooks Twilio/smsmode vers `https://qualifyourlead.com/api/hooks/*`
11. [ ] Onboarder le premier compte via `/ops` ou `/api/ops/accounts`
