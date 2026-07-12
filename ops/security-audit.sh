#!/usr/bin/env bash
# Audit de sécurité — LECTURE SEULE, ne modifie jamais rien.
# But : établir une base saine et détecter une dérive (clé SSH ajoutée,
# utilisateur créé, cron suspect, port ouvert...) entre deux exécutions.
#
# Usage : sudo bash /opt/decroche/ops/security-audit.sh
# Sortie : ops/state/security-audit-<date>.md + diff contre le run précédent.
set -uo pipefail

APP_DIR="${APP_DIR:-/opt/decroche}"
STATE_DIR="$APP_DIR/ops/state"
STAMP=$(date +%Y%m%d-%H%M%S)
REPORT="$STATE_DIR/security-audit-$STAMP.md"
BASELINE="$STATE_DIR/security-baseline.txt"
mkdir -p "$STATE_DIR"

SUSPECT=0
flag() { SUSPECT=1; echo "  🔴 SUSPECT: $1"; }
ok() { echo "  🟢 $1"; }

{
echo "# Audit sécurité — $STAMP"
echo

echo "## 1. Comptes avec accès shell"
echo '```'
awk -F: '($3>=1000 && $7!~"nologin" && $7!~"false") || $1=="root" {print $1" (uid="$3", shell="$7")"}' /etc/passwd
echo '```'

echo "## 2. Clés SSH autorisées (root + tous les utilisateurs)"
echo '```'
for f in /root/.ssh/authorized_keys /home/*/.ssh/authorized_keys; do
  [ -f "$f" ] || continue
  echo "--- $f ---"
  while read -r line; do
    [ -z "$line" ] && continue
    echo "$line" | ssh-keygen -lf /dev/stdin 2>/dev/null || echo "(ligne illisible: ${line:0:40}...)"
  done < "$f"
done
echo '```'

echo "## 3. Connexions récentes (succès)"
echo '```'
last -a 2>/dev/null | head -20 || echo "indisponible"
echo '```'

echo "## 4. Tentatives échouées récentes (30 dernières)"
echo '```'
if [ -r /var/log/auth.log ]; then
  grep -i "failed password\|invalid user" /var/log/auth.log 2>/dev/null | tail -30
elif command -v journalctl >/dev/null; then
  journalctl -u ssh -u sshd --since "-7 days" 2>/dev/null | grep -i "failed password\|invalid user" | tail -30
else
  echo "journal indisponible"
fi
echo '```'

echo "## 5. Crontabs (root, utilisateurs, système)"
echo '```'
echo "--- root ---"; crontab -l -u root 2>/dev/null || echo "(vide)"
for u in $(awk -F: '$3>=1000 {print $1}' /etc/passwd); do
  c=$(crontab -l -u "$u" 2>/dev/null)
  [ -n "$c" ] && { echo "--- $u ---"; echo "$c"; }
done
echo "--- /etc/cron.d ---"
ls -la /etc/cron.d/ 2>/dev/null
echo '```'

echo "## 6. Ports en écoute"
echo '```'
ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null || echo "indisponible"
echo '```'

echo "## 7. Config SSH critique"
echo '```'
grep -E "^(PermitRootLogin|PasswordAuthentication|Port|AllowUsers)" /etc/ssh/sshd_config 2>/dev/null
echo '```'

echo "## 8. sudoers non standard"
echo '```'
ls -la /etc/sudoers.d/ 2>/dev/null
echo '```'

echo "## 9. Docker — TOUS les conteneurs (pas seulement ceux de Décroché)"
echo '```'
docker ps -a --format '{{.Names}} {{.Image}} {{.Status}} {{.Ports}}' 2>/dev/null || echo "docker absent/inactif"
echo '```'

echo "## 9bis. Services systemd NON standard (ni Ubuntu, ni Décroché connus)"
echo '```'
KNOWN_REGEX='^(systemd-|dbus|ssh|sshd|cron|nginx|docker|containerd|snapd|fail2ban|ufw|apparmor|polkit|udisks2|rsyslog|networkd|resolved|timesyncd|multipathd|lvm2|fwupd|logrotate|man-db|motd-news|sysstat|update-notifier|apt-daily|dpkg-db-backup|e2scrub|fstrim|grub|blk-availability|unattended-upgrades|ModemManager|qemu-guest-agent|serial-getty|getty@|user@|plymouth|kmod-static|modprobe@|systemd-tmpfiles|propkit-api)'
UNKNOWN_SERVICES=$(systemctl list-units --type=service --all --no-legend --no-pager 2>/dev/null \
  | awk '{print $1}' | sed 's/\.service$//' \
  | grep -vE "$KNOWN_REGEX" | sort)
for svc in $UNKNOWN_SERVICES; do
  echo "--- $svc ---"
  systemctl show "$svc" -p FragmentPath -p ExecStart -p ActiveState 2>/dev/null
done
echo '```'

echo "## 10. fail2ban"
echo '```'
fail2ban-client status 2>/dev/null || echo "fail2ban absent/inactif"
echo '```'

} > "$REPORT"

# --- Comparaison à la baseline (comptes + clés SSH + services non standard) ---
CURRENT_SIGNATURE=$(
  awk -F: '($3>=1000 && $7!~"nologin" && $7!~"false") || $1=="root" {print $1}' /etc/passwd | sort
  for f in /root/.ssh/authorized_keys /home/*/.ssh/authorized_keys; do
    [ -f "$f" ] && awk '{print $1" "$2}' "$f"
  done | sort
  echo "$UNKNOWN_SERVICES" | sed 's/^/SVC:/'
)

echo
echo "=== Résumé (voir $REPORT pour le détail) ==="
if [ -n "$UNKNOWN_SERVICES" ]; then
  flag "service(s) systemd non reconnus actifs sur ce serveur — à identifier AVANT toute autre action :"
  echo "$UNKNOWN_SERVICES" | sed 's/^/    - /'
fi
if [ -f "$BASELINE" ]; then
  DIFF=$(diff <(echo "$CURRENT_SIGNATURE") "$BASELINE" || true)
  if [ -n "$DIFF" ]; then
    flag "changement détecté vs baseline (nouveau compte, nouvelle clé SSH, ou service) :"
    echo "$DIFF"
  else
    ok "comptes + clés SSH + services identiques à la baseline"
  fi
else
  echo "🆕 Première exécution — cette liste devient la baseline de référence."
fi
echo "$CURRENT_SIGNATURE" > "$BASELINE"

grep -q "^Port 22" /etc/ssh/sshd_config 2>/dev/null || true
grep -qE "^PermitRootLogin\s+no" /etc/ssh/sshd_config 2>/dev/null && ok "PermitRootLogin: no" || flag "PermitRootLogin n'est PAS à 'no' (ou bootstrap pas encore fait)"
grep -qE "^PasswordAuthentication\s+no" /etc/ssh/sshd_config 2>/dev/null && ok "PasswordAuthentication: no" || flag "PasswordAuthentication n'est PAS à 'no' (ou bootstrap pas encore fait)"

exit $SUSPECT
