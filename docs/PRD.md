# PRD — « Décroché » : Agent IA de qualification des appels manqués pour artisans BTP

Version : 1.0 (Phase 2)
Date : 2026-07-10
Statut : **en attente de validation avant tout code (STOP Phase 2)**
Prérequis lu : `research/market-findings.md` (Phase 1 validée)

> Nom de code produit : **Décroché** (placeholder, à valider — le nom doit dire
> la promesse : "chaque appel est décroché, même quand vous ne pouvez pas").

---

## 1. Analyse fonctionnelle concurrentielle — fonctionnalités à fort potentiel

Synthèse du scan des produits existants (US + FR) pour décider quoi intégrer,
quoi différer, quoi refuser. Règle appliquée : une fonctionnalité n'entre au
MVP que si elle sert directement le "wow moment" ou la conversion du pilote.

| Fonctionnalité observée | Vu chez | Verdict MVP | Justification |
|---|---|---|---|
| SMS auto < 5 s après appel manqué | LockLead, Podium, Quo/OpenPhone | ✅ **MVP — cœur** | C'est le déclencheur de toute la valeur. Le délai de réponse est LE facteur de conversion (prospect rappelé < 5 min ≈ 21x plus qualifiable). |
| Conversation IA de qualification (questions adaptatives, pas formulaire) | Avoca (voix), Goodcall (logic branching) | ✅ **MVP — différenciateur** | Personne ne le fait par SMS en France. LockLead = formulaire statique. C'est notre raison d'exister. |
| Fiche lead structurée triée par urgence (nom, métier, CP, description, créneau de rappel) | LockLead (dashboard), Avoca | ✅ **MVP** | Le livrable concret pour le patron. Sans fiche exploitable, l'IA n'est qu'un gadget. |
| Notification patron par SMS + email avec résumé actionnable | LockLead (email), Podium | ✅ **MVP** | Le patron vit sur son téléphone de chantier, pas dans un dashboard. |
| Détection d'urgence (fuite, panne électrique) → escalade immédiate | Avoca, télésecrétariats BTP | ✅ **MVP (version simple)** | Classification urgence haute/normale par l'agent + mention "URGENT" dans la notif. Pas de routage téléphonique complexe. |
| Réception de photos du problème par MMS/lien | LockLead (formulaire avec photos) | 🔶 **v1.1** | Forte valeur (chiffrage à distance) mais MMS peu fiable en France ; on fera un lien d'upload. Pas bloquant pour le wow. |
| Relance des devis non signés | Payflo (cœur de leur produit), Avoca ("texts unsold estimates") | ⛔ **v2 explicite** | Décision Phase 1 : c'est le 2e produit, branché plus tard sur la base installée. |
| Réponse vocale IA (l'IA décroche et parle) | Avoca, Sameday, Goodcall, AIRA | ⛔ **Hors scope** | Complexité x10 (latence, ASR français, coût), et le SMS suffit pour capturer. Le jour où on le fait, c'est une levée de prix, pas un patch. |
| Prise de RDV directe dans l'agenda | Sameday, Avoca (→ ServiceTitan) | ⛔ **Hors scope MVP** | Les artisans FR n'ont pas d'agenda structuré exploitable ; l'agent propose un *créneau de rappel*, le patron confirme. |
| Campagnes sortantes / réactivation base clients | Avoca (drip campaigns) | ⛔ **Hors scope** | Marketing sortant = consentement RGPD + fenêtres horaires légales + autre métier. Refusé. |
| Intégration CRM BTP (Obat, Batappli…) | Avoca→ServiceTitan (US) | ⛔ **Hors scope MVP** | Pas d'API publique fiable côté FR. Export CSV en attendant. |

**Fonctionnalité à fort potentiel non vue chez les concurrents FR, retenue pour le MVP**
(coût marginal quasi nul, forte valeur perçue en démo) :
- **Résumé de qualification rédigé en langage patron** ("Mme Dupont, 15e arr.,
  fuite sous évier, dispo demain matin, à rappeler avant 9h") plutôt qu'un
  tableau de champs — c'est du LLM pur, notre avantage de coût avec DeepSeek.
- **Mode "test en 1 appel"** dans l'onboarding : le patron appelle son propre
  numéro et vit la conversation côté client. C'est le wow moment ET l'outil de
  démo commerciale (Phase 4) en un seul développement.

---

## 2. Persona unique

**Karim, 38 ans, plombier-chauffagiste, EURL, 2 salariés, Lyon et périphérie.**
- CA ~250 k€/an, panier moyen 350 € (dépannage) à 8 k€ (chantier SDB).
- Sur chantier 7 h–17 h, mains occupées, téléphone dans la poche qui vibre.
- 10–25 appels entrants/semaine ; il estime en rater "3 ou 4 par semaine, les
  pires jours c'est quand je suis en vide sanitaire".
- Outils actuels : téléphone perso Orange Pro, devis sur Tolteck, WhatsApp
  avec ses gars. **Pas de CRM.** Répondeur saturé qu'il n'écoute plus.
- Ce qu'il paie déjà sans sourciller : 40 €/mo Tolteck, 90 €/mo comptable en
  ligne, ~200 €/mo pub Google locale qui génère… des appels qu'il rate.
- Déclencheur d'achat : la douleur vécue ("un client m'a dit qu'il avait pris
  quelqu'un d'autre parce que je n'avais pas rappelé") — pas une feature list.
- Critère de rejet immédiat : > 15 min de configuration, jargon tech, engagement 12 mois.

Anti-personas (on leur dit non poliment) : entreprise générale 30+ salariés
avec standard existant ; artisan sans SIRET ; secteur hors BTP.

## 3. Parcours utilisateur — 5 étapes, inscription → wow moment < 10 min

| # | Étape | Détail | Durée cible |
|---|---|---|---|
| 1 | **Inscription** | Email + mot de passe (ou magic link), nom entreprise, métier (liste : plombier, électricien, maçon, couvreur, chauffagiste, multi), numéro mobile pro. Pas de CB pour l'essai 14 jours. | 2 min |
| 2 | **Attribution du numéro** | Le système lui attribue son numéro dédié (numéro virtuel FR provisionné d'avance dans un pool). Écran : "Voici votre numéro Décroché : 09 XX XX XX XX". | 30 s |
| 3 | **Activation du renvoi** | Écran par opérateur (détecté ou choisi) : "Composez `*61*09XXXXXXXX#` sur votre téléphone" (Orange : `**61*numéro*11#`, Free : `*61*numéro*20#`…). Bouton "J'ai composé le code" → vérification automatique par appel de contrôle. | 2 min |
| 4 | **Test en 1 appel (wow moment)** | L'écran lui dit : "Appelez votre propre numéro pro depuis un autre téléphone et ne décrochez pas." → il reçoit le SMS de l'agent en < 10 s, répond 2–3 messages, et voit la fiche lead se construire **en temps réel** dans le dashboard + reçoit la notif patron sur son mobile. | 4 min |
| 5 | **Personnalisation minimale** | Prénom affiché dans les SMS, périmètre géographique (départements), plage "ne pas me notifier" (ex. 21h–7h, notifs groupées le matin). Fin. Tout le reste a des défauts intelligents par métier. | 1 min |

Total : **< 10 min**, dont le wow à la minute ~7.

## 4. Architecture — simple, monolithe + worker

### 4.1 Contrainte réglementaire structurante (découverte Phase 2)

En France, **les numéros mobiles (06/07) sont interdits pour le trafic A2P**
par tous les opérateurs. Les Sender ID alphanumériques sont *one-way* (pas de
réponse possible). Pour une **conversation SMS bidirectionnelle**, il faut un
**numéro virtuel dédié (VMN/numéro long)** fourni par un agrégateur opérant en
France. Conséquences :
- Fournisseur SMS = agrégateur avec VMN France + webhooks entrants
  (candidats : **smsmode** (FR, RGPD-friendly, doc simple), Twilio si numéro
  FR éligible two-way, sinon LinkMobility/Esendex). Décision au spike J1,
  abstraction `MessagingProvider` obligatoire de toute façon.
- La voix (réception de l'appel renvoyé, capture du caller ID, message
  d'accueil court puis raccroché) peut rester chez **Twilio Voice** avec un
  numéro FR 09 — c'est ce numéro qu'on donne au renvoi `*61*`.
- Conformité SMS : identité de l'expéditeur dans le 1er message + « STOP au
  XXXXX » ; pas d'envoi *à notre initiative* 22h–8h, dimanches et jours
  fériés (les réponses dans une conversation initiée par le prospect sont
  transactionnelles, mais le job de relance douce respecte la fenêtre).

### 4.2 Modules et connexions (qui alimente quoi)

```
                      appel entrant non décroché (renvoi *61*)
                                     │
                    ┌────────────────▼─────────────────┐
                    │ TELEPHONY INGRESS (Twilio Voice)  │
                    │ webhook /api/hooks/voice          │
                    │ → crée CallEvent + Lead(caller)   │
                    └────────────────┬─────────────────┘
                                     │ enqueue "conversation.start"
                    ┌────────────────▼─────────────────┐
                    │ WORKER BullMQ (process séparé)    │
                    │ jobs: start, agentTurn, nudge,    │
                    │ expire, notifyOwner               │
                    └───────┬──────────────────┬───────┘
              envoi SMS     │                  │  tour de l'agent
        ┌───────────────────▼───┐      ┌───────▼────────────────────┐
        │ MESSAGING GATEWAY      │      │ AGENT CORE                 │
        │ interface              │      │ - state machine convers.   │
        │ MessagingProvider      │      │ - LLMProvider (DeepSeek)   │
        │ (smsmode | twilio)     │      │ - sortie JSON validée zod  │
        │ webhook /api/hooks/sms │──────► - GUARDRAILS (cf. §7)      │
        └───────────────────────┘      └───────┬────────────────────┘
                                               │ écrit Qualification
                    ┌──────────────────────────▼───────┐
                    │ QUALIFICATION STORE (Postgres)    │
                    │ Lead + Conversation + Qualif.     │
                    └───────┬──────────────────┬───────┘
        fiche + urgence     │                  │ liste, stats, replay
        ┌───────────────────▼───┐      ┌───────▼────────────────────┐
        │ NOTIFIER               │      │ DASHBOARD Next.js          │
        │ SMS patron + email     │      │ leads triés par urgence,   │
        │ (respect plage silence)│      │ conversation visible,      │
        └───────────────────────┘      │ onboarding wizard, export  │
                                        └───────────────────────────┘
```

Connexions clés (demandées explicitement par la mission) :
- **Ingress → Agent** : le `CallEvent` porte le caller ID ; si le numéro a déjà
  un Lead, la conversation reprend le contexte ("Rebonjour, votre demande de
  mardi…") au lieu de repartir de zéro.
- **Agent → Notifier** : la `Qualification` (JSON validé) déclenche la notif ;
  le champ `urgency=high` court-circuite la plage de silence (configurable).
- **Agent → futur module Relance (v2)** : la table `Lead` + `Qualification`
  est *déjà* le carnet de leads sur lequel la relance de devis se branchera —
  aucun champ à migrer, on ajoutera une table `Quote`.
- **Worker → tout** : aucun envoi de SMS ni appel LLM dans les routes HTTP ;
  tout passe par la queue (idempotence, retry, rate-limit par conversation
  via lock Redis `conv:{id}`).

### 4.3 Stack et fichiers nécessaires au lancement (scaffold anticipé)

Monorepo simple, **une seule app Next.js + un process worker**, pas de
microservices, pas de package interne tant qu'il n'y a qu'une app.

```
decroche/
├── CLAUDE.md                     # conventions agentic (cf. §9)
├── README.md
├── .env.example                  # TOUTES les vars, commentées, aucune valeur réelle
├── docker-compose.yml            # app, worker, postgres, redis, (uptime-kuma en prod)
├── Dockerfile                    # multi-stage, cible app ET worker (CMD override)
├── next.config.ts
├── package.json                  # scripts: dev, build, worker, test, test:int, test:prompts, db:*
├── tsconfig.json
├── vitest.config.ts
├── .github/workflows/ci.yml      # lint + typecheck + vitest + prisma validate, bloque le merge
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                   # compte démo + conversations fixtures
│   └── migrations/
├── prompts/                      # PROMPTS VERSIONNÉS DANS LE REPO (cf. §7)
│   ├── qualifier/
│   │   ├── v1.system.md
│   │   └── CHANGELOG.md
│   ├── summarizer/
│   │   └── v1.system.md
│   └── regression/
│       ├── cases/*.yaml          # entrée simulée + assertions attendues
│       └── run.ts                # runner live (hors CI, budget capé)
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (dashboard)/leads/ …
│   │   ├── (auth)/ …
│   │   ├── onboarding/ …
│   │   └── api/
│   │       ├── hooks/voice/route.ts    # webhook Twilio (signature vérifiée)
│   │       ├── hooks/sms/route.ts      # webhook agrégateur SMS
│   │       └── health/route.ts         # healthcheck Docker
│   ├── agent/
│   │   ├── stateMachine.ts       # états: GREETING→QUALIFYING→CONFIRMING→DONE|OPTED_OUT|EXPIRED
│   │   ├── guardrails.ts         # validation zod + liste de motifs interdits
│   │   ├── schema.ts             # zod: AgentTurnOutput, Qualification
│   │   └── qualifier.ts          # orchestration d'un tour
│   ├── lib/
│   │   ├── llm/
│   │   │   ├── provider.ts       # interface LLMProvider (swap DeepSeek→autre)
│   │   │   ├── deepseek.ts       # modèle: deepseek-v4-flash (deepseek-chat déprécié 24/07/2026)
│   │   │   └── fake.ts           # provider déterministe pour les tests
│   │   ├── messaging/
│   │   │   ├── provider.ts       # interface MessagingProvider
│   │   │   ├── smsmode.ts | twilio.ts
│   │   │   └── fake.ts
│   │   ├── db.ts  ├── redis.ts  ├── logger.ts   # Pino, correlationId=conversationId
│   │   └── config.ts             # zod-parse de process.env, crash au boot si invalide
│   ├── queues/
│   │   ├── index.ts              # définitions BullMQ + planification (fenêtres horaires légales)
│   │   └── jobs/{startConversation,agentTurn,nudge,expire,notifyOwner}.ts
│   └── worker.ts                 # point d'entrée du process worker
├── tests/
│   ├── unit/                     # guardrails, state machine, fenêtres horaires, config
│   └── integration/              # inscription, appel manqué→SMS, tour d'agent (LLM fake), opt-out STOP
├── ops/
│   ├── nginx.conf                # reverse proxy + SSL (certbot)
│   ├── backup.sh                 # pg_dump quotidien + rotation 14j
│   └── deploy.md → remplacé en Phase 4 par docs/deployment-runbook.md
└── docs/
    ├── PRD.md (ce fichier)
    ├── tech-debt.md
    └── debug-log.md
```

### 4.4 Coûts unitaires (validation du pricing 79 €/mo)

- DeepSeek `deepseek-v4-flash` : $0,14/M input, $0,28/M output (cache hit
  $0,003/M). Une conversation ≈ 8 tours × ~1,5k tokens ≈ **< 0,01 €**. Négligeable.
- SMS France sortant ≈ 0,045–0,07 € ; conversation moyenne 6–8 SMS sortants
  ≈ 0,45 € ; 30 appels manqués/mois ≈ **~14 €/client/mois** SMS + location
  numéro (~2–10 €/mo selon fournisseur).
- Marge brute à 79 €/mo : **> 70 %**. Le poste à surveiller est le SMS, pas le LLM.

## 5. Modèle de données Prisma (complet MVP)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Trade { PLOMBIER ELECTRICIEN MACON COUVREUR CHAUFFAGISTE MENUISIER PEINTRE MULTI AUTRE }
enum ConversationState { GREETING QUALIFYING CONFIRMING DONE OPTED_OUT EXPIRED FAILED }
enum MessageDirection { OUTBOUND INBOUND }
enum MessageChannel { SMS SYSTEM }        // SYSTEM = notes internes/agent
enum Urgency { HIGH NORMAL LOW UNKNOWN }
enum LeadStatus { NEW QUALIFIED CONTACTED WON LOST SPAM }
enum PlanStatus { TRIAL ACTIVE PAST_DUE CANCELED }

model Account {
  id             String   @id @default(cuid())
  companyName    String
  trade          Trade
  ownerFirstName String
  ownerMobile    String                       // notifs patron
  siret          String?
  departments    String[]                     // périmètre géo, ex ["69","01"]
  quietHoursStart Int     @default(21)        // heure locale
  quietHoursEnd   Int     @default(7)
  urgentBypassQuiet Boolean @default(true)
  planStatus     PlanStatus @default(TRIAL)
  trialEndsAt    DateTime?
  createdAt      DateTime @default(now())
  users          User[]
  phoneLine      PhoneLine?
  leads          Lead[]
  auditEvents    AuditEvent[]
}

model User {
  id           String  @id @default(cuid())
  email        String  @unique
  passwordHash String?                        // ou magic link only
  accountId    String
  account      Account @relation(fields: [accountId], references: [id])
  createdAt    DateTime @default(now())
}

model PhoneLine {
  id              String  @id @default(cuid())
  accountId       String  @unique
  account         Account @relation(fields: [accountId], references: [id])
  voiceNumber     String  @unique             // numéro donné au renvoi *61* (Twilio)
  smsNumber       String  @unique             // VMN conversationnel (agrégateur)
  carrier         String?                     // opérateur du patron (aide onboarding)
  forwardVerifiedAt DateTime?                 // set par l'appel de contrôle
  active          Boolean @default(true)
}

model Lead {
  id            String     @id @default(cuid())
  accountId     String
  account       Account    @relation(fields: [accountId], references: [id])
  phone         String                        // caller ID E.164
  firstName     String?
  lastName      String?
  status        LeadStatus @default(NEW)
  optedOut      Boolean    @default(false)    // STOP → plus jamais de SMS
  createdAt     DateTime   @default(now())
  conversations Conversation[]
  @@unique([accountId, phone])
  @@index([accountId, status])
}

model Conversation {
  id             String            @id @default(cuid())
  leadId         String
  lead           Lead              @relation(fields: [leadId], references: [id])
  state          ConversationState @default(GREETING)
  promptVersion  String                        // ex "qualifier/v1" — traçabilité
  turnCount      Int               @default(0)
  startedAt      DateTime          @default(now())
  lastActivityAt DateTime          @default(now())
  expiresAt      DateTime                      // GREETING+24h sans réponse → EXPIRED
  messages       Message[]
  qualification  Qualification?
  callEvent      CallEvent?
  @@index([state, expiresAt])
}

model Message {
  id             String           @id @default(cuid())
  conversationId String
  conversation   Conversation     @relation(fields: [conversationId], references: [id])
  direction      MessageDirection
  channel        MessageChannel   @default(SMS)
  body           String
  providerId     String?                       // id message chez l'agrégateur
  llmRaw         Json?                         // sortie brute du LLM (debug/replay)
  createdAt      DateTime         @default(now())
  @@index([conversationId, createdAt])
}

model Qualification {
  id             String   @id @default(cuid())
  conversationId String   @unique
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  tradeNeeded    Trade?
  urgency        Urgency  @default(UNKNOWN)
  postalCode     String?
  description    String                        // reformulée par l'agent
  ownerSummary   String                        // "langage patron" (cf. §1)
  callbackWindow String?                       // "demain avant 9h"
  inScopeGeo     Boolean?                      // dans les departments du compte ?
  raw            Json                          // JSON complet validé zod
  createdAt      DateTime @default(now())
}

model CallEvent {
  id             String   @id @default(cuid())
  conversationId String?  @unique
  conversation   Conversation? @relation(fields: [conversationId], references: [id])
  accountId      String
  callerPhone    String
  providerCallId String   @unique              // idempotence webhook
  receivedAt     DateTime @default(now())
}

model AuditEvent {                              // notifs envoyées, opt-outs, erreurs guardrail
  id        String   @id @default(cuid())
  accountId String
  account   Account  @relation(fields: [accountId], references: [id])
  kind      String                              // "notify.sms", "guardrail.blocked", "optout"…
  payload   Json
  createdAt DateTime @default(now())
  @@index([accountId, kind, createdAt])
}
```

Notes de conception :
- `Message.llmRaw` + `Conversation.promptVersion` = **replay/debug complet**
  d'une conversation ratée sans deviner quel prompt tournait ce jour-là.
- `Lead.optedOut` est vérifié dans le **MessagingGateway** (dernier rempart),
  pas seulement dans l'agent — un opt-out ne doit jamais dépendre du LLM.
- Pas de table Subscription/Stripe au MVP : essai 14 j + Stripe **Payment
  Link** manuel, `planStatus` mis à jour à la main pour 3 pilotes
  (→ documenté dans `docs/tech-debt.md`).

## 6. Machine à états de la conversation (comportement produit exact)

```
GREETING    : SMS immédiat post-appel manqué.
              "Bonjour, ici l'assistant de {companyName} ({trade}). {OwnerFirstName}
              est sur un chantier et vous rappelle dès que possible. Pour préparer
              son rappel, pouvez-vous me dire en quelques mots de quoi il s'agit ?
              (STOP pour ne plus recevoir de messages)"
QUALIFYING  : l'agent pose au max 3 questions adaptatives parmi : nature du besoin,
              urgence, code postal/ville, créneau de rappel préféré. Il n'en pose
              JAMAIS une dont il a déjà la réponse. 8 tours max.
CONFIRMING  : l'agent récapitule et confirme ("C'est noté : … {OwnerFirstName}
              vous rappelle {créneau}."). → DONE + notifyOwner.
NUDGE (job) : si silence 25 min en QUALIFYING → 1 seule relance douce, dans la
              fenêtre horaire légale, sinon planifiée au lendemain 8h.
EXPIRED     : 24 h sans réponse → fiche partielle quand même notifiée au patron
              ("Appel manqué de 06…, pas de réponse au SMS — à rappeler").
OPTED_OUT   : "STOP" (ou variantes) → confirmation unique, flag lead, fin.
FAILED      : erreur LLM/provider après retries → fallback dégradé : SMS statique
              type LockLead (formulaire) + alerte Sentry. On ne laisse JAMAIS le
              prospect sans réponse à cause d'un incident LLM.
```

Le fallback FAILED est un choix produit important : **le mode dégradé de notre
produit = le produit entier du concurrent.**

## 7. Stratégie de prompts DeepSeek

- **Modèle** : `deepseek-v4-flash` (⚠️ `deepseek-chat` déprécié le
  24/07/2026 — on n'écrit ce nom nulle part). Interface `LLMProvider`
  (chat, JSON-mode, timeout, coût logué par appel) pour swap éventuel.
- **Prompts versionnés dans le repo** : `prompts/{agent}/{vN}.system.md` +
  CHANGELOG. La version active est une config (`PROMPT_QUALIFIER_VERSION=v1`) ;
  chaque `Conversation` enregistre la version utilisée.
- **Sortie structurée obligatoire** : l'agent répond en JSON
  `{ reply: string, extracted: {...}, state_suggestion, urgency }`, parsé et
  validé **zod** ; JSON invalide → 1 retry avec message d'erreur → sinon FAILED.
- **Garde-fous anti-hallucination (règle absolue : jamais de prix, jamais de délai d'intervention, jamais d'engagement)** — défense en profondeur, 3 couches :
  1. *Prompt* : interdictions explicites + rôle borné ("tu prends des
     informations, tu ne vends pas, tu ne chiffres pas").
  2. *Code* (`guardrails.ts`, déterministe, testé sans LLM) : le champ `reply`
     est rejeté s'il matche des motifs prix/délai/engagement
     (`/\d+\s*(€|euros?)/`, promesses type "nous serons là (demain|à \d+h)",
     "ça coûtera", "gratuit", etc.) → l'agent reçoit l'erreur et reformule ;
     2 échecs → phrase de repli statique sûre.
  3. *Audit* : chaque blocage → `AuditEvent kind=guardrail.blocked` + revue
     hebdo pour améliorer prompt et regex.
- **Tests de régression prompts** : `prompts/regression/cases/*.yaml`
  (~25 cas au départ : urgence fuite, prospect qui demande un prix, prospect
  agressif, hors zone géo, hors métier, réponse en une seule phrase complète,
  demande de délai, STOP déguisé "arrêtez de m'écrire", numéro pro/spam).
  Assertions : JSON valide, champs extraits attendus, `reply` passe les
  guardrails, longueur ≤ 3 SMS. Runner live hors CI (budget capé, lancé
  manuellement avant tout changement de prompt) ; en CI, tout tourne sur
  `FakeLLMProvider` déterministe.

## 8. HORS SCOPE du MVP (liste explicite, aussi longue que le scope)

1. Réponse vocale IA (l'agent ne décroche pas, ne parle pas).
2. Relance de devis non signés (v2 — la table Lead est prête pour ça).
3. Prise de RDV dans un agenda / lien Calendly.
4. WhatsApp, RCS, Messenger, email entrant.
5. Intégrations CRM/devis (Obat, Batappli, Tolteck…) — export CSV seulement.
6. Multi-utilisateurs, rôles, équipes (1 compte = 1 patron).
7. Facturation automatisée/Stripe intégré (Payment Link manuel pour les pilotes).
8. Application mobile native (dashboard responsive suffit ; le patron vit dans les SMS).
9. Campagnes marketing sortantes, réactivation de base, demandes d'avis Google.
10. Multilingue (français uniquement).
11. Portage du numéro existant du patron (on utilise le renvoi *61*, jamais le portage).
12. Détection de spam avancée / blocklists partagées (flag manuel SPAM suffit).
13. Analytics avancés, attribution, tableaux de bord de conversion.
14. Personnalisation profonde des prompts par client (défauts par métier seulement).
15. Marché anglophone / international.
16. SSO, 2FA, SOC2 — auth simple + bonnes pratiques OWASP de base.
17. Enregistrement/transcription des appels vocaux (aucun audio stocké).
18. L'agent qui répond aux questions techniques métier ("puis-je mettre du 16 mm² ?") — redirection systématique vers le rappel du patron.

## 9. Pratiques agentic/vibecoding retenues (harmonisation dev)

- **`CLAUDE.md` à la racine** : conventions du repo (stack, scripts, "tout
  envoi externe passe par la queue", "jamais de prompt inline dans le code",
  politique guardrails, format de commit), pour que toute session d'agent
  (Claude Cowork/Hermes) reparte avec le même contexte.
- **Tranches verticales** : chaque étape livre un flux complet testable
  (ex. "appel manqué → SMS statique" avant d'introduire le LLM), jamais trois
  modules à moitié finis.
- **Contrats typés partout** : zod aux frontières (env, webhooks, sortie LLM,
  formulaires) — un agent IA qui code contre des types explicites hallucine moins.
- **Deux niveaux de tests** : CI 100 % déterministe (Fake providers) qui
  bloque le merge ; suite live (prompts/regression) manuelle et budgétée.
- **Boucle de debug autonome outillée** : logs Pino JSON avec
  `conversationId` corrélé partout + `Message.llmRaw` + `promptVersion` →
  un agent peut rejouer un incident de bout en bout ; chaque fix consigné
  dans `docs/debug-log.md` (format : symptôme, cause, fix, test ajouté).
- **`docs/tech-debt.md` tenu à jour dès la première dette** (déjà identifiées :
  billing manuel, pool de numéros provisionné à la main, pas de portabilité
  fournisseur SMS testée).

## 10. Risques & décisions ouvertes (à trancher au sprint 0)

| Risque | Mitigation prévue |
|---|---|
| Choix agrégateur SMS FR (smsmode vs Twilio two-way FR vs LinkMobility) | **Spike J1 timeboxé à 1 journée** : provisionner 1 VMN, envoyer/recevoir 1 SMS via webhook. Le premier qui marche gagne (abstraction de toute façon). |
| Délai de réception du webhook "appel non décroché" (latence renvoi *61* + Twilio) | Mesurer au spike ; cible < 10 s entre raccroché et 1er SMS. |
| LockLead réagit (ajoute de l'IA à 49 €) | Notre défense = la conversation + le résumé patron + la vitesse d'itération prompts. Assumer la concurrence frontale, viser les 3 pilotes vite. |
| Prospect rappelle le numéro Décroché (09) au lieu du patron | Le numéro voix répond par un message court "vous allez être rappalé" + notif patron. Documenté dans l'onboarding. |
| Stats marketing Phase 1 non auditées | Ne jamais les citer comme des faits dans la landing (Phase 4). |

---

**STOP — Phase 2 terminée. Aucun code ne sera écrit avant ta validation de :
(1) le scope MVP §1/§8, (2) le parcours §3, (3) le schéma Prisma §5,
(4) le pricing confirmé 79 €/mo, (5) le nom de code produit.**
