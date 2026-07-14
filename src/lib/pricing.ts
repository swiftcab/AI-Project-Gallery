/**
 * Source de vérité UNIQUE des plans — consommée par la landing (affichage)
 * et par /api/checkout (facturation). Les features listées ici ne doivent
 * décrire QUE des capacités réellement livrables aujourd'hui (règle
 * docs/go-to-market.md : rien d'inventé, rien de promis non construit).
 *
 * Les Price IDs Stripe vivent dans l'env (STRIPE_PRICE_*) : les produits
 * sont créés dans le dashboard Stripe par le fondateur, jamais en dur ici.
 */

export type PlanId = "decouverte" | "pro" | "artisan";

export interface Plan {
  id: PlanId;
  name: string;
  priceLabel: string;
  priceSuffix: string;
  highlighted: boolean;
  /** Plan payant via Stripe Checkout (sinon: essai white-glove sans CB) */
  stripePriceEnvVar: string | null;
  cta: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "decouverte",
    name: "Découverte",
    priceLabel: "Gratuit",
    priceSuffix: "14 jours",
    highlighted: false,
    stripePriceEnvVar: null,
    cta: "Commencer l'essai",
    features: [
      "1 numéro dédié + renvoi d'appel",
      "Qualification SMS illimitée pendant l'essai",
      "Fiches par SMS + tableau de bord",
      "Installation accompagnée au téléphone",
      "Sans carte bancaire",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "79 €",
    priceSuffix: "/ mois",
    highlighted: true,
    stripePriceEnvVar: "STRIPE_PRICE_PRO",
    cta: "Choisir Pro",
    features: [
      "Appels manqués illimités, 24/7",
      "Détection d'urgence (fiche marquée URGENT)",
      "Résumé en langage clair sur votre mobile",
      "Respect STOP + horaires légaux garanti",
      "Sans engagement — résiliable en un message",
      "Support par téléphone",
    ],
  },
  {
    id: "artisan",
    name: "Artisan+",
    priceLabel: "149 €",
    priceSuffix: "/ mois",
    highlighted: false,
    stripePriceEnvVar: "STRIPE_PRICE_ARTISAN",
    cta: "Choisir Artisan+",
    features: [
      "Tout le plan Pro",
      "Jusqu'à 3 lignes / numéros gérés",
      "Idéal équipes et multi-métiers",
      "Onboarding de chaque ligne accompagné",
      "Support prioritaire",
    ],
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Plans achetables en ligne (les autres passent par l'essai/contact). */
export const CHECKOUTABLE_PLANS: PlanId[] = PLANS.filter((p) => p.stripePriceEnvVar).map((p) => p.id);
