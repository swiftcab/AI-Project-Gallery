# Runbook de déploiement — VPS Hostinger

Cible : VPS Hostinger KVM 2 (2 vCPU / 8 Go) ou supérieur, Ubuntu 24.04 LTS.
Domaine : **qualifyourlead.com**. Durée totale du premier déploiement : ~45 min.

⚠️ Ce runbook couvre le **bootstrap initial** (une seule fois). Une fois fait,
les mises à jour suivantes passent par le pipeline CD automatique
(`.github/workflows/deploy.yml`) à chaque push — voir `docs/automation.md`.
`ops/bootstrap.sh` automatise les étapes 1 à 6 ci-dessous en un seul script à
coller dans le Terminal Hostinger (panel.hostinger.com → VPS → Terminal).

## 0. Prérequis
- Domaine `qualifyourlead.com` avec le DNS pointé sur l'IP du VPS
  (enregistrement A `@` + `www`).
- Comptes fournisseurs : DeepSeek (clé API), Twilio (numéro voix FR 09),
  agrégateur SMS retenu au spike (smsmode : clé API + VMN).
- Le repo accessible en clone (deploy key en lecture seule recommandée).

## 1. Durcissement initial du VPS (10 min)
```bash
ssh root@IP_DU_VPS
adduser deploy && usermod -aG sudo deploy
rsync -a ~/.ssh /home/deploy/ && chown -R deploy:deploy /home/deploy/.ssh
# SSH : désactiver root + mot de passe
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/; s/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
# Pare-feu : SSH + HTTP(S) uniquement
apt update && apt install -y ufw fail2ban
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
```

## 2. Docker + code (10 min)
```bash
su - deploy
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy && newgrp docker
sudo mkdir -p /opt/decroche && sudo chown deploy:deploy /opt/decroche
git clone <URL_DU_REPO> /opt/decroche && cd /opt/decroche
cp .env.example .env
```
Éditer `/opt/decroche/.env` — **toutes** ces valeurs sont obligatoires en prod :
```
NODE_ENV=production
APP_BASE_URL=https://qualifyourlead.com
SESSION_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 24)
DATABASE_URL=postgresql://decroche:<POSTGRES_PASSWORD>@postgres:5432/decroche
REDIS_URL=redis://redis:6379
DEEPSEEK_API_KEY=sk-...
MESSAGING_PROVIDER=smsmode
SMSMODE_API_KEY=...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
DASHBOARD_USER=admin
DASHBOARD_PASS=<mot de passe fort>
```

## 3. Premier lancement (5 min)
```bash
cd /opt/decroche
docker compose build
docker compose up -d postgres redis
docker compose run --rm app npx prisma migrate deploy
docker compose up -d app worker
curl -fsS http://127.0.0.1:3000/api/health   # → {"status":"ok",...}
```

## 4. Nginx + SSL Certbot (10 min)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp ops/nginx.conf /etc/nginx/sites-available/decroche  # domaine déjà qualifyourlead.com dedans
sudo ln -s /etc/nginx/sites-available/decroche /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d qualifyourlead.com   # renouvellement auto installé par certbot
```

## 5. Webhooks fournisseurs (5 min)
- **Twilio** (numéro voix) : Voice → "A call comes in" → Webhook
  `https://qualifyourlead.com/api/hooks/voice` (POST). Vérification de signature
  active dès que `TWILIO_AUTH_TOKEN` est défini.
- **smsmode** (VMN) : callback SMS entrant → `https://qualifyourlead.com/api/hooks/sms`
  (POST JSON `{from, to, body}` — mapper les champs du fournisseur dans la
  config du callback).

## 6. Backups PostgreSQL (5 min)
```bash
chmod +x /opt/decroche/ops/backup.sh
sudo crontab -e   # ajouter :
# 15 3 * * * COMPOSE_DIR=/opt/decroche BACKUP_DIR=/opt/decroche/backups /opt/decroche/ops/backup.sh >> /var/log/decroche-backup.log 2>&1
# Test immédiat :
COMPOSE_DIR=/opt/decroche BACKUP_DIR=/opt/decroche/backups /opt/decroche/ops/backup.sh
```
Restauration :
```bash
gunzip -c backups/decroche-<STAMP>.sql.gz | docker compose exec -T postgres psql -U decroche decroche
```
Hors-site : configurer `rclone` (Backblaze B2 ≈ 0 €/mo à ce volume) et
décommenter la dernière ligne de `backup.sh`.

## 7. Monitoring Uptime Kuma (5 min)
```bash
docker compose --profile monitoring up -d uptime-kuma
```
Ouvrir `https://qualifyourlead.com/kuma/`, créer l'admin, puis 3 moniteurs :
1. HTTP `https://qualifyourlead.com/api/health` — mot-clé `"status":"ok"`, 60 s.
2. HTTP `https://qualifyourlead.com/` (landing), 300 s.
3. Push (heartbeat) sur le cron de backup si souhaité.
Alertes → email + (optionnel) webhook vers votre téléphone (ntfy.sh gratuit).

## 8. Redémarrage automatique
Trois niveaux, déjà en place :
- `restart: unless-stopped` sur tous les services Docker Compose ;
- `HEALTHCHECK` Docker sur app (HTTP /api/health) et worker (process vivant) ;
- Docker démarre au boot : `sudo systemctl enable docker`.
Le healthcheck marque le conteneur `unhealthy` ; pour le redémarrage automatique
sur unhealthy, ajouter le compagnon willfarrell/autoheal :
```bash
docker run -d --name autoheal --restart=always \
  -e AUTOHEAL_CONTAINER_LABEL=all \
  -v /var/run/docker.sock:/var/run/docker.sock willfarrell/autoheal
```

## 9. Mise à jour applicative — AUTOMATIQUE désormais
Depuis la mise en place du pipeline CD (`docs/automation.md`), chaque `git push`
sur la branche de production déclenche automatiquement : build, migration,
redémarrage, vérification santé. Rien à taper manuellement.
Commande manuelle équivalente (dépannage uniquement) :
```bash
cd /opt/decroche
git pull
docker compose build app worker
docker compose run --rm app npx prisma migrate deploy
docker compose up -d app worker
curl -fsS http://127.0.0.1:3000/api/health
```
Rollback : `git checkout <tag précédent>` puis mêmes commandes, ou relancer le
workflow GitHub Actions sur un commit antérieur (`workflow_dispatch`). Les
migrations Prisma sont additives au MVP (pas de drop destructif sans backup préalable).

## 10. Onboarding d'un client pilote (white-glove, ~15 min/client)
1. Provisionner : 1 numéro voix Twilio FR + 1 VMN smsmode → noter les deux.
2. Configurer les webhooks des deux numéros (cf. §5).
3. Créer le compte :
   ```bash
   docker compose exec app npx tsx scripts/create-account.ts \
     --company "Plomberie Karim" --trade PLOMBIER --owner Karim \
     --mobile +336... --voice +339... --sms +337... --departments 69,01 \
     --email karim@...
   ```
4. Envoyer au client la page `https://qualifyourlead.com/activation` + son code
   `*61*<numéro voix>#` selon son opérateur.
5. Faire le test "wow" AVEC lui au téléphone : il appelle son numéro sans
   décrocher, vit la conversation, reçoit sa notif.

## 11. Diagnostic rapide
| Symptôme | Commande | Piste |
|---|---|---|
| Pas de SMS après appel manqué | `docker compose logs worker --since 10m` | Webhook Twilio mal configuré (tester `curl -X POST .../api/hooks/voice`) ou job en échec (chercher `job.failed`) |
| Réponses agent incohérentes | chercher `guardrail.blocked` dans les logs + `Message.llmRaw` en base | Nouvelle version de prompt requise — passer par `test:prompts` |
| 503 sur /api/health | `docker compose ps` | postgres/redis down → compose les relance ; sinon disque plein (`df -h`, purger `backups/`) |
| Health "degraded" redis | `docker compose exec redis redis-cli ping` | AOF corrompu → `docker compose restart redis` (jobs re-tentés, idempotents) |
