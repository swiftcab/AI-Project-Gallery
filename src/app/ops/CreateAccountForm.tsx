"use client";

import { useState, useTransition } from "react";
import { createAccountAction } from "./actions";

const TRADES = ["PLOMBIER", "ELECTRICIEN", "MACON", "COUVREUR", "CHAUFFAGISTE", "MENUISIER", "PEINTRE", "MULTI", "AUTRE"];

const inputStyle = { display: "block", width: "100%", padding: 8, margin: "4px 0 12px", boxSizing: "border-box" as const };

export default function CreateAccountForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; activationCode?: string } | null>(null);

  return (
    <form
      action={(formData) => {
        setResult(null);
        startTransition(async () => setResult(await createAccountAction(formData)));
      }}
      style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: 16, maxWidth: 480 }}
    >
      <h3 style={{ marginTop: 0 }}>Nouveau compte pilote</h3>
      <label>Entreprise</label>
      <input name="companyName" required style={inputStyle} />
      <label>Métier</label>
      <select name="trade" required style={inputStyle}>
        {TRADES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <label>Prénom du patron</label>
      <input name="ownerFirstName" required style={inputStyle} />
      <label>Mobile du patron (E.164, ex +33612345678)</label>
      <input name="ownerMobile" required style={inputStyle} />
      <label>Numéro voix Décroché (Twilio, E.164)</label>
      <input name="voiceNumber" required style={inputStyle} />
      <label>Numéro SMS Décroché (VMN, E.164)</label>
      <input name="smsNumber" required style={inputStyle} />
      <label>Email</label>
      <input name="email" type="email" required style={inputStyle} />
      <label>Départements (séparés par des virgules)</label>
      <input name="departments" placeholder="69,01" style={inputStyle} />
      <button type="submit" disabled={pending} style={{ padding: "10px 20px", fontWeight: 700 }}>
        {pending ? "Création..." : "Créer le compte"}
      </button>
      {result?.error && <p style={{ color: "#e02020" }}>Erreur : {result.error}</p>}
      {result?.activationCode && (
        <p style={{ color: "#0a7a2f" }}>
          Compte créé. Code de renvoi à donner au client : <code>{result.activationCode}</code>
        </p>
      )}
    </form>
  );
}
