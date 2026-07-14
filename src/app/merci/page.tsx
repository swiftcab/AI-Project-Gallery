import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merci — bienvenue chez Décroché",
  robots: { index: false },
};

/** Page de retour Stripe Checkout (success_url). */
export default function MerciPage() {
  return (
    <main className="container" style={{ padding: "96px 20px", textAlign: "center", maxWidth: 640 }}>
      <div style={{ fontSize: 56 }} aria-hidden>
        ✅
      </div>
      <h1 style={{ letterSpacing: "-0.02em" }}>Merci, votre abonnement est confirmé.</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
        Vous recevez un email de confirmation de paiement. Nous vous contactons
        <strong> sous quelques heures ouvrées</strong> pour installer Décroché avec vous au
        téléphone : attribution de votre numéro, activation du renvoi d&apos;appel (2 minutes),
        et premier test en direct.
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
