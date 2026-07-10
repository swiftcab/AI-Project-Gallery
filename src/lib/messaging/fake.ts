import type { MessagingProvider, OutboundSms, SendResult } from "./provider";

/** Provider de test : capture les SMS au lieu de les envoyer. */
export class FakeMessagingProvider implements MessagingProvider {
  public readonly sent: OutboundSms[] = [];
  public failNext = false;

  async sendSms(sms: OutboundSms): Promise<SendResult> {
    if (this.failNext) {
      this.failNext = false;
      throw new Error("FakeMessagingProvider: échec simulé");
    }
    this.sent.push(sms);
    return { providerId: `fake-${this.sent.length}` };
  }
}
