import type { Metadata } from "next";
import OnboardingForm from "./OnboardingForm";
import { getPlan, PLANS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Créer votre compte — Décroché",
  robots: { index: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planParam } = await searchParams;
  const plan = getPlan(planParam ?? "") ?? PLANS[0];

  return (
    <main className="container" style={{ padding: "64px 20px 96px", maxWidth: 640 }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <span className="kicker">Étape 1 sur 2</span>
        <h1 style={{ fontSize: "1.9rem" }}>Créons votre compte Décroché</h1>
        <p style={{ color: "var(--muted)" }}>
          Plan sélectionné : <strong style={{ color: "var(--text)" }}>{plan.name}</strong> ({plan.priceLabel}
          {plan.priceSuffix ? ` ${plan.priceSuffix}` : ""}).{" "}
          <a href="/#tarif" style={{ color: "var(--amber)" }}>
            Changer de plan
          </a>
        </p>
      </div>
      <OnboardingForm plan={plan.id} />
    </main>
  );
}
