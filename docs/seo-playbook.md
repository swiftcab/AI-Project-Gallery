# SEO — playbook et boucle continue (Hermes + CTO + fondateur)

Objectif : faire de qualifyourlead.com la réponse de référence sur les
requêtes « appels manqués / téléphone » des artisans BTP francophones.
Posture honnête d'abord : **personne ne peut garantir un #1 Google**, et
tout prestataire ou agent qui le promet ment. Ce qu'on peut garantir :
viser des requêtes longue traîne à faible concurrence, publier du contenu
réellement utile, mesurer, et itérer — c'est exactement ce que les sites
qui finissent #1 ont fait.

## Ce qui est déjà en place (infrastructure, commit du 16/07)

- Blog versionné dans le repo : `src/lib/blog.ts` (contenu) +
  `src/app/blog/` (rendu). Un article = une entrée TypeScript, zéro CMS.
- JSON-LD `Article` + `FAQPage` + `SoftwareApplication`, sitemap.xml
  dynamique (blog inclus), robots.txt, canonical, métadonnées OG/Twitter,
  image OpenGraph générée au build (`opengraph-image.tsx`).
- 3 articles fondateurs publiés, un par intention :
  1. `renvoi-appel-61-artisan` — requête outil (« renvoi d'appel *61* »),
     très faible concurrence, le lecteur a exactement notre problème.
  2. `appel-manque-artisan-que-faire` — requête douleur.
  3. `secretariat-telephonique-artisan-comparatif` — requête comparateur,
     la plus proche de l'achat.

## Règles éditoriales (non négociables, comme la landing)

1. **Jamais de statistique inventée** ni de chiffre concurrent non audité
   (`docs/go-to-market.md`). Un article qui a besoin d'un chiffre qu'on
   n'a pas cite sa source ou reformule en scénario vécu.
2. **Écrire pour l'artisan, pas pour Google** : si un paragraphe n'aide
   pas un vrai plombier, il saute — le keyword stuffing est pénalisé par
   les mises à jour « helpful content » de Google depuis 2022.
3. **Être honnête sur nos limites** dans les comparatifs (voir l'article
   secrétariat : on dit noir sur blanc quand une option concurrente est
   meilleure). C'est ce qui rend le contenu crédible ET liable.
4. Chaque article vise UNE requête principale (champ `query` dans
   `blog.ts`), a un titre ≤ 65 caractères si possible, une meta
   description 120-155 caractères, et se termine par le CTA standard.

## La boucle continue — qui fait quoi

### Hermes (hebdomadaire — cron 6, à créer, voir bas de page)

**Recherche de requêtes** (sans outil payant au départ) :
- Google Autocomplete : taper « artisan appel », « plombier téléphone »,
  « renvoi d'appel », etc. et noter les suggestions — ce sont des
  requêtes réellement tapées.
- « People Also Ask » / « Autres questions posées » sur nos requêtes
  cibles — chaque question = un candidat H2 ou article.
- Forums et groupes (ForumConstruire, communautés d'artisans) : les
  questions récurrentes posées avec les mots des artisans.
- Dès que la Search Console est branchée (voir actions fondateur) :
  requêtes où on apparaît en position 5-20 avec des impressions — ce
  sont les victoires les plus rapides (améliorer un contenu existant
  plutôt qu'en créer un nouveau).

**Production** : Hermes rédige un BROUILLON d'article par semaine
maximum (qualité > volume), au format de `src/lib/blog.ts`, et le
dépose dans `ops/reports/seo-brouillon-<slug>.md` avec : la requête
cible, pourquoi elle (source : autocomplete/PAA/Search Console), et le
brouillon complet. **Hermes ne touche jamais à `src/` directement**
(règle PR-revue du 14/07) — le CTO relit, corrige, intègre dans
`blog.ts` et pushe. Le fondateur peut opposer son veto à tout sujet.

**Mesure** : dans le rapport hebdo existant (`SKILLS.md` §6), ajouter
3 lignes SEO : pages indexées, impressions/clics Search Console (quand
branchée), position moyenne sur les 3 requêtes fondatrices.

### CTO (Claude Code)

- Intègre les brouillons validés dans `blog.ts` (relecture faits +
  style + build vert + maillage interne entre articles).
- Maintient l'infrastructure technique (sitemap, JSON-LD, vitesse).

### Fondateur (actions manuelles, une fois)

1. **Google Search Console** (indispensable, gratuit, 10 min) :
   search.google.com/search-console → « Ajouter une propriété » →
   « Domaine » → `qualifyourlead.com` → validation DNS (ajouter
   l'enregistrement TXT affiché dans la zone DNS Hostinger) → une fois
   validé : menu « Sitemaps » → soumettre `sitemap.xml`.
2. **Google Business Profile** si un jour une adresse pro existe
   (optionnel à ce stade, on ne vise pas le local pack).

## Backlinks — ce qu'on fait et ce qu'on refuse

Les backlinks restent un signal majeur, mais **l'automatisation de
backlinks est exactement ce que Google pénalise** (link schemes). Aucun
agent n'achètera ni n'échangera de liens. Ce qu'on fait, dans l'ordre
de rentabilité pour notre taille :

1. **Annuaire/press d'écosystème** : être listé là où les artisans
   cherchent des outils (annuaires SaaS français, ProductHunt francophone,
   pages « outils pour artisans » des blogs BTP). Hermes constitue la
   liste des cibles, le fondateur approuve chaque soumission.
2. **Le contenu citable** : le guide *61* est conçu pour être LA
   référence pratique du sujet — les liens viennent naturellement quand
   des forums/blogs répondent à la question en pointant chez nous.
3. **Témoignages croisés** : dès le pilote n°1, proposer aux clients
   satisfaits qui ont un site un échange témoignage-contre-lien (réel,
   éditorial, pertinent — pas un scheme).
4. **Interdit** : PBN, achat de liens, commentaires de blog automatisés,
   annuaires spam, guest posts payés non signalés. Un domaine pénalisé
   à 3 mois d'existence ne s'en remet pas.

## Rythme réaliste et attentes

Un domaine neuf met **3 à 6 mois** à gagner la confiance de Google même
en faisant tout bien — le SEO est le canal de S3-S12, pas celui du
premier client (ça, c'est l'outreach direct, `go-to-market.md`). On
publie 1 article/semaine bien fait, on mesure à partir de la Search
Console, et on double la mise sur ce qui montre des impressions plutôt
que sur ce qu'on avait deviné.

### Cron 6 — SEO hebdo (mercredi 9h Paris = 7h UTC)

```
cron create:
  name: decroche-seo-hebdo
  schedule: 0 7 * * 3
  prompt: |
    Boucle SEO hebdomadaire Décroché (docs/seo-playbook.md) :
    1. Recherche : 30 min d'autocomplete Google + People Also Ask sur nos
       thèmes (appels manqués artisan, renvoi d'appel, secrétariat
       téléphonique BTP). Lister 3-5 requêtes candidates avec leur source.
    2. Choisir LA meilleure (intention la plus proche de notre produit,
       concurrence la plus faible en première page) et rédiger un brouillon
       d'article complet au format src/lib/blog.ts.
    3. Déposer le tout dans ops/reports/seo-brouillon-<slug>.md
       (commit + push — uniquement ce fichier, jamais src/).
    4. Si la Search Console est accessible : ajouter les 3 métriques
       (pages indexées, impressions, clics) au rapport.
    INTERDITS : statistique inventée, promesse prix/délai dans un contenu,
    toute action de backlink automatisée, tout commit hors ops/reports/.
  toolsets: [web]
```
