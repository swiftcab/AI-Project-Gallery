#!/usr/bin/env bash
# Installe le watchdog (cron root, toutes les 5 minutes) — à lancer une fois
# sur le VPS après le bootstrap :  sudo bash /opt/decroche/ops/install-watchdog.sh
# Option : KUMA_PUSH_URL=https://.../api/push/XXXX pour le heartbeat Uptime Kuma
# (créer d'abord un moniteur de type "Push" dans Kuma, intervalle 300 s).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/decroche}"
KUMA_PUSH_URL="${KUMA_PUSH_URL:-}"

chmod +x "$APP_DIR/ops/watchdog.sh"
mkdir -p "$APP_DIR/ops/state"

CRON_LINE="*/5 * * * * APP_DIR=$APP_DIR KUMA_PUSH_URL=$KUMA_PUSH_URL $APP_DIR/ops/watchdog.sh"
( crontab -l 2>/dev/null | grep -v "ops/watchdog.sh" ; echo "$CRON_LINE" ) | crontab -

echo "Watchdog installé (cron */5 min)."
echo "  État     : $APP_DIR/ops/state/alerts.json  (lu par Hermes à son heartbeat)"
echo "  Journal  : $APP_DIR/ops/state/watchdog.log"
echo "  Test     : APP_DIR=$APP_DIR $APP_DIR/ops/watchdog.sh && cat $APP_DIR/ops/state/alerts.json"
