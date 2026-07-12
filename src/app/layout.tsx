import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://qualifyourlead.com"),
  title: {
    default: "Décroché — Ne perdez plus un client sur un appel manqué | Artisans BTP",
    template: "%s | Décroché",
  },
  description:
    "Quand vous êtes sur un chantier, Décroché répond par SMS à vos appels manqués, qualifie la demande (besoin, urgence, créneau) et vous envoie une fiche prête pour le rappel. Pour plombiers, électriciens, chauffagistes, maçons, couvreurs. 79 €/mois sans engagement.",
  keywords: [
    "appel manqué artisan",
    "assistant SMS artisan",
    "qualification appels BTP",
    "secrétariat téléphonique artisan",
    "plombier appels manqués",
    "électricien standard téléphonique",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://qualifyourlead.com",
    siteName: "Décroché",
    title: "Vous étiez sur un chantier. Le client a appelé le suivant sur Google.",
    description:
      "Décroché répond par SMS à vos appels manqués, qualifie le client et prépare votre rappel. Pour artisans du BTP. Essai 14 jours.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Décroché — l'assistant SMS des artisans du BTP",
    description: "Chaque appel manqué répond par SMS en moins de 10 secondes. Fiche qualifiée, rappel préparé.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08090d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {/* Filet de sécurité JS désactivé : sans script, .reveal ne recevrait
            jamais .visible (ajoutée par Reveal.tsx) — on neutralise l'animation. */}
        <noscript>
          <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
