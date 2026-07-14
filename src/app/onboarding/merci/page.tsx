import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compte créé — Décroché",
  robots: { index: false },
};

export default function OnboardingMerciPage() {
  return (
    <main className="container" style={{ padding: "96px 20px", textAlign: "center", maxWidth: 640 }}>
      <div style={{ fontSize: 56 }} aria-hidden>
        🎉
      </div>
      <h1 style={{ letterSpacing: "-0.02em" }}>Votre compte est créé.</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
        Dernière étape, et c&apos;est nous qui nous en occupons : nous vous appelons{" "}
        <strong>sous quelques heures ouvrées</strong> pour attribuer votre numéro Décroché et
        activer le renvoi d&apos;appel avec vous — moins de 10 minutes au téléphone.
      </p>
      <p style={{ color: "var(--muted)" }}>
        Une question tout de suite ? <a href="mailto:pilote@qualifyourlead.com">pilote@qualifyourlead.com</a>
      </p>
      <p style={{ marginTop: 32 }}>
        <a className="btn btn-primary" href="/">
          Retour à l&apos;accueil
        </a>
      </p>
    </main>
  );
}
