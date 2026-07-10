#!/usr/bin/env bash
# Backup PostgreSQL quotidien avec rotation 14 jours.
# Cron (root) : 15 3 * * * /opt/decroche/ops/backup.sh >> /var/log/decroche-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/decroche/backups}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/decroche}"
KEEP_DAYS=14
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
cd "$COMPOSE_DIR"

docker compose exec -T postgres pg_dump -U decroche decroche | gzip > "$BACKUP_DIR/decroche-$STAMP.sql.gz"

# Vérification basique : un dump vide = alerte (exit != 0 → visible dans cron/kuma)
if [ ! -s "$BACKUP_DIR/decroche-$STAMP.sql.gz" ]; then
  echo "ERREUR: dump vide" >&2
  exit 1
fi

find "$BACKUP_DIR" -name "decroche-*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "OK $STAMP ($(du -h "$BACKUP_DIR/decroche-$STAMP.sql.gz" | cut -f1))"

# Optionnel : copie hors-site (décommenter après `rclone config`)
# rclone copy "$BACKUP_DIR/decroche-$STAMP.sql.gz" remote:decroche-backups/
