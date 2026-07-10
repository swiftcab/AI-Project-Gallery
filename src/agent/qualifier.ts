import { convLogger } from "@/lib/logger";
import type { LLMProvider } from "@/lib/llm/provider";
import { agentTurnOutputSchema, type AgentTurnOutput } from "./schema";
import { checkReply, SAFE_FALLBACK_REPLY, type GuardrailViolation } from "./guardrails";
import { renderSystemPrompt, type PromptContext } from "./prompts";
import { resolveNextState, type ConversationState } from "./stateMachine";

export interface HistoryItem {
  direction: "OUTBOUND" | "INBOUND";
  body: string;
}

export interface AgentTurnInput {
  conversationId: string;
  state: ConversationState;
  turnCount: number;
  promptVersion: string;
  context: PromptContext;
  history: HistoryItem[];
  inbound: string;
}

export interface AgentTurnResult {
  reply: string;
  output: AgentTurnOutput | null; // null = fallback total
  nextState: ConversationState;
  guardrailBlocked: GuardrailViolation[];
  llmRaw: string | null;
}

function historyAsMessages(history: HistoryItem[]) {
  return history.map((h) => ({
    role: h.direction === "OUTBOUND" ? ("assistant" as const) : ("user" as const),
    content: h.body,
  }));
}

/**
 * Un tour d'agent : LLM → JSON validé → guardrails → état suivant.
 * Politique d'erreur : 1 retry JSON invalide, 1 retry guardrail,
 * puis réponse de repli sûre (le prospect ne reste JAMAIS sans réponse).
 */
export async function runAgentTurn(llm: LLMProvider, input: AgentTurnInput): Promise<AgentTurnResult> {
  const log = convLogger(input.conversationId);
  const system = renderSystemPrompt("qualifier", input.promptVersion, input.context);

  const baseMessages = [
    { role: "system" as const, content: system },
    ...historyAsMessages(input.history),
    { role: "user" as const, content: input.inbound },
  ];

  let raw: string | null = null;
  let parsed: AgentTurnOutput | null = null;
  const blocked: GuardrailViolation[] = [];

  // Tentative 1 + retry JSON
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    const messages =
      attempt === 0
        ? baseMessages
        : [
            ...baseMessages,
            { role: "assistant" as const, content: raw ?? "" },
            {
              role: "user" as const,
              content:
                "SYSTEM: ta dernière réponse n'était pas un JSON valide conforme au schéma. Réponds UNIQUEMENT avec le JSON demandé.",
            },
          ];
    try {
      const res = await llm.chatJSON({ messages });
      raw = res.content;
      const candidate = agentTurnOutputSchema.safeParse(JSON.parse(res.content));
      if (candidate.success) parsed = candidate.data;
      else log.warn({ attempt, issues: candidate.error.issues.slice(0, 3) }, "agent.json_invalid");
    } catch (err) {
      log.warn({ attempt, err: String(err) }, "agent.llm_error");
    }
  }

  if (!parsed) {
    return {
      reply: SAFE_FALLBACK_REPLY,
      output: null,
      nextState: resolveNextState({ current: input.state, suggestion: "CONFIRMING", turnCount: input.turnCount + 1 }),
      guardrailBlocked: blocked,
      llmRaw: raw,
    };
  }

  // Guardrails sur la réponse candidate + 1 retry de reformulation
  let violations = checkReply(parsed.reply);
  if (violations.length > 0) {
    blocked.push(...violations);
    log.warn({ violations }, "agent.guardrail_blocked");
    try {
      const res = await llm.chatJSON({
        messages: [
          ...baseMessages,
          { role: "assistant" as const, content: raw ?? "" },
          {
            role: "user" as const,
            content:
              `SYSTEM: ta réponse violait les règles (${violations.map((v) => v.rule).join(", ")}). ` +
              `Reformule SANS mentionner de prix, de délai d'intervention ni d'engagement. Même schéma JSON.`,
          },
        ],
      });
      const candidate = agentTurnOutputSchema.safeParse(JSON.parse(res.content));
      if (candidate.success) {
        violations = checkReply(candidate.data.reply);
        if (violations.length === 0) {
          parsed = { ...candidate.data, extracted: { ...parsed.extracted, ...candidate.data.extracted } };
          raw = res.content;
        } else {
          blocked.push(...violations);
        }
      }
    } catch (err) {
      log.warn({ err: String(err) }, "agent.guardrail_retry_failed");
    }
  }

  const finalViolations = checkReply(parsed.reply);
  const reply = finalViolations.length === 0 ? parsed.reply : SAFE_FALLBACK_REPLY;

  return {
    reply,
    output: parsed,
    nextState: resolveNextState({
      current: input.state,
      suggestion: parsed.stateSuggestion,
      turnCount: input.turnCount + 1,
    }),
    guardrailBlocked: blocked,
    llmRaw: raw,
  };
}

/** Résumé "langage patron" — LLM avec repli déterministe. */
export function fallbackOwnerSummary(opts: {
  phone: string;
  extracted: AgentTurnOutput["extracted"] | null;
}): string {
  const e = opts.extracted;
  if (!e || !e.description) {
    return `Appel manqué de ${opts.phone} — pas d'infos obtenues par SMS, à rappeler.`;
  }
  const bits = [
    e.firstName ? `${e.firstName}` : null,
    e.postalCode ? `(${e.postalCode})` : null,
    `: ${e.description}`,
    e.urgency === "HIGH" ? "⚠️ URGENT" : null,
    e.callbackWindow ? `Rappel souhaité : ${e.callbackWindow}` : null,
  ].filter(Boolean);
  return bits.join(" ");
}
