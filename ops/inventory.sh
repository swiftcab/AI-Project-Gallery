#!/usr/bin/env bash
# Inventaire du VPS — LECTURE SEULE. Catalogue tout ce qui tourne déjà
# (autres projets : halal-trader-v7, propkit-api, etc.) AVANT de déployer
# Décroché dessus, pour éviter tout conflit de port/nginx/ressources.
#
# Usage : sudo bash ops/inventory.sh   (fonctionne même si le repo n'est pas
# encore cloné : copiez juste ce fichier seul sur le VPS si besoin).
set -uo pipefail

STATE_DIR="${STATE_DIR:-/opt/decroche/ops/state}"
mkdir -p "$STATE_DIR" 2>/dev/null || STATE_DIR="/tmp/decroche-inventory"
mkdir -p "$STATE_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
REPORT="$STATE_DIR/inventory-$STAMP.md"
ANNOTATIONS="$STATE_DIR/projects.json"

{
echo "# Inventaire VPS — $STAMP"
echo
echo "## 1. Ports en écoute (qui écoute quoi)"
echo '```'
ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null
echo '```'

echo "## 2. Sites Nginx configurés (chaque bloc = un projet potentiel)"
echo '```'
for f in /etc/nginx/sites-enabled/*; do
  [ -e "$f" ] || continue
  echo "--- $f ---"
  grep -E "server_name|listen|proxy_pass|root " "$f" 2>/dev/null
done
echo '```'

echo "## 3. Conteneurs Docker (tous, avec ports et images)"
echo '```'
docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || echo "docker absent/inactif"
echo '```'

echo "## 4. Images Docker présentes"
echo '```'
docker images --format 'table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}' 2>/dev/null
echo '```'

echo "## 5. Services systemd actifs — hors socle Ubuntu standard"
echo '```'
KNOWN_REGEX='^(systemd-|dbus|ssh|sshd|cron|nginx|docker|containerd|snapd|fail2ban|ufw|apparmor|polkit|udisks2|rsyslog|networkd|resolved|timesyncd|multipathd|lvm2|fwupd|logrotate|man-db|motd-news|sysstat|update-notifier|apt-daily|dpkg-db-backup|e2scrub|fstrim|grub|blk-availability|unattended-upgrades|ModemManager|qemu-guest-agent|serial-getty|getty@|user@|plymouth|kmod-static|modprobe@|systemd-tmpfiles)'
systemctl list-units --type=service --all --no-legend --no-pager 2>/dev/null \
  | awk '{print $1}' | sed 's/\.service$//' | grep -vE "$KNOWN_REGEX" | sort
echo '```'

echo "## 6. Répertoires de projets probables (/opt, /srv, /var/www, /root, /home/*)"
echo '```'
for d in /opt/* /srv/* /var/www/* /root/*/ /home/*/*/; do
  [ -d "$d" ] || continue
  size=$(du -sh "$d" 2>/dev/null | cut -f1)
  echo "$d  ($size)"
done
echo '```'

echo "## 7. Crontabs (tous les utilisateurs)"
echo '```'
for u in root $(awk -F: '$3>=1000 {print $1}' /etc/passwd); do
  c=$(crontab -l -u "$u" 2>/dev/null)
  [ -n "$c" ] && { echo "--- $u ---"; echo "$c"; }
done
echo '```'

echo "## 8. Ressources globales"
echo '```'
echo "RAM:"; free -h
echo; echo "Disque:"; df -h /
echo; echo "CPU load:"; uptime
echo '```'

} > "$REPORT"

# Fichier d'annotation à compléter : associe chaque service/port inconnu à un projet connu.
if [ ! -f "$ANNOTATIONS" ]; then
  cat > "$ANNOTATIONS" <<'JSON'
{
  "_comment": "Complétez ce fichier : pour chaque service/port détecté dans le rapport d'inventaire, notez à quel projet il appartient et son statut. Décroché utilisera cette liste pour éviter tout conflit (ports, nginx, ressources).",
  "known_projects": {
    "decroche": { "status": "en cours de déploiement", "ports": [3000], "nginx_domain": "qualifyourlead.com" },
    "halal-trader-v7": { "status": "À COMPLÉTER : actif ? legacy ? ports utilisés ?", "ports": [] },
    "propkit-api": { "status": "À COMPLÉTER : actif ? legacy ? ports utilisés ?", "ports": [] }
  }
}
JSON
  echo "🆕 Fichier d'annotation créé : $ANNOTATIONS — à compléter (voir instructions dedans)."
fi

echo
echo "=== Inventaire terminé ==="
echo "Rapport   : $REPORT"
echo "À annoter : $ANNOTATIONS"
echo
echo "Prochaine étape : partagez le contenu de $REPORT (et vos réponses sur"
echo "ce que sont halal-trader-v7 / propkit-api : actifs, ports, en prod ?)"
echo "avant de lancer ops/bootstrap.sh — pour configurer Décroché sans rien casser."
