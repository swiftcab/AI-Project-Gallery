/**
 * Suite de régression des prompts — appelle le VRAI DeepSeek (budget capé).
 * À lancer manuellement AVANT toute activation d'une nouvelle version de prompt :
 *   DEEPSEEK_API_KEY=... npm run test:prompts
 * Ne tourne PAS en CI (la CI est 100 % déterministe sur FakeLLMProvider).
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import { DeepSeekProvider } from "../../src/lib/llm/deepseek";
import { runAgentTurn } from "../../src/agent/qualifier";
import { checkReply } from "../../src/agent/guardrails";

const caseSchema = z.object({
  name: z.string(),
  history: z.array(z.object({ direction: z.enum(["OUTBOUND", "INBOUND"]), body: z.string() })).default([]),
  inbound: z.string(),
  expect: z
    .object({
      urgency: z.string().optional(),
      postalCode: z.string().optional(),
      replyContains: z.array(z.string()).optional(),
      replyNotContains: z.array(z.string()).optional(),
      stateSuggestion: z.array(z.string()).optional(),
    })
    .default({}),
});

const MAX_CASES = Number(process.env.PROMPT_TEST_MAX_CASES ?? 30);

const context = {
  companyName: "Plomberie Karim",
  ownerFirstName: "Karim",
  trade: "PLOMBIER",
  departments: ["69"],
};

async function main() {
  const dir = path.join(process.cwd(), "prompts", "regression", "cases");
  const files = readdirSync(dir).filter((f) => f.endsWith(".yaml")).sort().slice(0, MAX_CASES);
  const llm = new DeepSeekProvider();
  const version = process.env.PROMPT_QUALIFIER_VERSION ?? "v1";

  let failed = 0;
  for (const file of files) {
    const c = caseSchema.parse(parse(readFileSync(path.join(dir, file), "utf8")));
    const errors: string[] = [];
    try {
      const res = await runAgentTurn(llm, {
        conversationId: `regression-${file}`,
        state: "QUALIFYING",
        turnCount: c.history.length,
        promptVersion: version,
        context,
        history: c.history,
        inbound: c.inbound,
      });

      // Invariants universels : guardrails + longueur SMS
      const violations = checkReply(res.reply);
      if (violations.length) errors.push(`guardrail: ${violations.map((v) => `${v.rule}(${v.match})`).join(", ")}`);
      if (res.reply.length > 480) errors.push(`reply trop longue (${res.reply.length})`);
      if (!res.output) errors.push("sortie JSON invalide (fallback utilisé)");

      // Assertions du cas
      const e = c.expect;
      if (e.urgency && res.output?.extracted.urgency !== e.urgency)
        errors.push(`urgency=${res.output?.extracted.urgency} attendu=${e.urgency}`);
      if (e.postalCode && res.output?.extracted.postalCode !== e.postalCode)
        errors.push(`postalCode=${res.output?.extracted.postalCode} attendu=${e.postalCode}`);
      for (const s of e.replyContains ?? [])
        if (!res.reply.toLowerCase().includes(s.toLowerCase())) errors.push(`reply ne contient pas "${s}"`);
      for (const s of e.replyNotContains ?? [])
        if (res.reply.toLowerCase().includes(s.toLowerCase())) errors.push(`reply contient "${s}" (interdit)`);
      if (e.stateSuggestion && res.output && !e.stateSuggestion.includes(res.output.stateSuggestion))
        errors.push(`state=${res.output.stateSuggestion} attendu∈${e.stateSuggestion}`);

      if (errors.length) {
        failed++;
        console.error(`✗ ${c.name} [${file}]\n    reply: ${res.reply}\n    ${errors.join("\n    ")}`);
      } else {
        console.log(`✓ ${c.name}`);
      }
    } catch (err) {
      failed++;
      console.error(`✗ ${c.name} [${file}] — exception: ${String(err)}`);
    }
  }

  console.log(`\n${files.length - failed}/${files.length} cas OK (prompt qualifier/${version})`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
