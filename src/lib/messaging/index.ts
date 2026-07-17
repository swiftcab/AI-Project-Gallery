import { getConfig } from "../config";
import { FakeMessagingProvider } from "./fake";
import type { MessagingProvider } from "./provider";
import { SmsmodeProvider } from "./smsmode";
import { TwilioSmsProvider } from "./twilio";

let instance: MessagingProvider | null = null;

export function getMessaging(): MessagingProvider {
  if (!instance) {
    const provider = getConfig().MESSAGING_PROVIDER;
    if (provider === "smsmode") instance = new SmsmodeProvider();
    else if (provider === "twilio") instance = new TwilioSmsProvider();
    else instance = new FakeMessagingProvider();
  }
  return instance;
}

export function setMessagingForTests(provider: MessagingProvider | null): void {
  instance = provider;
}
