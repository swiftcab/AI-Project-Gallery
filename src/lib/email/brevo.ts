import { getConfig } from "../config";
import { EmailError, type EmailProvider, type OutboundEmail, type SendResult } from "./provider";

/**
 * Adapter Brevo (email transactionnel) — API REST, même pattern que les
 * autres adapters du projet (smsmode.ts, twilio.ts) : fetch natif, pas de SDK.
 */
export class BrevoProvider implements EmailProvider {
  async sendEmail(email: OutboundEmail): Promise<SendResult> {
    const cfg = getConfig();
    if (!cfg.BREVO_API_KEY) throw new EmailError("BREVO_API_KEY manquant");

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "api-key": cfg.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: cfg.BREVO_SENDER_EMAIL, name: "Décroché" },
        to: [{ email: email.to }],
        subject: email.subject,
        htmlContent: email.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new EmailError(`Brevo HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as { messageId?: string };
    return { providerId: data.messageId ?? `brevo-${Date.now()}` };
  }
}
