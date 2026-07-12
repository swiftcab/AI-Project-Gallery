# Sécurité & conformité — Décroché

Posture honnête pour un SaaS solo pré-revenu : on vise **RGPD solide dès
maintenant** (obligatoire, non négociable, et c'est un argument de vente
auprès des artisans), une **hygiène de sécurité alignée sur ISO 27001**
(sans certification — inutile et hors budget avant d'avoir des clients qui
l'exigent), et une trajectoire claire vers SOC 2 / ISO 27001 le jour où un
client grand compte le demandera. Se certifier maintenant serait du théâtre
de conformité ; s'aligner maintenant rend la certification future banale.

## 1. Ce qui est DÉJÀ en place (implémenté, testé)

| Mesure | Où | Norme couverte |
|---|---|---|
| Opt-out STOP déterministe en gateway + dernier rempart à l'envoi | `api/hooks/sms`, `sendToLead` | RGPD art. 21, délib. CNIL prospection |
| Fenêtres horaires légales SMS (8h-21h, jamais dim./fériés) | `src/lib/sendWindow.ts` + tests | Règles opérateurs FR / CNIL |
| Pas de PII en clair dans les logs (redaction Pino) | `src/lib/logger.ts` | RGPD art. 5 (minimisation) |
| Garde-fous anti-engagement (prix/délai) en 3 couches + audit trail | `guardrails.ts`, `AuditEvent` | Responsabilité contractuelle |
| Secrets hors du repo (`.env` gitignoré, secrets GitHub chiffrés) | `.gitignore`, CD | ISO 27001 A.8 |
| SSH durci (root interdit, mot de passe interdit), UFW, fail2ban | `ops/bootstrap.sh` | ISO 27001 A.8/A.5 |
| Clé SSH de déploiement dédiée, mono-usage | `deploy.yml` | Moindre privilège |
| Webhooks signés (Twilio) + validation zod de toutes les entrées | routes API | OWASP ASVS V5 |
| En-têtes de sécurité HTTP (HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy) | `next.config.ts` | OWASP |
| Auth séparée humain (Basic) / agent (Bearer token) | `middleware.ts`, `opsAuth.ts` | Moindre privilège |
| Backups quotidiens + rotation 14 j + procédure de restauration testable | `ops/backup.sh` | ISO 27001 A.8.13 |
| TLS partout (Certbot), redirection 80→443 | `ops/nginx.conf` | RGPD art. 32 |
| CI bloquante (tests déterministes) + traçabilité replay LLM (`llmRaw`, `promptVersion`) | CI, schéma Prisma | Auditabilité |
| Audit sécurité en boucle (comptes/clés SSH/cron/ports vs baseline) hebdomadaire via Hermes | `ops/security-audit.sh`, `HERMES.md` étape 0+7 | ISO 27001 A.5.25/A.8.16 (détection) |

## 2. À faire AVANT le premier client payant (bloquant)

1. **Pages légales** sur qualifyourlead.com : mentions légales, politique de
   confidentialité, CGV/CGU. Le contrat avec l'artisan doit préciser que
   Décroché est **sous-traitant** (art. 28 RGPD) des données de SES prospects,
   l'artisan restant responsable de traitement → un DPA simple annexé aux CGV.
2. **Registre des traitements** (obligation art. 30) — un tableau suffit à
   cette échelle : finalité, données (téléphone, prénom, besoin), base légale
   (intérêt légitime : le prospect a appelé l'artisan), durée de rétention,
   destinataires (DeepSeek, agrégateur SMS, Twilio, Hostinger).
3. **DPA des sous-traitants** : vérifier et archiver les DPA de Hostinger,
   Twilio, smsmode. **Point d'attention DeepSeek** : vérifier les clauses de
   transfert hors UE et l'usage des données pour l'entraînement ; si les
   garanties sont insuffisantes, l'abstraction `LLMProvider` permet de
   basculer sur un fournisseur UE (Mistral) en écrivant un seul adapter —
   c'est précisément pour ça qu'elle existe.
4. **Politique de rétention appliquée dans le code** : job de purge
   (conversations > 24 mois anonymisées, leads sans activité > 36 mois
   supprimés) — à ajouter comme job BullMQ planifié.
5. **Chiffrer les backups** avant toute copie hors-site (age/gpg dans
   `backup.sh`) + activer la copie hors-site (rclone → Backblaze B2, région UE).
6. **Rotation initiale des secrets** : tout secret qui a transité par un chat,
   un ticket ou un email est considéré exposé et doit être régénéré avant la
   mise en production (ex. : la clé API Apify partagée dans une conversation
   d'agent — la faire tourner dans la console Apify avant le premier vrai run).

## 3. Alignement ISO 27001 « lite » (sans certification)

Les 6 documents qui donnent 80 % de la valeur, à tenir dans `docs/` :
- **Politique de sécurité** (1 page) : qui a accès à quoi, MFA partout où
  possible (GitHub, Hostinger, registrar, Twilio, smsmode — à activer
  manuellement, 15 min).
- **Inventaire des actifs** (ce tableau §1 + la liste des comptes fournisseurs).
- **Gestion des accès** : 1 humain + 2 agents avec périmètres écrits
  (`docs/agent-operations.md` fait déjà office de politique d'accès agents).
- **Plan de réponse à incident** (§4).
- **Registre RGPD** (§2.2).
- **Journal des changements de sécurité** : les commits + `docs/debug-log.md`
  couvrent déjà la traçabilité.

## 4. Plan de réponse à incident (mini, réaliste)

| Incident | Détection | Réaction immédiate | Communication |
|---|---|---|---|
| Fuite de secret (clé API, token) | revue, alerte fournisseur | Révoquer/régénérer la clé, chercher l'usage frauduleux dans les consoles | Noter dans debug-log ; si données clients touchées → §violation |
| Violation de données personnelles | logs, alerte, signalement | Geler la source (couper le service si besoin), évaluer le périmètre | **CNIL sous 72 h** si risque pour les personnes (art. 33) + information des artisans concernés |
| Service down | Uptime Kuma, Hermes | Redémarrage (auto), diagnostic runbook §11 | Si > 1 h : message aux clients pilotes |
| Compromission VPS | `ops/security-audit.sh` (hebdo, ou à la demande), fail2ban, comportement anormal | NE PAS toucher aux preuves (clé/compte suspect) — snapshot Hostinger immédiat, rotation SSH/secrets, réinstallation via bootstrap.sh + restore backup depuis un point antérieur à la compromission | Post-mortem dans debug-log |

### Vérifier l'état de sécurité à la demande
`sudo bash /opt/decroche/ops/security-audit.sh` — lecture seule, compare
comptes/clés SSH à la dernière baseline connue, journalise ports ouverts,
crontabs, tentatives de connexion échouées, config sshd. À lancer après tout
événement inhabituel (prompt de login inattendu, accès VPS qui se comporte
différemment) et systématiquement avant un `git checkout`/reprovisioning.

Contact CNIL : notification en ligne sur cnil.fr. Garder ce réflexe écrit ici
suffit à cette échelle — pas besoin d'un outil de GRC.

## 5. Sécurité applicative — dette assumée et planifiée

| Item | Statut | Échéance |
|---|---|---|
| CSP avec nonces (JSON-LD et styles inline de la landing) | tech-debt #8 | avant l'ouverture self-serve |
| Rate-limiting sur `/api/hooks/*` et `/api/ops/*` (Redis, simple compteur) | à faire | avant le 3e client |
| Vraie auth (magic link) remplaçant le Basic Auth | tech-debt #5 | avant self-serve |
| Signature du webhook SMS entrant (selon capacités smsmode) | au spike J1 | spike |
| `npm audit` en CI (bloquant sur vulnérabilités high/critical) | à ajouter au workflow CI | cette semaine |
| MFA sur tous les comptes fournisseurs | action manuelle fondateur | cette semaine |

## 6. Trajectoire certification (déclencheurs, pas de dates)

- **Maintenant → 10 clients artisans** : tout ce qui précède. Personne ne
  demandera un certificat ; ils demanderont "c'est conforme RGPD ?" → oui, prouvable.
- **Premier client entreprise générale / grand compte qui l'exige** :
  SOC 2 Type I via une plateforme d'automatisation (Vanta/Drata, ~10-20 k€/an
  tout compris) — les contrôles ci-dessus couvrent déjà l'essentiel du travail.
- **Appels d'offres publics / gros comptes UE** : ISO 27001 formelle. Ne
  s'engager que si un contrat identifié la finance.
