import { getConfig } from "../config";
import { FakeMessagingProvider } from "./fake";
import type { MessagingProvider } from "./provider";
import { SmsmodeProvider } from "./smsmode";

let instance: MessagingProvider | null = null;

export function getMessaging(): MessagingProvider {
  if (!instance) {
    const provider = getConfig().MESSAGING_PROVIDER;
    if (provider === "smsmode") instance = new SmsmodeProvider();
    else if (provider === "twilio") {
      // Adapter volontairement absent au MVP (cf. docs/tech-debt.md #3)
      throw new Error("Adapter twilio SMS non implémenté — utiliser smsmode ou fake");
    } else instance = new FakeMessagingProvider();
  }
  return instance;
}

export function setMessagingForTests(provider: MessagingProvider | null): void {
  instance = provider;
}
