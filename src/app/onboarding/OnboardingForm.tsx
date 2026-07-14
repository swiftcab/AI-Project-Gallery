"use client";

import { useState, type FormEvent } from "react";

const TRADES: { value: string; label: string }[] = [
  { value: "PLOMBIER", label: "Plomberie" },
  { value: "ELECTRICIEN", label: "Électricité" },
  { value: "CHAUFFAGISTE", label: "Chauffage" },
  { value: "MACON", label: "Maçonnerie" },
  { value: "COUVREUR", label: "Couverture / toiture" },
  { value: "MENUISIER", label: "Menuiserie" },
  { value: "PEINTRE", label: "Peinture" },
  { value: "MULTI", label: "Tous corps d'état" },
  { value: "AUTRE", label: "Autre" },
];

const input: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  margin: "6px 0 18px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--card-border)",
  borderRadius: 10,
  color: "var(--text)",
  fontSize: "0.95rem",
};

export default function OnboardingForm({ plan }: { plan: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const departments = String(form.get("departments") ?? "")
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName: form.get("companyName"),
          trade: form.get("trade"),
          ownerFirstName: form.get("ownerFirstName"),
          ownerMobile: form.get("ownerMobile"),
          email: form.get("email"),
          departments,
          plan,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { redirectUrl?: string; error?: string };
      if (res.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setError("Une erreur est survenue. Réessayez ou écrivez-nous à pilote@qualifyourlead.com.");
    } catch {
      setError("Connexion impossible. Réessayez dans un instant.");
    }
    setPending(false);
  };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 480, margin: "0 auto" }}>
      <label>Nom de votre entreprise</label>
      <input style={input} name="companyName" required maxLength={120} placeholder="Ex. Plomberie Martin" />

      <label>Votre métier principal</label>
      <select style={input} name="trade" required defaultValue="">
        <option value="" disabled>
          Choisissez…
        </option>
        {TRADES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <label>Votre prénom</label>
      <input style={input} name="ownerFirstName" required maxLength={60} placeholder="Ex. Karim" />

      <label>Votre mobile</label>
      <input style={input} name="ownerMobile" type="tel" required placeholder="06 12 34 56 78" />

      <label>Votre email</label>
      <input style={input} name="email" type="email" required placeholder="vous@exemple.fr" />

      <label>Départements où vous intervenez (séparés par des virgules)</label>
      <input style={input} name="departments" placeholder="69, 01, 42" />

      {error && (
        <p style={{ color: "#ff8a8a", fontSize: "0.9rem", marginTop: -8 }}>{error}</p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", cursor: "pointer", border: "none" }}>
        {pending ? "Création en cours…" : plan === "decouverte" ? "Créer mon compte gratuit" : "Continuer vers le paiement"}
      </button>
      <p style={{ color: "var(--muted)", fontSize: "0.82rem", textAlign: "center", marginTop: 14 }}>
        Aucune carte bancaire requise pour l&apos;essai. Nous vous appelons pour finaliser
        l&apos;activation de votre ligne.
      </p>
    </form>
  );
}
