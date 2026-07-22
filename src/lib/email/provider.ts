export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
}

export interface SendResult {
  providerId: string;
}

/**
 * Abstraction email : même principe que MessagingProvider (src/lib/messaging) —
 * un seul point d'envoi, un adapter par fournisseur, zéro changement ailleurs
 * en cas de swap.
 */
export interface EmailProvider {
  sendEmail(email: OutboundEmail): Promise<SendResult>;
}

export class EmailError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "EmailError";
  }
}
