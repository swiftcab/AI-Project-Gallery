import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(16).default("dev-only-secret-not-for-prod"),

  DATABASE_URL: z.string().min(1).default("postgresql://decroche:decroche@localhost:5432/decroche"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),

  DEEPSEEK_API_KEY: z.string().default(""),
  // deepseek-chat est déprécié (24/07/2026) : refusé à la validation.
  DEEPSEEK_MODEL: z
    .string()
    .default("deepseek-v4-flash")
    .refine((m) => m !== "deepseek-chat" && m !== "deepseek-reasoner", {
      message: "deepseek-chat/deepseek-reasoner sont dépréciés, utiliser deepseek-v4-flash",
    }),
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  PROMPT_QUALIFIER_VERSION: z.string().default("v1"),

  MESSAGING_PROVIDER: z.enum(["fake", "smsmode", "twilio"]).default("fake"),
  SMSMODE_API_KEY: z.string().default(""),
  TWILIO_ACCOUNT_SID: z.string().default(""),
  TWILIO_AUTH_TOKEN: z.string().default(""),

  DASHBOARD_USER: z.string().default("admin"),
  DASHBOARD_PASS: z.string().default(""),
});

export type AppConfig = z.infer<typeof envSchema>;

let cached: AppConfig | null = null;

/** Parse process.env une fois ; crash explicite au boot si invalide. */
export function getConfig(): AppConfig {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Configuration invalide: ${parsed.error.message}`);
    }
    cached = parsed.data;
    if (cached.NODE_ENV === "production") {
      if (cached.SESSION_SECRET === "dev-only-secret-not-for-prod") {
        throw new Error("SESSION_SECRET doit être défini en production");
      }
      if (!cached.DASHBOARD_PASS) {
        throw new Error("DASHBOARD_PASS doit être défini en production");
      }
    }
  }
  return cached;
}

/** Réservé aux tests : force un re-parse après modification de process.env. */
export function resetConfigForTests(): void {
  cached = null;
}
