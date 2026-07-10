# Recherche marché — Agent IA Sales pour PME du BTP

Date : 2026-07-10
Statut : **Phase 1 — en attente de validation avant tout code**

## 0. Méthodologie et limites (transparence)

Recherche menée via moteurs de recherche web sur ~20 requêtes ciblées (FR + EN),
couvrant forums métiers, comparateurs de logiciels, sites de concurrents, et
articles spécialisés BTP/artisanat.

**Limite importante à assumer honnêtement** : Reddit, X/Twitter et les groupes
Facebook privés ne sont pas indexés de façon exploitable par les moteurs de
recherche généralistes accessibles ici — impossible d'extraire des citations
verbatim attribuables (pseudo Reddit, tweet précis, post de groupe Facebook).
Plutôt que d'inventer des citations, cette recherche s'appuie sur une preuve
**plus forte pour une décision business** : des concurrents réels, avec
pricing public, qui vendent déjà une solution à ce problème précis. Si un
concurrent facture 49€/mois pour résoudre "l'artisan ne décroche pas", c'est
une validation de la douleur plus fiable qu'un post Reddit non vérifiable.

Avant de lancer l'outreach en Phase 4, je recommande de valider les douleurs
n°1 et n°2 ci-dessous par 10-15 appels/DM directs à des artisans (voir plan
Phase 4). Cette recherche documentaire réduit le risque mais ne remplace pas
la conversation client.

---

## 1. Les 5 douleurs identifiées (par fréquence de preuve trouvée)

### #1 — Appels manqués pendant les chantiers = clients perdus définitivement
L'artisan est sur un chantier, ne peut pas décrocher, le prospect appelle un
concurrent dans la foulée. C'est la douleur avec le **plus de preuve de
volonté de payer** : au moins 4 solutions commerciales dédiées existent
uniquement pour ce problème (LockLead, appels-manques.fr, Elio, télésecrétariat
BTP spécialisé).
- Chiffrage marketing (LockLead, Elio — **source vendeur, à vérifier, non
  auditée indépendamment**) : un appel manqué représenterait 75€–450€ de CA
  évaporé selon le corps de métier ; un artisan indépendant perdrait
  12 000€–18 000€/an de CA à cause des appels manqués.
- Stat souvent citée (origine probable : étude Kellogg/InsideSales.com 2011,
  reprise sans source primaire par locklead.fr) : un prospect rappelé en
  moins de 5 minutes se qualifie 21x plus qu'un prospect rappelé à 30 minutes.
- Preuve marché forte : le télésecrétariat téléphonique externalisé
  spécialisé BTP existe et se vend cher (Préposé, Thelem, A3COM, Absys) —
  50€ à 300€/mois en forfait, ou 0,60€ à 2€/appel. Les artisans payent déjà
  pour ce problème avec une solution humaine coûteuse et non automatisée.
- Sources : [LockLead](https://www.locklead.fr/), [appels-manques.fr — Artisan & BTP](https://appels-manques.fr/metier/artisan-btp), [Elio — coût appel manqué](https://eliocall.com/appels-manques-artisan/), [ipcontactgroup — permanence BTP](https://www.ipcontactgroup.com/permanence-telephonique-btp/)

### #2 — Devis envoyés, jamais relancés, jamais signés
L'artisan envoie un devis puis n'a pas le temps/la discipline de relancer.
Preuve marché tout aussi forte que #1, avec un concurrent en beta active :
**Payflo** (voir section concurrents) prétend que ses 50 artisans beta signent
37% de devis en plus en relançant systématiquement vs. relance passive.
- Stat souvent citée (**non vérifiée, source primaire introuvable** malgré
  recherche dédiée — probablement extrapolée/marketing) : jusqu'à 76% des
  devis BTP resteraient sans réponse ; 68% des particuliers demanderaient
  3 à 5 devis avant de choisir. À traiter comme un narratif marketing
  crédible, pas un fait établi.
- Le calendrier de relance "recommandé" par plusieurs sites converge :
  J+3 (courtoisie), J+7 (valeur), J+14 (question ouverte), J+21
  (alternative), J+30 (clôture) — ce pattern répété sur plusieurs sites
  indépendants suggère une pratique réelle du métier, pas juste un argumentaire.
- Sources : [Payflo](https://payflo.fr/), [Payflo — relance auto](https://payflo.fr/blog/relance-automatique-devis-artisan-btp/), [Kelyseo — relancer devis](https://www.kelyseo.com/blog/relancer-client-devis-sans-reponse-artisan)

### #3 — Gestion administrative = "premier ennemi de la rentabilité"
Thème transversal retrouvé dans plusieurs articles orientés dirigeants BTP :
90% des artisans seraient excellents techniquement mais faibles en gestion ;
devis en retard, factures non envoyées, relances oubliées, dépendance totale
au dirigeant (si le patron est sur un chantier, rien n'avance côté commercial).
C'est le contexte qui rend #1 et #2 douloureux — pas un JTBD isolé et
actionnable en soi pour un MVP (trop large).
- Sources : [Growth Scaling — scaler son activité BTP](https://www.growthscaling.fr/blog/de-lartisan-au-chef-dentreprise-comment-scaler-son-activit-btp), [HarmoniEase — déléguer](https://harmoniease4-0solutions.fr/artisan-btp-5-taches-administratives-que-vous-pouvez-deleguer-des-aujourdhui-pour-gagner-du-temps-sur-vos-chantiers/)

### #4 — Le CRM/logiciel BTP existant fait mal le suivi commercial
Les avis négatifs sur les CRM BTP/field service généralistes (marché anglophone,
mieux documenté sur Capterra/G2) pointent vers un pattern clair : ces outils
sont bons pour la facturation/planning/chantier, mais le module de relance
commerciale est faible ou absent.
- JobNimbus (4.6-4.7/5 sur 550+ avis) : le module email documenté comme point
  de défaillance récurrent, un avis mentionne un email client manqué ayant
  mené à une plainte BBB.
- Jobber : qualifié de "overpriced" par un avis, relance/automatisation jugées
  minimales, nécessitant des intégrations tierces payantes ; note F au BBB
  début 2026.
- Buildertrend : le costing jugé "difficile à naviguer", un reviewer G2 note
  que "les ingénieurs qui construisent Buildertrend ne sont pas les
  utilisateurs finaux".
- Lecture business : le CRM généraliste BTP n'est **pas** le concurrent
  direct d'un agent de relance IA — c'est un système d'enregistrement
  (devis/factures/planning) sur lequel un agent de relance peut se brancher
  ou coexister sans le remplacer.
- Sources : [Capterra — Contractor+ reviews](https://www.capterra.com/p/213952/Contractor/reviews/), [Capterra — Contractor Foreman](https://www.capterra.com/p/166113/Contractor-Foreman/reviews/), [myquoteiq — Jobber reviews](https://myquoteiq.com/jobber-reviews/)

### #5 — Pas le temps / pas envie de faire du démarchage/suivi commercial
Douleur diffuse retrouvée dans le contexte "j'ai été formé à mon métier
technique, pas à la vente" — sous-jacente à #1-#3 mais jamais formulée comme
un produit à part. Signal faible pour un MVP isolé, plutôt une toile de fond
qui justifie le positionnement "on s'occupe de la partie commerciale, vous
faites le métier".

---

## 2. Concurrents identifiés

| Concurrent | Catégorie | Prix | Ce qu'il fait | Faille exploitable |
|---|---|---|---|---|
| **Payflo** (payflo.fr) | Relance devis BTP, IA | 29-49€/mo (Signe+) → 179€/mo (Pilot+) | Relance IA post-devis (jusqu'à 11 relances), signature électronique, encaissement d'acompte sous 48h. 50 artisans en beta. | Suppose que le devis existe déjà dans un outil tiers ou le leur — ne couvre pas l'amont (appel entrant, qualification). Positionnement "encaissement", pas "conversation". Prix qui grimpe vite (179€ palier haut). |
| **LockLead** (locklead.fr) | Capture appel manqué | 49€/mo flat, sans engagement | SMS auto + mini-formulaire sous 3 secondes après appel manqué, dashboard trié par urgence. Taux de capture annoncé 65-70% vs 20% répondeur seul. | SMS + formulaire **statique**, pas de conversation. Pas de qualification IA, pas de relance derrière le premier contact. |
| **appels-manques.fr / Elio** | Capture appel manqué | Comparateurs/agrégateurs + solutions similaires | Même logique que LockLead, avec du contenu SEO agressif sur les mots-clés "appel manqué artisan". | Ce sont surtout des sites de contenu/comparateur — la barrière à l'entrée SEO sur ces mots-clés est déjà occupée. |
| **Télésecrétariat externalisé** (Préposé, Thelem, A3COM, Absys) | Solution humaine | 50-300€/mo forfait, ou 0,60-2€/appel | Vraie secrétaire humaine qui répond, comprend le jargon métier. | Cher, non scalable pour le patron artisan, horaires limités, pas 24/7, coût variable imprévisible au forfait/appel. |
| **CRM BTP généralistes** (Obat, Batappli, Tolteck, myB2O, Divalto Weavy) | ERP/CRM métier | 20-100€/utilisateur/mo | Devis, factures, planning chantier, CRM basique (pipeline, relances manuelles). | Pas nativement IA, relance = tâche manuelle à programmer soi-même, complexité d'outil "tout-en-un" que le solo-artisan n'exploite pas. |
| **AI receptionist / missed-call text-back** (US : OpenPhone/Quo, Podium, Chekkit, AIRA) | Généraliste, pas BTP | 15-500€/mo selon acteur (Podium 300-400€+/mo base) | Réponse auto par SMS à l'appel manqué, parfois IA conversationnelle légère. | Marché anglophone, pas spécialisé BTP (pas de compréhension du jargon chantier/urgence), pricing élevé pour un solo-artisan (Podium). Utile comme preuve de marché à l'international, pas un concurrent direct FR. |

**Constat clé** : le marché français a **déjà scindé** le problème en deux
produits distincts et déjà vendus séparément — capture d'appel manqué
(LockLead/appels-manques) d'un côté, relance de devis (Payflo) de l'autre.
**Aucun des deux n'est un agent conversationnel IA** : ce sont des séquences
SMS/email programmées (templates), pas un agent qui dialogue, pose des
questions de qualification, et s'adapte à la réponse du prospect. C'est
l'ouverture.

---

## 3. Job-to-be-done : qu'est-ce que le patron BTP paierait pour déléguer DEMAIN ?

Le JTBD le plus urgent et le plus universel, formulé comme le dirait le
patron : **"Je ne veux plus perdre un client parce que je n'ai pas pu
décrocher pendant que j'étais sur un chantier."**

Pourquoi ce JTBD plutôt que la relance de devis :
1. **Douleur plus immédiate et plus universelle** — tous les artisans reçoivent
   des appels entrants pendant qu'ils travaillent ; tous n'envoient pas
   forcément des devis formalisés régulièrement (certains closent au
   téléphone/sur place).
2. **MVP techniquement plus simple et autonome** — pas besoin d'intégrer un
   logiciel de devis tiers (Obat, Batappli, etc., sans API publique fiable
   connue). Il suffit d'un renvoi d'appel + webhook SMS + agent DeepSeek. Le
   "wow moment" (< 10 min) est atteignable : le patron configure son transfert
   d'appel, appelle son propre numéro pour tester, reçoit la conversation
   qualifiée en moins de 10 minutes.
3. **Différenciation claire vs. LockLead (49€/mo, SMS statique)** : un agent
   conversationnel qui pose 2-3 questions de qualification (nature des
   travaux, urgence, code postal, budget approximatif) et programme un
   rappel, plutôt qu'un simple formulaire. Vendable plus cher que 49€/mo sur
   la base "un vrai assistant, pas un SMS".
4. Le module de relance de devis (douleur #2) devient une **évolution
   naturelle en v2** une fois la base installée (le patron a déjà confiance,
   on branche la relance sur les leads déjà qualifiés par l'agent).

**Garde-fou non négociable dès le MVP** (rappel de la contrainte mission) :
l'agent qualifie, recueille l'information, et programme un rappel humain — il
**ne donne jamais de prix, de délai, ni d'engagement contractuel**. C'est
un filtre + preneur d'information, pas un vendeur autonome. Ce choix réduit
aussi le risque légal/réputationnel pour un MVP solo.

---

## 4. Recommandation tranchée

### Cas d'usage unique du MVP
**Agent IA de qualification des appels manqués pour artisans/PME BTP** :
quand un appel entrant n'est pas décroché (chantier, urgence, indisponibilité),
le prospect reçoit un SMS en quelques secondes, engage une conversation avec
l'agent IA (DeepSeek) qui qualifie le besoin (métier concerné, urgence,
localisation, description succincte, meilleur moment pour être rappelé), puis
notifie le patron avec une fiche prête à l'emploi (pas juste une transcription
brute). Rien d'autre dans le MVP — pas de relance de devis, pas de prise de
RDV automatique, pas de paiement.

### Pricing cible
**79€/mois, sans engagement**, palier unique au lancement.
Justification : positionné au-dessus de LockLead (49€/mo, produit statique)
mais très en dessous du télésecrétariat externalisé (150-300€/mo) et de
Podium (300-400€/mo). Marge suffisante pour couvrir coût DeepSeek + SMS/appel
(Twilio ou équivalent) à ce volume (un artisan solo = quelques dizaines
d'appels manqués/mois, pas des milliers). Pas de palier "par utilisateur" au
MVP — trop complexe à vendre à un patron seul.

### Canal d'acquisition n°1
**Démo à froid personnalisée par téléphone/SMS**, pas le SEO/SEA sur
"appel manqué artisan" (mots-clés déjà occupés par LockLead/appels-manques/Elio
avec du contenu établi — coût d'acquisition SEA probablement déjà tendu sur
ces requêtes). La démo se fait ainsi : on identifie 50 artisans locaux
(Google Maps/Pages Jaunes), on appelle leur numéro professionnel un jour
ouvré à une heure où ils sont probablement sur chantier, on laisse volontairement
l'appel non traité s'il ne décroche pas, puis on leur envoie un SMS de suivi :
*"Bonjour [Prénom], je viens d'essayer de vous joindre pour un devis —
c'est exactement ce que vit un de vos clients quand vous êtes sur un chantier.
Voici comment j'aurais pu être recontacté en 30 secondes : [lien démo]."*
C'est un canal qui ne coûte que du temps (solopreneur), démontre la douleur
de façon vécue plutôt qu'expliquée, et sert de base au plan d'outreach détaillé
en Phase 4.

### Ce qu'il faut valider avant de coder (risques ouverts)
1. **Risque concurrentiel direct** : LockLead a déjà un produit fonctionnel à
   49€/mo sur ce créneau précis. Le pari du MVP est que "agent conversationnel
   IA" bat "SMS + formulaire statique" sur le taux de qualification et la
   perception de valeur — à valider par 10-15 conversations clients avant
   d'investir plus de 2 semaines de dev.
2. Le chiffrage de la douleur (76% devis sans réponse, 12-18k€/an perdus)
   vient de sites vendeurs concurrents, pas d'une source indépendante — ne
   pas le réutiliser tel quel dans le copywriting sans le reformuler en
   hypothèse ("jusqu'à X€ de CA perdu selon nos estimations", pas "une étude
   montre que").
3. Zone non couverte par cette recherche documentaire : verbatims réels
   Reddit/X/Facebook. À combler par les 10-15 appels de validation avant la
   Phase 4 d'outreach à 50 cibles.

---

**STOP — Phase 1 terminée. En attente de validation avant de lancer la
Phase 2 (PRD).**
