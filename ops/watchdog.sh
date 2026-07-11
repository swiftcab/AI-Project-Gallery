#!/usr/bin/env bash
# Watchdog Décroché — couche 1 (déterministe, SANS LLM), cron */5 min sur le VPS.
# Philosophie : ce script détecte et répare les pannes MÉCANIQUES (restart,
# purge, renew). Tout ce qui demande un diagnostic va dans alerts.json,
# que Hermes (couche 2) lit à son heartbeat. Voir docs/agent-operations.md.
#
# Installation : ops/install-watchdog.sh (cron toutes les 5 minutes).
set -uo pipefail

APP_DIR="${APP_DIR:-/opt/decroche}"
STATE_DIR="$APP_DIR/ops/state"
ALERTS_FILE="$STATE_DIR/alerts.json"
LOG_FILE="$STATE_DIR/watchdog.log"
RESTART_LEDGER="$STATE_DIR/restarts.ledger"   # anti-flapping
DOMAIN="${DOMAIN:-qualifyourlead.com}"
KUMA_PUSH_URL="${KUMA_PUSH_URL:-}"            # optionnel : moniteur Push Uptime Kuma
MAX_RESTARTS_PER_HOUR=3

mkdir -p "$STATE_DIR"
cd "$APP_DIR" || exit 1

NOW_EPOCH=$(date +%s)
NOW_ISO=$(date -Is)
ALERTS=()   # tableau de chaînes JSON
ACTIONS=()  # réparations effectuées ce tour

log() { echo "$NOW_ISO $1" >> "$LOG_FILE"; }
alert() { # $1=severity $2=code $3=message
  ALERTS+=("{\"severity\":\"$1\",\"code\":\"$2\",\"message\":\"$3\",\"at\":\"$NOW_ISO\"}")
  log "ALERT [$1] $2: $3"
}
action() { ACTIONS+=("\"$1\""); log "ACTION: $1"; }

# Anti-flapping : n'autorise que N restarts/h par service.
can_restart() { # $1=service
  local since=$((NOW_EPOCH - 3600))
  local count
  count=$(awk -v svc="$1" -v since="$since" '$2==svc && $1>=since' "$RESTART_LEDGER" 2>/dev/null | wc -l)
  [ "$count" -lt "$MAX_RESTARTS_PER_HOUR" ]
}
record_restart() { echo "$NOW_EPOCH $1" >> "$RESTART_LEDGER"; tail -200 "$RESTART_LEDGER" > "$RESTART_LEDGER.tmp" && mv "$RESTART_LEDGER.tmp" "$RESTART_LEDGER"; }

# ---------- 1. Santé HTTP de l'app ----------
HEALTH=$(curl -fsS -m 5 http://127.0.0.1:3000/api/health 2>/dev/null || echo "")
if ! echo "$HEALTH" | grep -q '"status":"ok"'; then
  if can_restart app; then
    action "restart app (health KO: ${HEALTH:-timeout})"
    docker compose restart app >/dev/null 2>&1
    record_restart app
    sleep 8
    HEALTH2=$(curl -fsS -m 5 http://127.0.0.1:3000/api/health 2>/dev/null || echo "")
    if ! echo "$HEALTH2" | grep -q '"status":"ok"'; then
      alert critical health.app_down "app toujours KO après restart — diagnostic requis (docker compose logs app --since 15m)"
    fi
  else
    alert critical health.flapping "app a dépassé $MAX_RESTARTS_PER_HOUR restarts/h — arrêt des restarts auto, cause racine à trouver"
  fi
fi

# ---------- 2. Conteneurs exited/unhealthy ----------
for svc in app worker postgres redis; do
  status=$(docker compose ps --format '{{.Service}} {{.State}} {{.Health}}' 2>/dev/null | awk -v s="$svc" '$1==s {print $2" "$3}')
  case "$status" in
    *running*healthy*|*running\ *) : ;;  # ok (worker/redis peuvent ne pas avoir de health)
    *exited*|*dead*|*unhealthy*)
      if can_restart "$svc"; then
        action "restart $svc (état: $status)"
        docker compose restart "$svc" >/dev/null 2>&1
        record_restart "$svc"
      else
        alert critical "container.flapping" "$svc en échec répété ($status) — restarts suspendus"
      fi
      ;;
    "")
      alert critical "container.missing" "$svc absent de docker compose ps — stack non démarrée ?"
      ;;
  esac
done

# ---------- 3. Disque ----------
DISK_PCT=$(df -P "$APP_DIR" | awk 'NR==2 {gsub("%",""); print $5}')
if [ "${DISK_PCT:-0}" -ge 85 ]; then
  action "purge disque (${DISK_PCT}%) : backups >14j + docker prune"
  find "$APP_DIR/backups" -name "*.sql.gz" -mtime +14 -delete 2>/dev/null
  docker system prune -f >/dev/null 2>&1
  DISK_PCT=$(df -P "$APP_DIR" | awk 'NR==2 {gsub("%",""); print $5}')
fi
[ "${DISK_PCT:-0}" -ge 92 ] && alert critical disk.full "disque à ${DISK_PCT}% après purge — intervention requise"

# ---------- 4. Backup du jour (après 4h du matin) ----------
if [ "$(date +%H)" -ge 4 ]; then
  TODAY_BACKUP=$(find "$APP_DIR/backups" -name "decroche-$(date +%Y%m%d)-*.sql.gz" -size +1k 2>/dev/null | head -1)
  [ -z "$TODAY_BACKUP" ] && alert warning backup.missing "aucun backup valide aujourd'hui — vérifier le cron backup.sh et /var/log/decroche-backup.log"
fi

# ---------- 5. Certificat TLS ----------
CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
if [ -f "$CERT" ]; then
  EXP=$(openssl x509 -enddate -noout -in "$CERT" 2>/dev/null | cut -d= -f2)
  EXP_EPOCH=$(date -d "$EXP" +%s 2>/dev/null || echo 0)
  DAYS_LEFT=$(( (EXP_EPOCH - NOW_EPOCH) / 86400 ))
  if [ "$DAYS_LEFT" -lt 15 ]; then
    action "certbot renew (J-$DAYS_LEFT)"
    certbot renew --quiet 2>/dev/null || alert warning tls.renew_failed "certbot renew a échoué (J-$DAYS_LEFT avant expiration)"
  fi
  [ "$DAYS_LEFT" -lt 7 ] && alert critical tls.expiring "certificat expire dans $DAYS_LEFT jours"
fi

# ---------- 6. File BullMQ (worker vivant ?) ----------
WAIT_DEPTH=$(docker compose exec -T redis redis-cli LLEN bull:decroche:wait 2>/dev/null | tr -d '\r' || echo 0)
FAILED_DEPTH=$(docker compose exec -T redis redis-cli ZCARD bull:decroche:failed 2>/dev/null | tr -d '\r' || echo 0)
[ "${WAIT_DEPTH:-0}" -gt 50 ] && alert critical queue.stalled "$WAIT_DEPTH jobs en attente — le worker traite-t-il ? (docker compose logs worker)"
[ "${FAILED_DEPTH:-0}" -gt 10 ] && alert warning queue.failures "$FAILED_DEPTH jobs en échec accumulés — diagnostic Hermes requis (job.failed dans les logs)"

# ---------- 7. Écriture de l'état + heartbeat Kuma ----------
STATUS="ok"; [ ${#ALERTS[@]} -gt 0 ] && STATUS="alerts"
{
  echo "{"
  echo "  \"checkedAt\": \"$NOW_ISO\","
  echo "  \"status\": \"$STATUS\","
  echo "  \"diskPct\": ${DISK_PCT:-null},"
  echo "  \"queueWait\": ${WAIT_DEPTH:-0},"
  echo "  \"queueFailed\": ${FAILED_DEPTH:-0},"
  echo "  \"actions\": [$(IFS=,; echo "${ACTIONS[*]:-}")],"
  echo "  \"alerts\": [$(IFS=,; echo "${ALERTS[*]:-}")]"
  echo "}"
} > "$ALERTS_FILE"

# Heartbeat vers Uptime Kuma (le silence du watchdog devient LUI-MÊME une alerte)
if [ -n "$KUMA_PUSH_URL" ]; then
  curl -fsS -m 5 "$KUMA_PUSH_URL?status=up&msg=$STATUS" >/dev/null 2>&1 || log "kuma push failed"
fi

tail -5000 "$LOG_FILE" > "$LOG_FILE.tmp" 2>/dev/null && mv "$LOG_FILE.tmp" "$LOG_FILE"
log "run done: status=$STATUS actions=${#ACTIONS[@]} alerts=${#ALERTS[@]}"
exit 0
