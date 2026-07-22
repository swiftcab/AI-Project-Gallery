/**
 * Templates email — texte en dur ici (pas de prompt LLM impliqué, donc pas
 * concerné par la règle "prompts versionnés" de CLAUDE.md §3, qui ne vise
 * que les prompts envoyés au LLM).
 */

export type EmailTemplateName = "welcome";

export interface WelcomeEmailVars {
  companyName: string;
  ownerFirstName: string;
}

export function welcomeEmailHtml(vars: WelcomeEmailVars): { subject: string; html: string } {
  const subject = `Bienvenue sur Décroché, ${vars.ownerFirstName} !`;
  const html = `
    <div style="font-family: sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto;">
      <h1 style="font-size: 22px;">Bienvenue, ${vars.ownerFirstName} 👋</h1>
      <p>Le compte de <strong>${vars.companyName}</strong> est créé sur Décroché.</p>
      <p>
        Dernière étape, et c'est nous qui nous en occupons : nous vous appelons
        sous quelques heures ouvrées pour attribuer votre numéro Décroché et
        activer le renvoi d'appel avec vous — moins de 10 minutes au téléphone.
      </p>
      <p>Une question tout de suite ? <a href="mailto:pilote@qualifyourlead.com">pilote@qualifyourlead.com</a></p>
      <p style="color: #666; font-size: 13px;">— L'équipe Décroché</p>
    </div>
  `;
  return { subject, html };
}

export function renderTemplate(name: EmailTemplateName, vars: WelcomeEmailVars): { subject: string; html: string } {
  switch (name) {
    case "welcome":
      return welcomeEmailHtml(vars);
  }
}
