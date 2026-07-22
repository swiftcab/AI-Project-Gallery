import type { EmailProvider, OutboundEmail, SendResult } from "./provider";

/** Provider de test : capture les emails au lieu de les envoyer. */
export class FakeEmailProvider implements EmailProvider {
  public readonly sent: OutboundEmail[] = [];
  public failNext = false;

  async sendEmail(email: OutboundEmail): Promise<SendResult> {
    if (this.failNext) {
      this.failNext = false;
      throw new Error("FakeEmailProvider: échec simulé");
    }
    this.sent.push(email);
    return { providerId: `fake-${this.sent.length}` };
  }
}
