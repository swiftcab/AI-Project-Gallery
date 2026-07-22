import { getConfig } from "../config";
import { BrevoProvider } from "./brevo";
import { FakeEmailProvider } from "./fake";
import type { EmailProvider } from "./provider";

let instance: EmailProvider | null = null;

export function getEmail(): EmailProvider {
  if (!instance) {
    const provider = getConfig().EMAIL_PROVIDER;
    instance = provider === "brevo" ? new BrevoProvider() : new FakeEmailProvider();
  }
  return instance;
}

export function setEmailForTests(provider: EmailProvider | null): void {
  instance = provider;
}
