import type { Metadata } from "next";
import { ARTICLES } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Conseils téléphone & clients pour artisans BTP",
  description:
    "Guides pratiques pour artisans du BTP : renvoi d'appel, appels manqués, secrétariat téléphonique, relation client. Sans jargon, sans chiffres inventés.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  return (
    <>
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

      <main className="container" style={{ padding: "72px 20px 96px" }}>
        <span className="kicker">Blog</span>
        <h1 style={{ letterSpacing: "-0.03em", margin: "0 0 12px" }}>
          Le téléphone, côté chantier
        </h1>
        <p className="section-sub">
          Guides pratiques pour ne plus perdre de clients au téléphone quand on travaille de ses
          mains. Écrits pour des artisans, pas pour Google.
        </p>

        <div className="blog-list">
          {ARTICLES.map((a) => (
            <a key={a.slug} className="blog-card" href={`/blog/${a.slug}`}>
              <time dateTime={a.date}>
                {new Date(a.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </time>
              <h3>{a.title}</h3>
              <p>{a.description}</p>
              <span className="read-more">Lire l&apos;article →</span>
            </a>
          ))}
        </div>
      </main>

      <footer>
        <div className="container footer-inner">
          <div>
            <strong style={{ color: "var(--text)" }}>Décroché</strong> — l&apos;assistant SMS des artisans du BTP
            <br />© {new Date().getFullYear()} qualifyourlead.com
          </div>
          <div>
            <a href="/">Accueil</a> · <a href="/onboarding?plan=decouverte">Essai gratuit</a>
          </div>
        </div>
      </footer>
    </>
  );
}
