#!/usr/bin/env node
/**
 * MCP Server for Décroché — exposes ops tools to Claude Code.
 *
 * Usage (in Claude Code config ~/.claude/claude_desktop_config.json):
 * {
 *   "mcpServers": {
 *     "decroche": {
 *       "command": "node",
 *       "args": ["/path/to/decroche/mcp/server.js"],
 *       "env": { "OPS_API_TOKEN": "votre_token_ops", "DECROCHE_API": "https://qualifyourlead.com" }
 *     }
 *   }
 * }
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API = process.env.DECROCHE_API || "https://qualifyourlead.com";
const TOKEN = process.env.OPS_API_TOKEN || "";

async function apiCall(method, path, body = null) {
  const opts = {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  return res.json();
}

const tools = {
  decroche_status: {
    description: "Vérifie la santé de Décroché : comptes actifs, leads qualifiés, incidents guardrails (24h)",
    handler: async () => apiCall("GET", "/api/ops/status"),
  },
  decroche_create_account: {
    description: "Crée un compte pilote Décroché (artisan BTP). Retourne les identifiants dashboard.",
    inputSchema: {
      type: "object",
      properties: {
        companyName: { type: "string", description: "Nom de l'entreprise" },
        trade: { type: "string", enum: ["PLOMBIER","ELECTRICIEN","MACON","COUVREUR","CHAUFFAGISTE","MENUISIER","PEINTRE","MULTI","AUTRE"] },
        ownerFirstName: { type: "string", description: "Prénom du patron" },
        ownerMobile: { type: "string", description: "Mobile du patron (E.164, ex: +33612345678)" },
        email: { type: "string", description: "Email de connexion dashboard" },
        departments: { type: "array", items: { type: "string" }, description: "Départements (ex: ['69','01'])" },
        voiceNumber: { type: "string", description: "Numéro virtuel voix (Twilio 09)" },
        smsNumber: { type: "string", description: "Numéro VMN SMS" },
      },
      required: ["companyName","trade","ownerFirstName","ownerMobile","email","departments","voiceNumber","smsNumber"],
    },
    handler: async (args) => apiCall("POST", "/api/ops/accounts", args),
  },
};

const server = new Server(
  { name: "decroche-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema || {} })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools[request.params.name];
  if (!tool) throw new Error(`Outil inconnu: ${request.params.name}`);
  const result = await tool.handler(request.params.arguments || {});
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
