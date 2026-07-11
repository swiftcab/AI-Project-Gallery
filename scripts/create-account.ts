/**
 * Onboarding "white-glove" des pilotes (cf. docs/tech-debt.md #5) :
 *   npm run account:create -- --company "Plomberie Karim" --trade PLOMBIER \
 *     --owner Karim --mobile +33612345678 --voice +33900000001 --sms +33700000001 \
 *     --departments 69,01 --email karim@example.fr
 *
 * Même logique que POST /api/ops/accounts (src/lib/ops/createAccount.ts) —
 * ce CLI est le point d'entrée humain, l'API le point d'entrée agent (Cowork/Hermes).
 */
import { PrismaClient } from "@prisma/client";
import { createPilotAccount } from "../src/lib/ops/createAccount";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const departments = (arg("departments") ?? "").split(",").filter(Boolean);

  const account = await createPilotAccount(prisma, {
    companyName: arg("company"),
    trade: arg("trade"),
    ownerFirstName: arg("owner"),
    ownerMobile: arg("mobile"),
    voiceNumber: arg("voice"),
    smsNumber: arg("sms"),
    email: arg("email"),
    departments,
  });

  console.log(`Compte créé: ${account.id}`);
  console.log(`→ Renvoi à configurer chez le client: *61*${account.phoneLine?.voiceNumber}# (voir /activation)`);
}

main()
  .catch((e) => {
    if (e?.name === "ZodError") {
      console.error("Arguments requis: --company --trade --owner --mobile --voice --sms --email [--departments 69,01]");
      console.error(e.issues?.map((i: { path: unknown; message: string }) => `  - ${i.path}: ${i.message}`).join("\n"));
    } else {
      console.error(e);
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
