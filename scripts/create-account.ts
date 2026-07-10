/**
 * Onboarding "white-glove" des pilotes (cf. docs/tech-debt.md #5) :
 *   npm run account:create -- --company "Plomberie Karim" --trade PLOMBIER \
 *     --owner Karim --mobile +33612345678 --voice +33900000001 --sms +33700000001 \
 *     --departments 69,01 --email karim@example.fr
 */
import { PrismaClient, Trade } from "@prisma/client";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const company = arg("company");
  const trade = arg("trade") as Trade | undefined;
  const owner = arg("owner");
  const mobile = arg("mobile");
  const voice = arg("voice");
  const sms = arg("sms");
  const email = arg("email");
  const departments = (arg("departments") ?? "").split(",").filter(Boolean);

  if (!company || !trade || !owner || !mobile || !voice || !sms || !email) {
    console.error("Arguments requis: --company --trade --owner --mobile --voice --sms --email [--departments 69,01]");
    process.exit(1);
  }
  if (!Object.values(Trade).includes(trade)) {
    console.error(`Trade invalide. Valeurs: ${Object.values(Trade).join(", ")}`);
    process.exit(1);
  }

  const account = await prisma.account.create({
    data: {
      companyName: company,
      trade,
      ownerFirstName: owner,
      ownerMobile: mobile,
      departments,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      users: { create: { email } },
      phoneLine: { create: { voiceNumber: voice, smsNumber: sms } },
    },
  });
  console.log(`Compte créé: ${account.id}`);
  console.log(`→ Renvoi à configurer chez le client: *61*${voice}# (voir /activation)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
