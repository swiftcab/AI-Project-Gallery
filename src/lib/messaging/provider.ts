export interface OutboundSms {
  to: string; // E.164
  from: string; // VMN du compte
  body: string;
}

export interface SendResult {
  providerId: string;
}

/**
 * Abstraction messagerie : un seul point d'envoi de SMS dans tout le produit.
 * L'opt-out est vérifié AVANT d'arriver ici (gateway) ET rappelé ici par
 * contrat : l'appelant doit passer optedOut=false vérifié en base.
 */
export interface MessagingProvider {
  sendSms(sms: OutboundSms): Promise<SendResult>;
}

export class MessagingError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "MessagingError";
  }
}
