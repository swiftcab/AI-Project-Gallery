import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Décroché — Ne perdez plus un client parce que vous étiez sur un chantier",
  description:
    "Quand vous ne pouvez pas décrocher, notre assistant qualifie le client par SMS et vous prépare le rappel. Pour artisans et PME du BTP.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          color: "#1a1a1a",
          background: "#fafafa",
        }}
      >
        {children}
      </body>
    </html>
  );
}
