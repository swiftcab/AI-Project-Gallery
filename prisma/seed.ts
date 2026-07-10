/**
 * Seed de démo : un compte artisan + un lead qualifié fictif,
 * pour voir le dashboard rempli et faire des démos sans vrai trafic.
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const account = await prisma.account.upsert({
    where: { id: "demo-account" },
    update: {},
    create: {
      id: "demo-account",
      companyName: "Plomberie Karim (démo)",
      trade: "PLOMBIER",
      ownerFirstName: "Karim",
      ownerMobile: "+33600000000",
      departments: ["69", "01"],
      trialEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      users: { create: { email: "demo@decroche.fr" } },
      phoneLine: {
        create: { voiceNumber: "+33900000099", smsNumber: "+33700000099", carrier: "Orange" },
      },
    },
  });

  const lead = await prisma.lead.upsert({
    where: { accountId_phone: { accountId: account.id, phone: "+33611223344" } },
    update: {},
    create: {
      accountId: account.id,
      phone: "+33611223344",
      firstName: "Sophie",
      status: "QUALIFIED",
    },
  });

  const existing = await prisma.conversation.findFirst({ where: { leadId: lead.id } });
  if (!existing) {
    const conv = await prisma.conversation.create({
      data: {
        leadId: lead.id,
        state: "DONE",
        promptVersion: "qualifier/v1",
        turnCount: 3,
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        messages: {
          create: [
            { direction: "OUTBOUND", body: "Bonjour, ici l'assistant de Plomberie Karim (plomberie)…" },
            { direction: "INBOUND", body: "J'ai une fuite sous l'évier, c'est urgent. Sophie, 69003." },
            { direction: "OUTBOUND", body: "Merci Sophie. Quel créneau vous arrange pour être rappelée ?" },
            { direction: "INBOUND", body: "Avant 9h demain si possible" },
            { direction: "OUTBOUND", body: "C'est noté : fuite sous l'évier (69003), rappel demain avant 9h. Karim vous rappelle." },
          ],
        },
      },
    });
    await prisma.qualification.create({
      data: {
        conversationId: conv.id,
        tradeNeeded: "PLOMBIER",
        urgency: "HIGH",
        postalCode: "69003",
        description: "fuite sous évier cuisine, en cours",
        ownerSummary: "URGENT — Sophie (69003) : fuite sous évier cuisine en cours. Rappel souhaité demain avant 9h.",
        callbackWindow: "demain avant 9h",
        inScopeGeo: true,
        raw: {},
      },
    });
  }

  console.log("Seed OK — compte démo:", account.companyName);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
