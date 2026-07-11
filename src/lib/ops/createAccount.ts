import { PrismaClient, Trade } from "@prisma/client";
import { z } from "zod";

const createAccountInput = z.object({
  companyName: z.string().min(1),
  trade: z.nativeEnum(Trade),
  ownerFirstName: z.string().min(1),
  ownerMobile: z.string().min(6),
  voiceNumber: z.string().min(6),
  smsNumber: z.string().min(6),
  email: z.string().email(),
  departments: z.array(z.string()).default([]),
});

export type CreateAccountInput = z.infer<typeof createAccountInput>;

/**
 * Logique d'onboarding partagée entre le CLI (scripts/create-account.ts) et
 * l'API ops (src/app/api/ops/accounts/route.ts) — une seule implémentation,
 * deux points d'entrée (humain via terminal, agent via HTTP).
 */
export async function createPilotAccount(prisma: PrismaClient, raw: unknown) {
  const input = createAccountInput.parse(raw);
  return prisma.account.create({
    data: {
      companyName: input.companyName,
      trade: input.trade,
      ownerFirstName: input.ownerFirstName,
      ownerMobile: input.ownerMobile,
      departments: input.departments,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      users: { create: { email: input.email } },
      phoneLine: { create: { voiceNumber: input.voiceNumber, smsNumber: input.smsNumber } },
    },
    include: { phoneLine: true },
  });
}

export { createAccountInput };
