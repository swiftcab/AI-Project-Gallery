import { PrismaClient, Trade } from "@prisma/client";
import { z } from "zod";
import { enqueue } from "@/queues";
import { logger } from "@/lib/logger";

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

const signupInput = z.object({
  companyName: z.string().min(1).max(120),
  trade: z.nativeEnum(Trade),
  ownerFirstName: z.string().min(1).max(60),
  ownerMobile: z
    .string()
    .regex(/^\+?[0-9\s]{6,20}$/, "numéro invalide"),
  email: z.string().email(),
  departments: z
    .array(z.string().regex(/^\d{2,3}$/))
    .max(20)
    .default([]),
  plan: z.string().default("decouverte"),
});

export type SignupInput = z.infer<typeof signupInput>;

/**
 * Onboarding self-serve (formulaire /onboarding) — PAS de numéro voix/SMS
 * à la création : leur provisioning reste manuel (tech-debt.md #2, aucune
 * intégration Twilio/smsmode automatisée). Le compte existe en TRIAL dès
 * la création ; l'équipe complète le PhoneLine au moment de l'activation
 * téléphonique avec le client (docs/deployment-runbook.md §10).
 * Idempotent sur l'email : un second essai avec le même email retourne le
 * compte existant plutôt que de planter (évite un double-submit accidentel).
 */
export async function createSignupAccount(prisma: PrismaClient, raw: unknown) {
  const input = signupInput.parse(raw);

  const existingUser = await prisma.user.findUnique({ where: { email: input.email }, include: { account: true } });
  if (existingUser) return { account: existingUser.account, created: false as const };

  const account = await prisma.account.create({
    data: {
      companyName: input.companyName,
      trade: input.trade,
      ownerFirstName: input.ownerFirstName,
      ownerMobile: input.ownerMobile,
      departments: input.departments,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      users: { create: { email: input.email } },
    },
  });

  // Best-effort : un Redis indisponible ne doit jamais faire échouer
  // l'inscription elle-même (CLAUDE.md §4 — l'envoi passe par la queue,
  // jamais en synchrone ici).
  try {
    await enqueue("sendEmail", {
      to: input.email,
      template: "welcome",
      vars: { companyName: input.companyName, ownerFirstName: input.ownerFirstName },
    });
  } catch (err) {
    logger.warn({ accountId: account.id, err: String(err) }, "onboarding.welcome_email_enqueue_failed");
  }

  return { account, created: true as const };
}

export { signupInput };
