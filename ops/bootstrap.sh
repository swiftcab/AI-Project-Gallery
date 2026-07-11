#!/usr/bin/env bash
# Bootstrap initial VPS — à coller UNE FOIS dans le Terminal Hostinger
# (panel.hostinger.com → VPS → Terminal), en tant que root.
# Après ce script, les déploiements suivants passent par
# .github/workflows/deploy.yml (push automatique) — ce script ne sert
# qu'à amener le VPS à l'état "prêt à recevoir des déploiements".
#
# Usage : REPO_URL=git@github.com:swiftcab/AI-Project-Gallery.git \
#         BRANCH=claude/construction-ai-sales-agent-felxyp \
#         bash ops/bootstrap.sh
set -euo pipefail

REPO_URL="${REPO_URL:?REPO_URL requis, ex: https://github.com/swiftcab/AI-Project-Gallery.git}"
BRANCH="${BRANCH:-claude/construction-ai-sales-agent-felxyp}"
APP_DIR="/opt/decroche"

echo "== 1/6 Utilisateur déploiement + clé de déploiement (générée ICI, pas en local) =="
if ! id deploy >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
  usermod -aG sudo deploy
fi
mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys

DEPLOY_KEY=/home/deploy/.ssh/decroche_deploy_key
if [ ! -f "$DEPLOY_KEY" ]; then
  su - deploy -c "ssh-keygen -t ed25519 -f $DEPLOY_KEY -C deploy@decroche -N ''"
  cat "$DEPLOY_KEY.pub" >> /home/deploy/.ssh/authorized_keys
fi
chown -R deploy:deploy /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

DEPLOY_PRIVATE_KEY_PRINTED="$(cat "$DEPLOY_KEY")"

echo "== 2/6 Durcissement SSH/pare-feu =="
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/; s/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
apt-get update -qq && apt-get install -y -qq ufw fail2ban curl >/dev/null
ufw allow OpenSSH >/dev/null && ufw allow 80 >/dev/null && ufw allow 443 >/dev/null
ufw --force enable

echo "== 3/6 Docker =="
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
usermod -aG docker deploy

echo "== 4/6 Code =="
mkdir -p "$APP_DIR" && chown deploy:deploy "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  su - deploy -c "git clone --branch $BRANCH $REPO_URL $APP_DIR"
fi
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "⚠ $APP_DIR/.env créé depuis .env.example — À COMPLÉTER avant le premier démarrage"
  echo "  (SESSION_SECRET, POSTGRES_PASSWORD, DEEPSEEK_API_KEY, DASHBOARD_PASS, OPS_API_TOKEN, ...)"
fi

echo "== 5/6 Nginx + Certbot =="
apt-get install -y -qq nginx certbot python3-certbot-nginx >/dev/null
cp "$APP_DIR/ops/nginx.conf" /etc/nginx/sites-available/decroche
ln -sf /etc/nginx/sites-available/decroche /etc/nginx/sites-enabled/decroche
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "→ Une fois le DNS de qualifyourlead.com propagé vers cette IP, lancez :"
echo "  certbot --nginx -d qualifyourlead.com -d www.qualifyourlead.com"

echo "== 6/6 Backups =="
chmod +x "$APP_DIR/ops/backup.sh"
( crontab -l 2>/dev/null; echo "15 3 * * * COMPOSE_DIR=$APP_DIR BACKUP_DIR=$APP_DIR/backups $APP_DIR/ops/backup.sh >> /var/log/decroche-backup.log 2>&1" ) | crontab -

cat <<EOF

== Terminé ==
Reste à faire manuellement :
  1. Compléter $APP_DIR/.env (secrets réels)
  2. Premier démarrage :
       cd $APP_DIR && docker compose up -d postgres redis
       docker compose run --rm app npx prisma migrate deploy
       docker compose up -d app worker
  3. certbot --nginx -d qualifyourlead.com -d www.qualifyourlead.com
  4. Ajouter les 3 secrets GitHub (Settings → Secrets and variables → Actions) :
       DEPLOY_HOST = $(curl -s -4 ifconfig.me || echo "<IP de ce VPS>")
       DEPLOY_USER = deploy
       DEPLOY_SSH_KEY = la clé privée ci-dessous (copier TOUT le bloc, BEGIN/END inclus)

===== CLÉ PRIVÉE DE DÉPLOIEMENT (à coller dans le secret GitHub DEPLOY_SSH_KEY) =====
$DEPLOY_PRIVATE_KEY_PRINTED
===== FIN DE LA CLÉ =====

Cette clé n'existe que sur ce VPS (dans /home/deploy/.ssh/) et dans le secret
GitHub une fois collée — copiez-la maintenant, elle ne sera pas raffichée par
un futur relancement de ce script (le "if [ ! -f ... ]" au-dessus le saute).

→ Une fois les secrets ajoutés, chaque push déploie automatiquement
  (.github/workflows/deploy.yml) — plus aucune étape manuelle de déploiement.
EOF
