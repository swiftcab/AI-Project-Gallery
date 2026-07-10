# Dette technique — registre

Format : chaque dette = décision assumée pour gagner du temps, avec son plan de remboursement.

| # | Dette | Gain | Risque accepté | Remboursement prévu |
|---|---|---|---|---|
| 1 | Billing manuel (Stripe Payment Link + `planStatus` mis à jour à la main) | ~1 semaine de dev évitée au MVP | Ne scale pas au-delà de ~10 clients ; erreur humaine possible | Intégrer Stripe Billing quand > 5 clients payants |
| 2 | Pool de numéros (voix + VMN SMS) provisionné manuellement chez les fournisseurs | Pas d'intégration API de provisioning à écrire | Onboarding limité au rythme manuel (~OK pour pilotes) | API de provisioning quand > 10 comptes/mois |
| 3 | Un seul fournisseur SMS branché au lancement (celui qui gagne le spike J1) ; l'abstraction `MessagingProvider` existe mais le 2e adapter n'est pas écrit ni testé | ~3 jours | Dépendance fournisseur ; migration non répétée | Écrire le 2e adapter au premier incident fournisseur ou avant 20 clients |
| 4 | Pas de portage du numéro du client (renvoi `*61*` uniquement) | Évite le cauchemar réglementaire/opérationnel du portage | Si le client désactive le renvoi, le produit "ne marche plus" silencieusement → mitigé par un check périodique de `forwardVerifiedAt` (v1.1) | Réévaluer si churn attribuable au renvoi |
