/**
 * Landing page — headline = douleur n°1 identifiée en Phase 1
 * (appels manqués sur chantier = clients perdus). Copie détaillée dans
 * docs/go-to-market.md ; cette page est le support de l'outreach pilotes.
 */

const S = {
  wrap: { maxWidth: 760, margin: "0 auto", padding: "48px 20px" } as const,
  h1: { fontSize: 38, lineHeight: 1.15, margin: "24px 0 12px" } as const,
  sub: { fontSize: 19, color: "#444", lineHeight: 1.5 } as const,
  card: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    padding: 20,
    margin: "16px 0",
  } as const,
  cta: {
    display: "inline-block",
    background: "#0f62fe",
    color: "#fff",
    padding: "14px 28px",
    borderRadius: 8,
    fontWeight: 700 as const,
    textDecoration: "none",
    fontSize: 17,
  } as const,
};

export default function LandingPage() {
  return (
    <main style={S.wrap}>
      <div style={{ fontWeight: 800, fontSize: 20 }}>📞 Décroché</div>

      <h1 style={S.h1}>
        Vous étiez sur un chantier.
        <br />
        Le client a appelé le suivant sur Google.
      </h1>
      <p style={S.sub}>
        Chaque appel manqué pendant que vous travaillez, c&apos;est un devis qui part chez un
        concurrent. <strong>Décroché</strong> répond pour vous par SMS en quelques secondes,
        pose les bonnes questions (besoin, urgence, commune, créneau) et vous envoie une fiche
        prête pour le rappel. Vous rappelez au bon moment, avec toutes les infos.
      </p>

      <div style={S.card}>
        <strong>Comment ça marche</strong>
        <ol style={{ lineHeight: 1.8, margin: "8px 0 0", paddingLeft: 20 }}>
          <li>Vous activez le renvoi d&apos;appel « si non-réponse » (un code à composer, 30 secondes).</li>
          <li>Un client appelle, vous ne pouvez pas décrocher : il reçoit un SMS immédiatement.</li>
          <li>Notre assistant qualifie sa demande en 2-3 questions. Jamais de prix, jamais de promesse — c&apos;est vous qui décidez.</li>
          <li>Vous recevez la fiche par SMS : « Mme Dupont (69003), fuite sous évier, à rappeler avant 9h ». Vous rappelez, vous signez.</li>
        </ol>
      </div>

      <div style={S.card}>
        <strong>79 € / mois. Sans engagement. Essai 14 jours.</strong>
        <p style={{ margin: "8px 0 0", color: "#444" }}>
          Un seul chantier récupéré rembourse plusieurs mois d&apos;abonnement. Vous gardez votre
          numéro : rien ne change pour vos clients.
        </p>
      </div>

      <p style={{ margin: "28px 0" }}>
        <a href="mailto:pilote@decroche.fr?subject=Je%20veux%20tester%20D%C3%A9croch%C3%A9" style={S.cta}>
          Devenir client pilote →
        </a>
      </p>

      <p style={{ color: "#888", fontSize: 14 }}>
        Conçu pour les artisans et PME du BTP (plombiers, électriciens, chauffagistes, maçons,
        couvreurs…). Données hébergées en Europe. SMS conformes (STOP inclus, aucune prospection
        sans votre accord).
      </p>
    </main>
  );
}
