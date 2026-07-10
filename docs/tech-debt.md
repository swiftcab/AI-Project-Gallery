# Dette technique — registre

Format : chaque dette = décision assumée pour gagner du temps, avec son plan de remboursement.

| # | Dette | Gain | Risque accepté | Remboursement prévu |
|---|---|---|---|---|
| 1 | Billing manuel (Stripe Payment Link + `planStatus` mis à jour à la main) | ~1 semaine de dev évitée au MVP | Ne scale pas au-delà de ~10 clients ; erreur humaine possible | Intégrer Stripe Billing quand > 5 clients payants |
| 2 | Pool de numéros (voix + VMN SMS) provisionné manuellement chez les fournisseurs | Pas d'intégration API de provisioning à écrire | Onboarding limité au rythme manuel (~OK pour pilotes) | API de provisioning quand > 10 comptes/mois |
| 3 | Un seul fournisseur SMS branché au lancement (celui qui gagne le spike J1) ; l'abstraction `MessagingProvider` existe mais le 2e adapter n'est pas écrit ni testé | ~3 jours | Dépendance fournisseur ; migration non répétée | Écrire le 2e adapter au premier incident fournisseur ou avant 20 clients |
| 4 | Pas de portage du numéro du client (renvoi `*61*` uniquement) | Évite le cauchemar réglementaire/opérationnel du portage | Si le client désactive le renvoi, le produit "ne marche plus" silencieusement → mitigé par un check périodique de `forwardVerifiedAt` (v1.1) | Réévaluer si churn attribuable au renvoi |
| 5 | Pas d'auth self-serve : dashboard derrière HTTP Basic (`src/middleware.ts`), onboarding "white-glove" via `scripts/create-account.ts` | ~1,5 semaine (signup, magic link, sessions, wizard) | Un seul couple user/pass partagé par déploiement — acceptable pour 3-10 pilotes accompagnés, pas au-delà | Vraie auth (magic link + sessions) avant toute ouverture self-serve |
| 6 | Le worker tourne via `tsx src/worker.ts` en prod (pas de build compilé dédié) | Évite une 2e chaîne de build | Démarrage un peu plus lent, surcoût CPU négligeable à notre échelle | Compiler avec esbuild si le démarrage/empreinte devient un sujet |
| 7 | Payload webhook SMS entrant normalisé `{from,to,body}` : le mapping exact smsmode sera figé au spike J1 | Permet de coder/tester tout le flux sans compte smsmode | Ajustement de mapping à prévoir au spike (1-2 h) | Figer au spike + test contractuel sur le payload réel |
