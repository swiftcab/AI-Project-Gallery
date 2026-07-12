"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Apparition au scroll (IntersectionObserver) avec double filet de sécurité :
 * un <noscript> CSS global (layout.tsx) couvre le cas sans JS, et un timeout
 * ici garantit qu'aucun contenu ne reste invisible plus de 2s après montage
 * (hydratation lente, outil de capture automatisé type aperçu de lien
 * Slack/Twitter, timing d'observer qui rate le premier cycle...). Passé ce
 * délai, un élément pas encore scrollé jusqu'à l'écran est de toute façon
 * hors-champ : le rendre visible par anticipation ne se voit pas — seul le
 * petit effet de fondu est perdu, jamais le contenu lui-même.
 */
export default function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      el.classList.add("visible");
    };

    if (!("IntersectionObserver" in window)) {
      reveal();
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal();
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
    );
    obs.observe(el);

    const safety = setTimeout(reveal, 2000);

    return () => {
      obs.disconnect();
      clearTimeout(safety);
    };
  }, []);

  return (
    <div ref={ref} className="reveal" style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
