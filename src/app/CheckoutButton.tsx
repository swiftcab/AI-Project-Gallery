"use client";

import { useState } from "react";

const FALLBACK_MAILTO =
  "mailto:pilote@qualifyourlead.com?subject=Je%20veux%20m%27abonner%20%C3%A0%20D%C3%A9croch%C3%A9";

/**
 * Bouton d'achat : crée la session Stripe Checkout puis redirige.
 * Si le paiement en ligne n'est pas (encore) configuré côté serveur (503),
 * on retombe sur le contact direct — jamais d'erreur brute pour le prospect.
 */
export default function CheckoutButton({ plan, label, primary }: { plan: string; label: string; primary?: boolean }) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      /* réseau — on retombe sur le mailto */
    }
    window.location.href = FALLBACK_MAILTO;
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`btn ${primary ? "btn-primary" : "btn-ghost"}`}
      style={{ width: "100%", justifyContent: "center", cursor: "pointer", border: primary ? "none" : undefined }}
    >
      {loading ? "Redirection…" : label}
    </button>
  );
}
