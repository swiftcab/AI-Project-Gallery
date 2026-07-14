import Reveal from "./Reveal";
import { PLANS } from "@/lib/pricing";

/**
 * Landing page — headline = douleur n°1 (Phase 1), style sombre/animé,
 * SEO : metadata dans layout.tsx, JSON-LD ci-dessous, sitemap.ts, robots.ts.
 * Aucun témoignage ni chiffre client inventé (règle docs/go-to-market.md) —
 * les emplacements "preuve" seront remplis avec les vrais pilotes.
 */

const faq = [
  {
    q: "Est-ce que je dois changer de numéro de téléphone ?",
    a: "Non. Vous gardez votre numéro. Vous activez simplement le renvoi d'appel « si non-réponse » (un code à composer une fois, du type *61*). Quand vous décrochez, rien ne change. Quand vous ne pouvez pas, Décroché prend le relais par SMS.",
  },
  {
    q: "L'assistant peut-il annoncer un prix ou un délai à ma place ?",
    a: "Jamais. C'est une règle technique verrouillée à trois niveaux dans notre système, pas une promesse marketing : l'assistant recueille le besoin, l'urgence et le créneau de rappel, puis c'est vous qui décidez. Aucun engagement n'est pris sans vous.",
  },
  {
    q: "Que se passe-t-il si le client ne répond pas au SMS ?",
    a: "Vous recevez quand même une fiche « appel manqué de 06… , pas de réponse au SMS, à rappeler ». Une seule relance douce est envoyée, dans les horaires autorisés (jamais la nuit, jamais le dimanche), puis l'assistant s'arrête.",
  },
  {
    q: "Combien de temps pour l'installer ?",
    a: "Moins de 10 minutes, sans technicien : on vous attribue un numéro, vous composez le code de renvoi, vous testez en appelant votre propre numéro. Pour les premiers clients, on fait l'installation avec vous au téléphone.",
  },
  {
    q: "Est-ce conforme (RGPD, SMS STOP) ?",
    a: "Oui. Chaque conversation démarre en identifiant l'entreprise, tout destinataire peut répondre STOP à tout moment (traitement automatique et définitif), aucun SMS proactif n'est envoyé la nuit, le dimanche ou les jours fériés, et les données sont hébergées en Europe.",
  },
  {
    q: "Et si je rappelle en moins de 5 minutes de toute façon ?",
    a: "Parfait — Décroché ne vous remplace pas, il vous couvre. La fiche vous arrive avec le contexte déjà qualifié : vous rappelez en sachant déjà s'il s'agit d'une fuite en cours ou d'un devis de salle de bain pour cet été.",
  },
];

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Décroché",
        url: "https://qualifyourlead.com",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "Assistant IA qui répond par SMS aux appels manqués des artisans du BTP, qualifie la demande du client et prépare le rappel.",
        offers: [
          { "@type": "Offer", name: "Pro", price: "79", priceCurrency: "EUR", description: "79 € par mois, sans engagement" },
          { "@type": "Offer", name: "Artisan+", price: "149", priceCurrency: "EUR", description: "149 € par mois, jusqu'à 3 lignes" },
        ],
        audience: { "@type": "BusinessAudience", name: "Artisans et PME du BTP" },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

const CTA_HREF = "mailto:pilote@qualifyourlead.com?subject=Je%20veux%20tester%20D%C3%A9croch%C3%A9";

export default function LandingPage() {
  return (
    <>
      <JsonLd />

      <nav className="nav" aria-label="Navigation principale">
        <div className="container nav-inner">
          <a className="logo" href="/">
            <span className="logo-dot" aria-hidden />
            Décroché
          </a>
          <a className="btn btn-primary" href="/onboarding?plan=decouverte">
            Essai gratuit 14 j
          </a>
        </div>
      </nav>

      <header className="hero">
        <div className="blob blob-a" aria-hidden />
        <div className="blob blob-b" aria-hidden />
        <div className="container hero-grid">
          <div>
            <h1>
              Vous étiez sur un chantier.
              <br />
              <span className="accent">Le client a appelé le suivant</span> sur Google.
            </h1>
            <p className="sub">
              Chaque appel manqué pendant que vous travaillez est un devis qui part chez un concurrent.
              Décroché répond par SMS en quelques secondes, pose les bonnes questions, et vous envoie une
              fiche prête pour le rappel. Vous rappelez au bon moment — avec toutes les infos.
            </p>
            <div className="hero-ctas">
              <a className="btn btn-primary" href="/onboarding?plan=decouverte">
                Devenir client pilote →
              </a>
              <a className="btn btn-ghost" href="#comment">
                Voir comment ça marche
              </a>
            </div>
            <p className="hero-note">Sans engagement · Vous gardez votre numéro · Installation en 10 minutes</p>
          </div>

          <div className="phone" role="img" aria-label="Exemple de conversation SMS entre l'assistant Décroché et un client">
            <div className="phone-head">
              <div className="phone-avatar" aria-hidden>🔧</div>
              <div>
                <div className="phone-title">Plomberie Karim — assistant</div>
                <div className="phone-sub">appel manqué il y a 8 secondes</div>
              </div>
            </div>
            <div className="thread">
              <div className="bubble agent b1">
                Bonjour, ici l&apos;assistant de Plomberie Karim. Karim est sur un chantier et vous rappelle dès
                que possible. De quoi s&apos;agit-il ?
              </div>
              <div className="bubble client b2">J&apos;ai une fuite sous l&apos;évier, ça coule pas mal… Sophie, Lyon 3e</div>
              <div className="bubble agent b3">
                Merci Sophie, c&apos;est noté. Quel créneau vous arrange pour être rappelée ?
              </div>
              <div className="bubble client b4">Avant 9h demain si possible 🙏</div>
              <div className="bubble agent b5">
                Parfait : fuite sous évier (69003), rappel demain avant 9h. Karim vous rappelle.
              </div>
              <div className="bubble fiche b6">
                <strong>📋 Fiche envoyée à Karim</strong>
                <br />
                URGENT — Sophie (69003) : fuite sous évier en cours. Rappel souhaité avant 9h. 06 12 34 56 78
              </div>
            </div>
          </div>
        </div>
      </header>

      <section aria-label="Chiffres clés">
        <div className="container">
          <Reveal>
            <div className="stats">
              <div className="stat">
                <b>&lt; 10 s</b>
                <span>entre l&apos;appel manqué et le premier SMS</span>
              </div>
              <div className="stat">
                <b>3 questions</b>
                <span>maximum — besoin, urgence, créneau</span>
              </div>
              <div className="stat">
                <b>24/7</b>
                <span>soirs et week-ends inclus, sans standard</span>
              </div>
              <div className="stat">
                <b>0 promesse</b>
                <span>jamais de prix ni de délai sans vous</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="comment">
        <div className="container">
          <Reveal>
            <span className="kicker">Comment ça marche</span>
            <h2>Installé en 10 minutes, sans rien changer à vos habitudes</h2>
            <p className="section-sub">
              Pas d&apos;application à faire installer à vos clients, pas de nouveau numéro à communiquer, pas de
              standard téléphonique. Un simple renvoi d&apos;appel.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="steps">
              <div className="step">
                <h3>Activez le renvoi</h3>
                <p>Un code à composer une fois sur votre téléphone (type *61*). Vos appels décrochés ne changent pas.</p>
              </div>
              <div className="step">
                <h3>Un client appelle</h3>
                <p>Vous êtes en vide sanitaire, sur un toit, en rendez-vous. Il reçoit un SMS immédiatement — pas un répondeur.</p>
              </div>
              <div className="step">
                <h3>L&apos;assistant qualifie</h3>
                <p>2-3 questions adaptées : nature du besoin, urgence réelle, commune, créneau de rappel préféré.</p>
              </div>
              <div className="step">
                <h3>Vous rappelez, vous signez</h3>
                <p>La fiche arrive par SMS, triée par urgence, résumée en langage clair. Le client vous attend, vous.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section>
        <div className="container">
          <Reveal>
            <span className="kicker">Pensé pour le BTP</span>
            <h2>Un assistant, pas un robot vendeur</h2>
            <p className="section-sub">
              Décroché prend les informations et prépare votre rappel. Les décisions — prix, délais,
              rendez-vous — restent les vôtres, toujours.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="features">
              <div className="feature">
                <span className="ico" aria-hidden>🚨</span>
                <h3>Détection d&apos;urgence</h3>
                <p>Fuite en cours, panne électrique totale : la fiche arrive marquée URGENT, même la nuit si vous l&apos;autorisez.</p>
              </div>
              <div className="feature">
                <span className="ico" aria-hidden>🗣️</span>
                <h3>Résumé en langage patron</h3>
                <p>« Mme Dupont (69003), fuite sous évier, à rappeler avant 9h » — pas un tableau de données à déchiffrer.</p>
              </div>
              <div className="feature">
                <span className="ico" aria-hidden>🔒</span>
                <h3>Zéro engagement en votre nom</h3>
                <p>Triple verrou technique : l&apos;assistant ne peut pas annoncer un prix, un délai ou une promesse. Jamais.</p>
              </div>
              <div className="feature">
                <span className="ico" aria-hidden>📵</span>
                <h3>Respect des horaires</h3>
                <p>Aucun message proactif la nuit, le dimanche ou les jours fériés. STOP traité immédiatement et définitivement.</p>
              </div>
              <div className="feature">
                <span className="ico" aria-hidden>📱</span>
                <h3>Rien à installer</h3>
                <p>Ni pour vous, ni pour vos clients. Tout passe par SMS et par votre téléphone actuel.</p>
              </div>
              <div className="feature">
                <span className="ico" aria-hidden>🛟</span>
                <h3>Toujours une réponse</h3>
                <p>Même en cas d&apos;incident technique chez nous, vos clients reçoivent un message et vous une notification.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="tarif">
        <div className="container">
          <Reveal>
            <div style={{ textAlign: "center" }}>
              <span className="kicker">Tarifs</span>
              <h2>Un chantier récupéré rembourse l&apos;année</h2>
              <p className="section-sub" style={{ margin: "0 auto" }}>
                Sans engagement, résiliable en un message. Commencez gratuitement, passez au
                payant quand les fiches arrivent.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="plans" style={{ marginTop: 40 }}>
              {PLANS.map((plan) => (
                <div key={plan.id} className={`plan${plan.highlighted ? " plan-highlight" : ""}`}>
                  {plan.highlighted && <div className="plan-badge">Recommandé</div>}
                  <h3>{plan.name}</h3>
                  <div className="price">
                    {plan.priceLabel}
                    <small> {plan.priceSuffix}</small>
                  </div>
                  <ul>
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <a
                    className={`btn ${plan.highlighted ? "btn-primary" : "btn-ghost"}`}
                    style={{ width: "100%", justifyContent: "center" }}
                    href={`/onboarding?plan=${plan.id}`}
                  >
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="faq">
        <div className="container">
          <Reveal>
            <div style={{ textAlign: "center" }}>
              <span className="kicker">Questions fréquentes</span>
              <h2>Les questions qu&apos;on nous pose</h2>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="faq" style={{ marginTop: 36 }}>
              {faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section>
        <div className="container">
          <Reveal>
            <div className="final-cta">
              <h2>
                Le prochain appel manqué peut être
                <br />
                un chantier signé.
              </h2>
              <p className="section-sub" style={{ margin: "0 auto 30px" }}>
                Rejoignez les premiers artisans pilotes — tarif préférentiel à vie pour les 3 premiers.
              </p>
              <a className="btn btn-primary" href="/onboarding?plan=decouverte">
                Devenir client pilote →
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer>
        <div className="container footer-inner">
          <div>
            <strong style={{ color: "var(--text)" }}>Décroché</strong> — l&apos;assistant SMS des artisans du BTP
            <br />© {new Date().getFullYear()} qualifyourlead.com · Données hébergées en Europe
          </div>
          <div>
            Plombiers · Électriciens · Chauffagistes · Maçons · Couvreurs
            <br />
            <a href={CTA_HREF}>pilote@qualifyourlead.com</a>
          </div>
        </div>
      </footer>
    </>
  );
}
