# Go-to-market — Objectif : 3 clients pilotes payants en 30 jours

Positionnement (issu de la Phase 1) : **« Vous étiez sur un chantier. Le client
a appelé le suivant sur Google. »** — la douleur n°1, vécue, pas expliquée.
Prix : 79 €/mo sans engagement, essai 14 jours, onboarding fait avec le client.

Règle d'hygiène : ne JAMAIS citer les stats marketing des concurrents
(« 76 % des devis sans réponse », « 12-18 k€/an perdus ») comme des faits —
non auditées (cf. research/market-findings.md). Parler en scénarios vécus.

---

## 1. Landing page (fait — `/` de l'app)
- Headline = douleur n°1 ; sous-titre = le mécanisme en une phrase.
- Un seul CTA : « Devenir client pilote » (mailto au MVP, Tally/Formulaire en v1.1).
- Preuve à ajouter dès le pilote n°1 : citation client + chiffre réel
  (« 9 leads récupérés le premier mois — Karim, plombier à Lyon »).

## 2. La démo automatisée : le produit EST la démo
Le mode « test en 1 appel » sert de démo commerciale sans rien construire de plus :
un **numéro de démo public** (compte interne « Plomberie Démo ») figure dans
chaque message d'outreach. Le prospect appelle, personne ne décroche, il vit
exactement ce que vivrait SON client : SMS en 10 s, 2 questions, récap.
Coût : 1 numéro voix + 1 VMN. Aucune vidéo à produire au lancement
(une capture d'écran de la conversation suffit dans les messages) ; vidéo 60 s
en v1.1 si le taux de réponse à l'outreach est < 10 %.

## 3. Séquence d'outreach — 50 PME BTP cibles

### Ciblage (2 h de travail)
- Google Maps : « plombier », « électricien », « chauffagiste » sur 2-3 villes
  moyennes (moins saturées que Paris) + sa propre région pour les RDV physiques.
- Filtres : fiche avec téléphone mobile (06/07) affiché, 10-80 avis Google
  (assez d'activité, pas de standard), pas de « ouvert 24/7 » (ceux-là ont
  déjà un centre d'appels).
- Tenir le fichier dans un simple CSV : nom, métier, ville, mobile, source, statut.

### Le geste d'ouverture : la démo vécue (canal n°1, validé Phase 1)
J1, 10h-16h (heures de chantier) : appeler le numéro pro. S'il décroche →
pitch direct honnête (script §4). S'il ne décroche pas → SMS :

> Bonjour [Prénom], [Votre prénom], de Décroché. Je viens d'essayer de vous
> joindre — comme vos clients quand vous êtes sur un chantier. La différence :
> ce SMS. Notre assistant répond pour vous, pose 2-3 questions et vous envoie
> la fiche du client à rappeler. Testez en 30 s : appelez le [NUMÉRO DÉMO]
> et ne dites rien, laissez sonner. 79 €/mo, sans engagement.
> Pas intéressé ? Répondez STOP, promis on n'insiste pas.

⚠️ Conformité prospection B2B FR : prospection SMS vers un numéro professionnel
au titre de l'intérêt légitime B2B = zone grise si la ligne est aussi
personnelle. Envoyer les SMS de prospection **manuellement depuis votre propre
mobile** (relation de personne à personne, volume 10-15/jour), jamais via la
plateforme ni un VMN — et honorer tout STOP immédiatement dans le CSV.

### Relances
- J+3 (si silence) — email si trouvable, sinon SMS :
  > [Prénom], question rapide : la semaine dernière, combien d'appels avez-vous
  > ratés pendant un chantier ? Si la réponse est « aucun », supprimez ce message.
  > Sinon, 15 min au téléphone cette semaine et je vous installe l'essai gratuit
  > (14 jours) — vous gardez votre numéro, un simple code à composer.
- J+8 — dernier message, l'angle preuve :
  > Dernier message promis. Chez [métier] comme vous, le premier chantier
  > récupéré paie l'année. Essai 14 jours sans CB : je vous installe tout en
  > 15 min au téléphone. Après je vous laisse tranquille.
- Puis stop définitif (le marché des artisans est petit et bavard — ne jamais griller sa réputation).

### Facebook/LinkedIn (canal secondaire, en parallèle)
- Groupes FB d'artisans (« Artisans du bâtiment France », groupes régionaux) :
  ne PAS spammer. Poster 1 fois une question ouverte (« Vous gérez comment les
  appels quand vous êtes sur chantier ? ») ; répondre en DM à ceux qui se
  plaignent. 3-5 conversations qualifiées/semaine réaliste.
- LinkedIn : dirigeants d'entreprises générales 5-50 salariés (persona
  secondaire) — message court avec le numéro de démo.

## 4. Script d'appel (quand ils décrochent)
> « Bonjour [Prénom], [Votre prénom]. Je vous appelle parce que je vends un
> truc simple : quand vous ratez un appel sur un chantier, mon assistant SMS
> rattrape le client à votre place. Question honnête : ça vous arrive souvent,
> des appels ratés qui ne rappellent jamais ? »
- Si oui → « Je vous fais vivre le truc en 30 secondes, appelez ce numéro… » → RDV d'installation.
- Si non/agacé → remercier, raccrocher, marquer LOST. Pas de forcing.

## 5. Offre pilote (les 3 premiers)
- 79 €/mo → **39 €/mo à vie pour les 3 premiers pilotes** en échange de :
  un appel de feedback de 20 min/mois + un témoignage (citation + prénom +
  métier + ville) si satisfait. Paiement par Stripe Payment Link dès la fin
  de l'essai (14 j) — un pilote gratuit qui ne paie jamais n'est pas une validation.
- Critère de succès du pilote (30 j) : ≥ 5 leads qualifiés livrés ET le patron
  a rappelé ≥ 80 % des fiches. Sinon, comprendre pourquoi avant de scaler.

## 6. Cadence sur 30 jours
| Semaine | Actions | Cible |
|---|---|---|
| S1 | Spike SMS fait, prod déployée, numéro démo actif, fichier 50 cibles | 15 premiers contacts |
| S2 | 35 contacts restants + relances J+3 | 5 tests du numéro démo, 3 RDV |
| S3 | Relances J+8, installations pilotes en visio/téléphone | 2 pilotes installés |
| S4 | Suivi quotidien des leads pilotes, ajustement prompts (test:prompts), témoignage n°1 | 3e pilote signé, 1er paiement |

KPI hebdo (5 lignes dans le CSV, pas de dashboard) : contacts, réponses,
appels du numéro démo, essais installés, payants.

## 7. Ce qu'on refuse pendant les 30 jours
- SEA/SEO sur « appel manqué artisan » (occupé par LockLead/Elio, CAC inconnu).
- Toute feature demandée par un prospect non payant (« vous devriez aussi… »).
- Les annuaires/marketplaces payants et la presse.
- Élargir hors BTP (« ça marcherait aussi pour les coiffeurs ! » — oui, plus tard).
