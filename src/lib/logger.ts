import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { app: "decroche" },
  redact: ["*.body", "*.phone", "*.callerPhone"], // pas de PII en clair dans les logs agrégés
});

/** Toujours logguer un événement de conversation avec son correlationId. */
export function convLogger(conversationId: string) {
  return logger.child({ conversationId });
}
