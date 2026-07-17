import { getConfig } from "../config";
import { MessagingError, type MessagingProvider, type OutboundSms, type SendResult } from "./provider";

/**
 * Adapter Twilio (SMS sortant) — API REST Messages, Basic Auth Account
 * SID/Auth Token, aucun SDK ajouté (fetch natif, même pattern que smsmode.ts).
 */
export class TwilioSmsProvider implements MessagingProvider {
  async sendSms(sms: OutboundSms): Promise<SendResult> {
    const cfg = getConfig();
    if (!cfg.TWILIO_ACCOUNT_SID || !cfg.TWILIO_AUTH_TOKEN) {
      throw new MessagingError("TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN manquant");
    }

    const auth = Buffer.from(`${cfg.TWILIO_ACCOUNT_SID}:${cfg.TWILIO_AUTH_TOKEN}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        authorization: `Basic ${auth}`,
      },
      body: new URLSearchParams({ To: sms.to, From: sms.from, Body: sms.body }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new MessagingError(`twilio HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as { sid?: string };
    return { providerId: data.sid ?? `twilio-${Date.now()}` };
  }
}
