/**
 * Articles du blog SEO — contenu versionné dans le repo (pas de CMS).
 *
 * Règles éditoriales (docs/seo-playbook.md) :
 * - Jamais de statistique inventée ni de chiffre concurrent non audité
 *   (même règle que la landing, docs/go-to-market.md).
 * - Chaque article vise UNE requête longue traîne précise (champ `query`),
 *   choisie pour son intention (un artisan qui la tape a le problème qu'on
 *   résout) plutôt que pour un volume supposé qu'on ne peut pas mesurer
 *   avant d'avoir la Search Console.
 * - Un nouvel article = une entrée ici + build vert. La date est celle de
 *   la publication réelle.
 */

export type ArticleSection = {
  h2?: string;
  p?: string[];
  ul?: string[];
};

export type Article = {
  slug: string;
  title: string;
  description: string;
  /** Requête cible principale (documentation interne, pas affichée) */
  query: string;
  date: string; // ISO
  sections: ArticleSection[];
};

export const ARTICLES: Article[] = [
  {
    slug: "renvoi-appel-61-artisan",
    title: "Renvoi d'appel *61* : le guide pratique pour artisans",
    description:
      "Comment activer le renvoi d'appel « si non-réponse » (*61*) sur votre mobile, chez Orange, SFR, Bouygues ou Free — et pourquoi c'est l'outil le plus sous-estimé d'un artisan sur chantier.",
    query: "renvoi d'appel si non réponse artisan *61*",
    date: "2026-07-16",
    sections: [
      {
        p: [
          "Le renvoi d'appel conditionnel — le fameux code *61* — existe sur tous les téléphones depuis des décennies, et presque personne ne s'en sert. Pour un artisan qui passe ses journées sur chantier, c'est pourtant la différence entre un appel manqué qui disparaît et un appel manqué qui est pris en charge.",
          "Ce guide explique ce que fait exactement ce renvoi, comment l'activer selon votre opérateur, comment vérifier qu'il fonctionne, et comment le désactiver si besoin. Cinq minutes, aucun technicien.",
        ],
      },
      {
        h2: "Ce que fait le renvoi « si non-réponse » (et ce qu'il ne fait pas)",
        p: [
          "Le renvoi conditionnel *61* transfère un appel vers un autre numéro uniquement quand vous ne décrochez pas au bout d'un certain temps (par défaut environ 15 à 20 secondes selon l'opérateur). Quand vous décrochez, rien ne change : l'appel vous arrive normalement, le renvoi n'intervient jamais.",
          "C'est ce qui le distingue du renvoi inconditionnel (*21*), qui transfère TOUS les appels sans faire sonner votre téléphone — à éviter pour un artisan, sauf congés. Avec *61*, vous restez le premier à pouvoir décrocher ; le renvoi n'est qu'un filet de sécurité.",
        ],
      },
      {
        h2: "Activer le renvoi, opérateur par opérateur",
        p: [
          "La syntaxe universelle GSM fonctionne chez tous les opérateurs français (Orange, SFR, Bouygues, Free et leurs marques low-cost). Depuis le clavier d'appel de votre téléphone, composez :",
        ],
        ul: [
          "**Activer** : *61*, puis le numéro de destination au format international (ex. +33612345678), puis # — soit : *61*+33612345678#, et appuyez sur la touche d'appel.",
          "**Vérifier l'état** : *#61# — l'écran affiche si le renvoi est actif et vers quel numéro.",
          "**Désactiver** : #61# — le renvoi est coupé, tout redevient comme avant.",
          "**Régler le délai avant renvoi** (selon opérateur) : *61*numéro**délai# avec un délai en secondes (5 à 30, par pas de 5) — ex. *61*+33612345678**20#.",
        ],
      },
      {
        h2: "Tester que ça marche (2 minutes, à faire une fois)",
        p: [
          "Après activation, appelez votre propre numéro professionnel depuis un autre téléphone (celui d'un proche, ou votre ligne fixe) et laissez sonner sans décrocher. L'appel doit basculer vers la destination configurée après le délai. Si rien ne se passe, vérifiez avec *#61# que le renvoi est bien enregistré, et que le numéro de destination est au format +33.",
          "Refaites ce test après tout changement de téléphone ou de carte SIM : le renvoi est porté par la ligne, mais une manipulation de SIM ou une eSIM réinstallée peut le réinitialiser silencieusement.",
        ],
      },
      {
        h2: "Pourquoi c'est la brique de base d'un standard d'artisan",
        p: [
          "Vers quoi renvoyer ? C'est là que tout se joue. Renvoyer vers la messagerie vocale ne change rien : la majorité des particuliers ne laissent pas de message et rappellent le concurrent suivant sur Google. Renvoyer vers un secrétariat humain fonctionne, mais coûte un abonnement mensuel significatif et s'arrête le soir et le week-end.",
          "La troisième option, celle que nous avons construite avec Décroché : renvoyer vers un numéro qui ne décroche pas mais déclenche immédiatement un SMS au client. Le client explique son besoin par écrit, à n'importe quelle heure, et vous recevez une fiche claire — qui, quoi, quelle urgence, quand rappeler. Le renvoi *61* reste la seule installation nécessaire : pas d'application, pas de changement de numéro.",
        ],
      },
    ],
  },
  {
    slug: "appel-manque-artisan-que-faire",
    title: "Appels manqués sur chantier : pourquoi ils coûtent cher et comment les rattraper",
    description:
      "Un artisan ne peut pas décrocher les mains dans une soudure. Ce que devient un appel manqué, pourquoi le rappel tardif échoue souvent, et les trois façons concrètes de ne plus perdre ces clients.",
    query: "appel manqué artisan que faire",
    date: "2026-07-16",
    sections: [
      {
        p: [
          "Vous êtes en train de couler une chape, de tirer un câble en faux plafond, ou simplement en rendez-vous chez un client. Le téléphone vibre. Impossible de répondre. À la pause, vous voyez l'appel manqué : numéro inconnu, pas de message vocal. Vous rappelez — ça ne répond pas. Fin de l'histoire, la plupart du temps.",
          "Ce scénario, chaque artisan le vit plusieurs fois par semaine. Ce n'est pas un problème d'organisation ni de bonne volonté : c'est structurel. Votre métier exige vos deux mains et votre attention ; le téléphone exige une réponse en dix secondes.",
        ],
      },
      {
        h2: "Ce qui se passe vraiment côté client",
        p: [
          "Mettez-vous à la place du particulier qui a une fuite ou un tableau électrique qui disjoncte. Il a cherché « plombier + sa ville » sur Google, il appelle le premier de la liste. Pas de réponse. Que fait-il ? Il ne laisse pas de message vocal ni ne note votre numéro pour plus tard — il appelle le deuxième de la liste. Son problème est immédiat, la solution doit l'être aussi.",
          "Quand vous rappelez deux heures plus tard, deux cas de figure : il a déjà trouvé quelqu'un, ou il ne décroche pas parce qu'il ne reconnaît pas votre numéro. Le rappel tardif à froid est le geste commercial le moins rentable qui existe — non parce que vous rappelez mal, mais parce que le lien est déjà rompu.",
        ],
      },
      {
        h2: "Les trois façons de rattraper un appel manqué",
        ul: [
          "**La messagerie vocale améliorée** : une annonce claire (« Je suis sur un chantier, laissez votre nom et votre besoin, je rappelle avant ce soir ») vaut mieux que le répondeur par défaut. Gratuit, mais ça ne résout pas le cœur du problème : la plupart des gens raccrochent avant le bip.",
          "**Le secrétariat téléphonique humain** : une personne décroche à votre place, prend le message, vous le transmet. Efficace en journée, rassurant pour le client. Limites : le coût mensuel, les horaires de bureau (vos appels du samedi matin et de 19h restent perdus), et une prise de message parfois trop générique pour prioriser.",
          "**Le SMS automatique de rattrapage** : l'appel manqué déclenche immédiatement un SMS au client (« Je suis sur un chantier — dites-moi en deux mots ce qu'il vous faut, je vous rappelle »). Le client répond par écrit, quand il veut. C'est l'approche de Décroché, avec une différence : notre assistant pose 2-3 questions (besoin, urgence, créneau) et vous transmet une fiche déjà qualifiée, pas juste un « rappelez-moi ».",
        ],
      },
      {
        h2: "Ce qu'il faut exiger de n'importe quelle solution",
        p: [
          "Quel que soit votre choix, trois critères non négociables. Un : la rapidité — le contact doit être établi dans la minute qui suit l'appel manqué, pas à la fin de votre journée. Deux : le respect du client — jamais de messages la nuit ou le dimanche, arrêt immédiat si la personne le demande. Trois : aucun engagement pris à votre place — ni prix, ni délai, ni rendez-vous ferme. Un assistant qui promet « une intervention demain à 8h » sans vous consulter vous crée des problèmes au lieu d'en résoudre.",
          "Ce dernier point est notre obsession chez Décroché : l'assistant recueille et qualifie, mais toutes les décisions — prix, délais, rendez-vous — restent les vôtres. C'est verrouillé techniquement, pas juste promis.",
        ],
      },
    ],
  },
  {
    slug: "secretariat-telephonique-artisan-comparatif",
    title: "Secrétariat téléphonique pour artisan : les 4 options comparées honnêtement",
    description:
      "Répondeur, secrétariat humain, standard virtuel, assistant SMS : forces, limites et coûts réels de chaque option pour un artisan du BTP qui rate des appels sur chantier.",
    query: "secrétariat téléphonique artisan comparatif",
    date: "2026-07-16",
    sections: [
      {
        p: [
          "« Il te faut un secrétariat » — le conseil revient dès qu'un artisan se plaint de rater des appels. Mais un secrétariat, ça recouvre quatre réalités très différentes, du répondeur gratuit au standard externalisé. Voici les quatre options, avec leurs forces et leurs angles morts, sans prétendre que la nôtre convient à tout le monde.",
        ],
      },
      {
        h2: "Option 1 — La messagerie vocale travaillée (gratuit)",
        p: [
          "Le minimum vital : remplacer l'annonce par défaut par un message qui donne un engagement clair (« je rappelle avant ce soir ») et demande le nécessaire (nom, commune, nature du besoin). Coût nul, mise en place en cinq minutes.",
          "L'angle mort : ça repose entièrement sur la volonté du client de laisser un message. Beaucoup raccrochent avant le bip, surtout pour une demande non urgente — précisément les devis confortables que vous aimeriez recevoir.",
        ],
      },
      {
        h2: "Option 2 — Le secrétariat téléphonique humain",
        p: [
          "Une télésecrétaire décroche en votre nom, prend le message, vous l'envoie par email ou SMS. C'est chaleureux, professionnel, et adapté si votre volume d'appels est important et concentré en journée.",
          "Les limites : le coût (un abonnement mensuel plus, souvent, une facturation à l'appel — comptez un budget mensuel récurrent significatif à volume d'artisan), les horaires (soirs et week-ends généralement non couverts ou en surcoût), et la qualification : une secrétaire qui gère des dizaines de métiers ne sait pas toujours qu'une « fuite sous évier » et une « fuite sur nourrice » n'ont pas la même urgence.",
        ],
      },
      {
        h2: "Option 3 — Le standard virtuel / serveur vocal",
        p: [
          "« Tapez 1 pour une urgence, tapez 2 pour un devis… » Ces systèmes orientent l'appelant et peuvent basculer vers un second numéro. Utiles pour une PME avec plusieurs équipes.",
          "Pour un artisan seul ou en binôme, c'est souvent contre-productif : le particulier qui appelle pour une fuite veut un humain ou une prise en charge immédiate, pas un menu. Le taux d'abandon en cours de menu est l'angle mort de cette option.",
        ],
      },
      {
        h2: "Option 4 — L'assistant SMS avec qualification (notre approche)",
        p: [
          "L'appel manqué déclenche immédiatement une conversation SMS : l'assistant se présente comme votre assistant (jamais comme vous), pose deux à trois questions — nature du besoin, degré d'urgence, créneau de rappel souhaité — et vous transmet une fiche synthétique triée par priorité. Le client écrit quand il veut, y compris le dimanche soir pour un devis de salle de bain ; vous rappelez en sachant déjà de quoi il s'agit.",
          "Les limites, pour être honnête : ça suppose que vos clients acceptent d'échanger par SMS (c'est massivement le cas chez les particuliers, moins sur certains marchés B2B très formels), et ça ne remplace pas une secrétaire pour la gestion d'agenda ou la facturation. C'est un filet de rattrapage des appels manqués, pas une assistante de direction.",
          "Chez Décroché, c'est 79 € par mois sans engagement, avec une règle verrouillée techniquement : l'assistant ne donne jamais un prix, un délai ou un engagement à votre place. Essai gratuit de 14 jours, installation par un simple renvoi d'appel *61* — votre numéro ne change pas.",
        ],
      },
      {
        h2: "Comment choisir",
        ul: [
          "Moins de 3 appels manqués par semaine → messagerie vocale travaillée, c'est suffisant.",
          "Gros volume d'appels en journée + besoin de gestion d'agenda → secrétariat humain.",
          "Plusieurs équipes / plusieurs services → standard virtuel.",
          "Des appels manqués réguliers sur chantier, le soir, le week-end, et l'envie de rappeler en sachant déjà le besoin → assistant SMS avec qualification.",
        ],
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
