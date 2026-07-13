import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Décroché — Chaque appel est une opportunité",
  description:
    "L'agent IA qui qualifie vos appels manqués par SMS. Ne perdez plus jamais un client parce que vous étiez sur un chantier.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Décroché
          </span>
          <div className="flex gap-6 items-center">
            <a href="#features" className="text-gray-400 hover:text-white text-sm transition">Fonctionnalités</a>
            <a href="#pricing" className="text-gray-400 hover:text-white text-sm transition">Tarifs</a>
            <Link
              href="/onboarding"
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-5 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-cyan-300 text-sm">Disponible immédiatement — Essai 14 jours gratuit</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold leading-tight mb-6">
            {"Ne perdez plus un seul"}
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              appel client
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Sur un chantier, les mains dans le cambouis. Le téléphone vibre dans la poche. 
            C&apos;est un client. Vous le ratez. Avec Décroché, l&apos;IA répond par SMS, 
            qualifie le besoin, et vous livre une fiche prête à rappeler.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/onboarding"
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105 shadow-lg shadow-cyan-500/25"
            >
              🚀 Essayer gratuitement
            </Link>
            <a
              href="#demo"
              className="border border-white/10 hover:border-white/30 px-8 py-4 rounded-full text-lg transition-all"
            >
              ▶ Voir la démo
            </a>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
            <span>⚡ Activation en 5 min</span>
            <span>🔒 Données chiffrées</span>
            <span>🇫🇷 Hébergé en France</span>
          </div>
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            ["3", "sec pour répondre"],
            ["21x", "plus de leads qualifiés"],
            ["0", "coût fixe par appel"],
            ["100%", "des SMS lus en 3 min"],
          ].map(([stat, label]) => (
            <div key={stat}>
              <div className="text-3xl font-bold text-cyan-400">{stat}</div>
              <div className="text-gray-500 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Comment ça marche
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Vous ratez un appel",
                desc: "Le client vous appelle pendant que vous travaillez. Le renvoi d'appel active Décroché automatiquement.",
                color: "from-cyan-500 to-blue-500",
              },
              {
                step: "02",
                title: "L'IA qualifie par SMS",
                desc: "Le prospect reçoit un SMS immédiat. L'IA pose les bonnes questions : urgence, localisation, description.",
                color: "from-blue-500 to-purple-500",
              },
              {
                step: "03",
                title: "Vous recevez une fiche prête",
                desc: "Sur votre téléphone : nom, besoin, urgence. Vous rappelez en connaissance de cause. La vente est déjà à moitié faite.",
                color: "from-purple-500 to-pink-500",
              },
            ].map(({ step, title, desc, color }) => (
              <div
                key={step}
                className="relative p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition group"
              >
                <div
                  className={`text-5xl font-black bg-gradient-to-br ${color} bg-clip-text text-transparent mb-4`}
                >
                  {step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            Un prix qui tient la route
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Pas de frais cachés. Pas d'engagement. Vous ne payez que quand Décroché vous apporte des leads.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/5">
              <h3 className="text-lg font-semibold mb-2">Découverte</h3>
              <div className="text-3xl font-bold mb-6">
                Gratuit
                <span className="text-base font-normal text-gray-500">/14 jours</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-400 mb-8">
                <li>✅ 1 numéro dédié</li>
                <li>✅ 30 leads qualifiés</li>
                <li>✅ Dashboard leads</li>
                <li>✅ Notifications SMS</li>
              </ul>
              <Link
                href="/onboarding"
                className="block text-center border border-white/10 hover:border-white/30 px-6 py-3 rounded-full transition"
              >
                Essayer
              </Link>
            </div>

            {/* Pro — recommandé */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 relative scale-105">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                RECOMMANDÉ
              </div>
              <h3 className="text-lg font-semibold mb-2">Pro</h3>
              <div className="text-3xl font-bold mb-6">
                79 €
                <span className="text-base font-normal text-gray-500">/mois</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-400 mb-8">
                <li>✅ Tout le Starter</li>
                <li>✅ Appels illimités</li>
                <li>✅ Qualification IA</li>
                <li>✅ Résumé langage patron</li>
                <li>✅ Export CSV</li>
                <li>✅ Priorité support</li>
              </ul>
              <Link
                href="/onboarding"
                className="block text-center bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-full font-semibold transition-all hover:scale-105 shadow-lg shadow-cyan-500/25"
              >
                Je démarre
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/5">
              <h3 className="text-lg font-semibold mb-2">Artisan+</h3>
              <div className="text-3xl font-bold mb-6">
                149 €
                <span className="text-base font-normal text-gray-500">/mois</span>
              </div>
              <ul className="space-y-3 text-sm text-gray-400 mb-8">
                <li>✅ Tout le Pro</li>
                <li>✅ Multi-comptes (3)</li>
                <li>✅ SMS personnalisés</li>
                <li>✅ Rapports hebdo</li>
                <li>✅ Onboarding prioritaire</li>
              </ul>
              <Link
                href="/onboarding"
                className="block text-center border border-white/10 hover:border-white/30 px-6 py-3 rounded-full transition"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">
            Prêt à ne plus jamais rater un client ?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            14 jours gratuits. Sans CB. Activation en 5 minutes.
          </p>
          <Link
            href="/onboarding"
            className="inline-block bg-cyan-500 hover:bg-cyan-400 text-black px-10 py-5 rounded-full text-xl font-bold transition-all hover:scale-105 shadow-lg shadow-cyan-500/25"
          >
            🚀 Créer mon compte Décroché
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-gray-600">
        Décroché © 2026 — Agent IA de qualification pour artisans BTP
      </footer>
    </main>
  );
}
