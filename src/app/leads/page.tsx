import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Dashboard pilotes : leads triés urgence puis récence, avec le résumé patron.
 * Volontairement minimal (le patron vit dans ses SMS) — cf. PRD §3/§8.
 */
export default async function LeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      conversations: {
        orderBy: { startedAt: "desc" },
        take: 1,
        include: { qualification: true, messages: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  const rank = { HIGH: 0, NORMAL: 1, LOW: 2, UNKNOWN: 3 } as const;
  leads.sort(
    (a, b) =>
      (rank[a.conversations[0]?.qualification?.urgency ?? "UNKNOWN"] ?? 3) -
      (rank[b.conversations[0]?.qualification?.urgency ?? "UNKNOWN"] ?? 3),
  );

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui" }}>
      <h1>Leads ({leads.length})</h1>
      {leads.length === 0 && <p>Aucun lead pour le moment. Testez en appelant votre numéro sans décrocher.</p>}
      {leads.map((lead) => {
        const conv = lead.conversations[0];
        const q = conv?.qualification;
        const urgent = q?.urgency === "HIGH";
        return (
          <div
            key={lead.id}
            style={{
              background: "#fff",
              border: `1px solid ${urgent ? "#e02020" : "#e5e5e5"}`,
              borderRadius: 10,
              padding: 16,
              margin: "12px 0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <strong>
                {urgent ? "🔴 URGENT — " : ""}
                {lead.firstName ?? "Prospect"} · {lead.phone}
              </strong>
              <span style={{ color: "#666" }}>
                {conv?.state ?? "—"} · {new Date(lead.createdAt).toLocaleString("fr-FR")}
              </span>
            </div>
            {q && <p style={{ margin: "8px 0 4px" }}>{q.ownerSummary}</p>}
            {q?.callbackWindow && (
              <p style={{ margin: 0, color: "#444" }}>Rappel souhaité : {q.callbackWindow}</p>
            )}
            {conv && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: "pointer", color: "#0f62fe" }}>
                  Conversation ({conv.messages.length} messages)
                </summary>
                {conv.messages.map((m) => (
                  <p key={m.id} style={{ margin: "6px 0", color: m.direction === "OUTBOUND" ? "#0f62fe" : "#1a1a1a" }}>
                    <em>{m.direction === "OUTBOUND" ? "Agent" : "Client"} :</em> {m.body}
                  </p>
                ))}
              </details>
            )}
          </div>
        );
      })}
    </main>
  );
}
