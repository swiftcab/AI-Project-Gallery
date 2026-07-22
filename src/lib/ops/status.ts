import { prisma } from "@/lib/db";

/**
 * Statut opérationnel agrégé — extrait de /api/ops/status pour être
 * réutilisé par la commande /status du bot Telegram admin (une seule
 * implémentation, deux points d'entrée, même principe que createAccount.ts).
 */
export async function getOpsStatus() {
  const since24h = new Date(Date.now() - 24 * 3600 * 1000);
  const [accounts, leadsToday, qualifiedToday, guardrailBlocks24h, urgentOpen] = await Promise.all([
    prisma.account.count(),
    prisma.lead.count({ where: { createdAt: { gte: since24h } } }),
    prisma.lead.count({ where: { createdAt: { gte: since24h }, status: "QUALIFIED" } }),
    prisma.auditEvent.count({ where: { kind: "guardrail.blocked", createdAt: { gte: since24h } } }),
    prisma.qualification.count({
      where: { urgency: "HIGH", conversation: { state: { in: ["DONE", "CONFIRMING"] } } },
    }),
  ]);

  return {
    status: "ok" as const,
    timestamp: new Date().toISOString(),
    accounts,
    last24h: { leads: leadsToday, qualified: qualifiedToday, guardrailBlocks: guardrailBlocks24h },
    urgentOpen,
  };
}

/** Les N derniers leads qualifiés, plus récents en premier — pour /leads. */
export async function getRecentQualifiedLeads(limit: number) {
  return prisma.lead.findMany({
    where: { status: "QUALIFIED" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      conversations: {
        orderBy: { startedAt: "desc" },
        take: 1,
        include: { qualification: true },
      },
    },
  });
}
