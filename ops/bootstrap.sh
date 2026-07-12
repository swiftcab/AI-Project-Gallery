#!/usr/bin/env bash
# Bootstrap initial VPS — à coller UNE FOIS dans le Terminal Hostinger
# (panel.hostinger.com → VPS → Terminal), en tant que root.
#
# ⚠️ VPS PARTAGÉ : ce serveur héberge déjà d'autres projets (halal-trader-v7,
# propkit-api...). Ce script fait TOUJOURS un pré-vol en lecture seule d'abord
# et n'applique les changements qui touchent le système partagé (pare-feu,
# nginx) que si CONFIRM=yes est explicitement passé — jamais par défaut.
# Lancez d'abord ops/inventory.sh pour savoir ce qui tourne déjà.
#
# Usage (pré-vol, sans rien changer) :
#   REPO_URL=https://github.com/swiftcab/AI-Project-Gallery.git bash ops/bootstrap.sh
# Usage (applique réellement, une fois le pré-vol lu et compris) :
#   REPO_URL=https://github.com/swiftcab/AI-Project-Gallery.git CONFIRM=yes \
#     ALLOW_EXTRA_PORTS="8000,8080" bash ops/bootstrap.sh
set -euo pipefail

REPO_URL="${REPO_URL:?REPO_URL requis, ex: https://github.com/swiftcab/AI-Project-Gallery.git}"
BRANCH="${BRANCH:-claude/construction-ai-sales-agent-felxyp}"
APP_DIR="/opt/decroche"
CONFIRM="${CONFIRM:-no}"
ALLOW_EXTRA_PORTS="${ALLOW_EXTRA_PORTS:-}"

echo "== 0/6 PRÉ-VOL (lecture seule) — état actuel du serveur partagé =="
UFW_STATUS=$(ufw status 2>/dev/null | head -1 || echo "ufw non installé")
echo "Pare-feu : $UFW_STATUS"
OTHER_NGINX_SITES=$(ls /etc/nginx/sites-enabled/ 2>/dev/null | grep -v '^default$' || true)
if [ -n "$OTHER_NGINX_SITES" ]; then
  echo "Sites nginx déjà configurés (NE SERONT PAS touchés) :"
  echo "$OTHER_NGINX_SITES" | sed 's/^/  - /'
fi
OTHER_CONTAINERS=$(docker ps -a --format '{{.Names}} ({{.Image}})' 2>/dev/null || true)
if [ -n "$OTHER_CONTAINERS" ]; then
  echo "Conteneurs Docker déjà présents (NE SERONT PAS touchés) :"
  echo "$OTHER_CONTAINERS" | sed 's/^/  - /'
fi
LISTENING=$(ss -tlnp 2>/dev/null | awk 'NR>1 {print $4}' | sed -E 's/.*:([0-9]+)$/\1/' | sort -un | tr '\n' ' ')
echo "Ports actuellement en écoute : $LISTENING"
echo

if [ "$CONFIRM" != "yes" ]; then
  cat <<EOF
=== MODE PRÉ-VOL UNIQUEMENT — aucun changement système appliqué ===
Ce mode installe le code et Docker (sans risque pour vos autres projets)
mais NE touche PAS au pare-feu ni à nginx par défaut.

Pour appliquer les étapes qui touchent le système partagé, relancez avec :
  CONFIRM=yes ALLOW_EXTRA_PORTS="<ports de vos autres projets à garder ouverts>" bash $0

Si UFW est actuellement "inactive" et que halal-trader-v7 ou propkit-api
exposent des ports externes, l'activer sans lister ces ports dans
ALLOW_EXTRA_PORTS les couperait. Lancez d'abord ops/inventory.sh et
identifiez ces ports avant de mettre CONFIRM=yes.
EOF
fi

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

echo "== 2/6 Pare-feu et durcissement SSH (uniquement si CONFIRM=yes) =="
if [ "$CONFIRM" = "yes" ]; then
  # Root/mot de passe désactivés en SSH réseau UNIQUEMENT — n'affecte pas la
  # console Hostinger (Terminal/Console), qui ne passe pas par sshd.
  sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/; s/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
  apt-get update -qq && apt-get install -y -qq ufw fail2ban curl >/dev/null
  ufw allow OpenSSH >/dev/null && ufw allow 80 >/dev/null && ufw allow 443 >/dev/null
  if [ -n "$ALLOW_EXTRA_PORTS" ]; then
    IFS=',' read -ra PORTS <<< "$ALLOW_EXTRA_PORTS"
    for p in "${PORTS[@]}"; do
      ufw allow "$p" >/dev/null && echo "  + port $p ouvert (projet existant)"
    done
  fi
  ufw --force enable
else
  echo "  (ignoré — relancer avec CONFIRM=yes pour appliquer)"
fi

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

echo "== 5/6 Nginx (ajout d'un site, sans toucher aux autres — uniquement si CONFIRM=yes) =="
if [ "$CONFIRM" = "yes" ]; then
  apt-get install -y -qq nginx certbot python3-certbot-nginx >/dev/null
  cp "$APP_DIR/ops/nginx.conf" /etc/nginx/sites-available/decroche
  ln -sf /etc/nginx/sites-available/decroche /etc/nginx/sites-enabled/decroche
  # Ne supprime "default" QUE s'il s'agit encore de la page nginx par défaut
  # (jamais si un autre projet l'a réutilisé) :
  if [ -f /etc/nginx/sites-enabled/default ] && grep -q "Welcome to nginx" /etc/nginx/sites-enabled/default 2>/dev/null; then
    rm -f /etc/nginx/sites-enabled/default
    echo "  page nginx par défaut désactivée (inutilisée)"
  fi
  nginx -t && systemctl reload nginx
  echo "→ Une fois le DNS de qualifyourlead.com propagé vers cette IP, lancez :"
  echo "  certbot --nginx -d qualifyourlead.com -d www.qualifyourlead.com"
else
  echo "  (ignoré — relancer avec CONFIRM=yes pour appliquer)"
fi

echo "== 6/6 Backups (cron additif, ne touche pas aux crons existants) =="
chmod +x "$APP_DIR/ops/backup.sh"
( crontab -l 2>/dev/null | grep -v "ops/backup.sh"; echo "15 3 * * * COMPOSE_DIR=$APP_DIR BACKUP_DIR=$APP_DIR/backups $APP_DIR/ops/backup.sh >> /var/log/decroche-backup.log 2>&1" ) | crontab -

cat <<EOF

== Terminé (CONFIRM=$CONFIRM) ==
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
