# Ordre 001 — Réparer le SSL et vérifier l'état de déploiement
Déposé le : 2026-07-18
Périmètre : autonome (aucune de ces actions ne touche au code, aux clients, ou à une dépense)

## Contexte
Le certificat TLS de qualifyourlead.com a expiré le 02/07 et le
renouvellement automatique échoue avec l'erreur "Could not bind TCP port
80 because it is already in use" — signe que le renouvellement essaie la
méthode "standalone" alors que nginx tourne déjà sur le port 80. Le
fondateur a confirmé que `nginx -t` est sain et que le port 80 répond déjà
(nginx dessus), donc la méthode `--nginx` explicite doit être utilisée à
la place.

## Actions demandées
1. Exécuter :
   ```
   certbot certonly --nginx -d qualifyourlead.com -d www.qualifyourlead.com --force-renewal
   systemctl reload nginx
   ```
2. Vérifier le résultat :
   ```
   certbot certificates | grep -A3 "qualifyourlead.com"
   curl -sI https://qualifyourlead.com | head -3
   ```
   Le certificat doit afficher une nouvelle date d'expiration (~90 jours)
   et le curl doit renvoyer un code 200/307/308 (pas d'erreur TLS).
3. Vérifier que le renouvellement automatique est bien planifié pour ne
   pas revivre cet incident :
   ```
   systemctl list-timers | grep certbot
   ```
   S'il n'y a rien, ajouter :
   ```
   (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --nginx") | crontab -
   ```
4. Vérifier l'état du dernier déploiement :
   ```
   cd /opt/decroche && git log -1 --format='%h %s' && git status
   docker compose ps
   curl -s http://127.0.0.1:3000/api/health
   ```
   Si `git log -1` ne montre pas le commit `f905ea9` ou plus récent, ou si
   le health check ne répond pas 200, le signaler comme BLOCKED avec le
   détail exact (ne pas essayer de corriger un déploiement cassé toi-même
   au-delà d'un `docker compose up -d` / `restart` classique — au-delà,
   c'est pour le CTO).
5. Vérifier (sans jamais afficher les valeurs) que ces clés existent et ne
   sont pas vides dans `/opt/decroche/.env` :
   `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`. Vérifier aussi que
   `MESSAGING_PROVIDER` n'est PAS égal à `twilio` (les numéros
   géographiques français de Twilio ne supportent pas le SMS — ce
   fournisseur doit rester `fake` ou `smsmode`, jamais `twilio`, tant
   qu'aucun numéro SMS n'est provisionné).

## Interdits explicites pour cet ordre
- Ne jamais afficher ou copier la valeur d'un secret dans le rapport —
  seulement "présent"/"absent"/"vide".
- Ne pas toucher à la configuration nginx de `propkit.tech` (autre projet
  sur ce VPS, certificat aussi expiré mais hors périmètre).
- Ne pas modifier `MESSAGING_PROVIDER` toi-même si tu le trouves à
  `twilio` — le signaler seulement, le CTO/fondateur décide de la valeur.

## Rapport attendu
Un fichier `ops/reports/2026-07-18-ordre-001.md` avec : statut SSL
(corrigé/toujours cassé + message d'erreur exact si toujours cassé),
statut du timer de renouvellement, commit déployé actuellement vs attendu,
résultat du health check, et présence/absence (jamais la valeur) des 2
clés Twilio + la valeur actuelle de MESSAGING_PROVIDER.
