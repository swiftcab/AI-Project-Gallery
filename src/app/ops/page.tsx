import { prisma } from "@/lib/db";
import CreateAccountForm from "./CreateAccountForm";

export const dynamic = "force-dynamic";

/**
 * Interface d'exploitation humaine (Basic Auth via middleware).
 * Même logique produit que /api/ops/* (agents Cowork/Hermes, Bearer token) —
 * cf. docs/automation.md pour l'architecture complète des deux interfaces.
 */
export default async function OpsPage() {
  const since24h = new Date(Date.now() - 24 * 3600 * 1000);
  const [accounts, leadsToday, qualifiedToday, guardrailBlocks24h] = await Promise.all([
    prisma.account.findMany({ include: { phoneLine: true }, orderBy: { createdAt: "desc" } }),
    prisma.lead.count({ where: { createdAt: { gte: since24h } } }),
    prisma.lead.count({ where: { createdAt: { gte: since24h }, status: "QUALIFIED" } }),
    prisma.auditEvent.count({ where: { kind: "guardrail.blocked", createdAt: { gte: since24h } } }),
  ]);

  const stat = { display: "inline-block", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: "12px 20px", marginRight: 12 } as const;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui" }}>
      <h1>Ops — Décroché</h1>

      <div style={{ marginBottom: 24 }}>
        <div style={stat}><strong>{accounts.length}</strong><br />comptes</div>
        <div style={stat}><strong>{leadsToday}</strong><br />leads (24h)</div>
        <div style={stat}><strong>{qualifiedToday}</strong><br />qualifiés (24h)</div>
        <div style={stat}><strong>{guardrailBlocks24h}</strong><br />guardrails bloqués (24h)</div>
      </div>

      <p style={{ color: "#666" }}>
        API agent (Cowork/Hermes) : <code>GET /api/ops/status</code> ·{" "}
        <code>POST /api/ops/accounts</code> — Bearer <code>OPS_API_TOKEN</code>. Détails :{" "}
        <a href="https://github.com/swiftcab/AI-Project-Gallery/blob/claude/construction-ai-sales-agent-felxyp/docs/automation.md">
          docs/automation.md
        </a>
        .
      </p>

      <CreateAccountForm />

      <h2 style={{ marginTop: 32 }}>Comptes</h2>
      {accounts.map((a) => (
        <div key={a.id} style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: 12, margin: "8px 0" }}>
          <strong>{a.companyName}</strong> ({a.trade}) — {a.planStatus}
          <br />
          <span style={{ color: "#666" }}>
            Voix: {a.phoneLine?.voiceNumber ?? "—"} · SMS: {a.phoneLine?.smsNumber ?? "—"} · Renvoi vérifié:{" "}
            {a.phoneLine?.forwardVerifiedAt ? "✓" : "non"}
          </span>
        </div>
      ))}
    </main>
  );
}
