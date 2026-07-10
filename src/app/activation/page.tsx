/**
 * Guide d'activation du renvoi d'appel « si non-réponse » (*61*) par opérateur.
 * Étape 3 du parcours d'onboarding (PRD §3). Codes vérifiés au 07/2026 —
 * à re-vérifier à chaque onboarding pilote (les opérateurs changent rarement ces codes).
 */

const OPERATORS: { name: string; activate: string; note?: string }[] = [
  { name: "Orange / Sosh", activate: "**61*NUMERO*11#", note: "11 = renvoi vocal ; valider avec la touche appel." },
  { name: "SFR / RED", activate: "*61*NUMERO#" },
  { name: "Bouygues / B&You", activate: "*61*NUMERO#" },
  { name: "Free", activate: "*61*NUMERO*20#", note: "20 = délai de sonnerie en secondes (5 à 30)." },
];

export default function ActivationPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui" }}>
      <h1>Activer le renvoi des appels manqués</h1>
      <p>
        Remplacez <code>NUMERO</code> par le numéro Décroché qui vous a été attribué, puis composez
        le code sur votre téléphone comme un appel normal. Vos appels décrochés ne changent pas :
        seul un appel <strong>non répondu</strong> bascule vers Décroché.
      </p>
      {OPERATORS.map((op) => (
        <div key={op.name} style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: 16, margin: "10px 0" }}>
          <strong>{op.name}</strong>
          <p style={{ fontSize: 22, fontFamily: "monospace", margin: "6px 0" }}>{op.activate}</p>
          {op.note && <p style={{ color: "#666", margin: 0 }}>{op.note}</p>}
        </div>
      ))}
      <h2>Vérifier / désactiver</h2>
      <p>
        Vérifier l&apos;état : <code>*#61#</code> — Désactiver : <code>##61#</code>
      </p>
      <h2>Tester (le moment « wow »)</h2>
      <p>
        Depuis un autre téléphone, appelez votre numéro professionnel et ne décrochez pas.
        Vous recevrez le SMS de l&apos;assistant en quelques secondes : répondez-lui comme le ferait
        un client, puis regardez la fiche arriver dans <a href="/leads">vos leads</a>.
      </p>
    </main>
  );
}
