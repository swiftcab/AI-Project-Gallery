import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, getArticle } from "@/lib/blog";

/**
 * Rendu d'un article : les segments **gras** des contenus sont convertis en
 * <strong> (seule mise en forme autorisée dans src/lib/blog.ts — pas de HTML
 * arbitraire, le contenu est du texte statique versionné, jamais du contenu
 * utilisateur).
 */
function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
    </>
  );
}

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      publishedTime: article.date,
      url: `https://qualifyourlead.com/blog/${article.slug}`,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    inLanguage: "fr-FR",
    author: { "@type": "Organization", name: "Décroché", url: "https://qualifyourlead.com" },
    publisher: { "@type": "Organization", name: "Décroché", url: "https://qualifyourlead.com" },
    mainEntityOfPage: `https://qualifyourlead.com/blog/${article.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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

      <article className="article">
        <a href="/blog" style={{ color: "var(--muted)", fontSize: "0.88rem", textDecoration: "none" }}>
          ← Tous les articles
        </a>
        <h1>{article.title}</h1>
        <p className="article-meta">
          Publié le{" "}
          <time dateTime={article.date}>
            {new Date(article.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </time>{" "}
          · Équipe Décroché
        </p>

        {article.sections.map((s, i) => (
          <section key={i} style={{ padding: 0 }}>
            {s.h2 && <h2>{s.h2}</h2>}
            {s.p?.map((text, j) => (
              <p key={j}>
                <Rich text={text} />
              </p>
            ))}
            {s.ul && (
              <ul>
                {s.ul.map((item, j) => (
                  <li key={j}>
                    <Rich text={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="article-cta">
          <p>
            <strong>Décroché répond par SMS à vos appels manqués</strong>, qualifie la demande et vous
            envoie une fiche prête pour le rappel. Installation en 10 minutes, vous gardez votre numéro.
          </p>
          <a className="btn btn-primary" href="/onboarding?plan=decouverte">
            Essai gratuit 14 jours →
          </a>
        </div>
      </article>

      <footer>
        <div className="container footer-inner">
          <div>
            <strong style={{ color: "var(--text)" }}>Décroché</strong> — l&apos;assistant SMS des artisans du BTP
            <br />© {new Date().getFullYear()} qualifyourlead.com
          </div>
          <div>
            <a href="/">Accueil</a> · <a href="/blog">Blog</a> · <a href="/onboarding?plan=decouverte">Essai gratuit</a>
          </div>
        </div>
      </footer>
    </>
  );
}
