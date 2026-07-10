import { getConfig } from "../config";
import { MessagingError, type MessagingProvider, type OutboundSms, type SendResult } from "./provider";

/**
 * Adapter smsmode (agrégateur FR, VMN conversationnel).
 * ⚠️ Endpoint/payload à VALIDER au spike J1 avec un vrai compte —
 * cf. docs/tech-debt.md #3. Le contrat MessagingProvider, lui, est stable.
 */
export class SmsmodeProvider implements MessagingProvider {
  async sendSms(sms: OutboundSms): Promise<SendResult> {
    const cfg = getConfig();
    if (!cfg.SMSMODE_API_KEY) throw new MessagingError("SMSMODE_API_KEY manquant");

    const res = await fetch("https://rest.smsmode.com/sms/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Api-Key": cfg.SMSMODE_API_KEY,
      },
      body: JSON.stringify({
        recipient: { to: sms.to },
        from: sms.from,
        body: { text: sms.body },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new MessagingError(`smsmode HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as { messageId?: string; id?: string };
    return { providerId: data.messageId ?? data.id ?? `smsmode-${Date.now()}` };
  }
}
