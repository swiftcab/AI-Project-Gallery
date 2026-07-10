import { afterEach, describe, expect, it, vi } from "vitest";
import { getConfig, resetConfigForTests } from "@/lib/config";

afterEach(() => {
  vi.unstubAllEnvs();
  resetConfigForTests();
});

describe("config", () => {
  it("parse avec les défauts en dev", () => {
    const cfg = getConfig();
    expect(cfg.DEEPSEEK_MODEL).toBe("deepseek-v4-flash");
    expect(cfg.MESSAGING_PROVIDER).toBe("fake");
  });

  it("refuse le modèle déprécié deepseek-chat", () => {
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-chat");
    resetConfigForTests();
    expect(() => getConfig()).toThrow(/dépréciés/);
  });

  it("exige SESSION_SECRET en production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DASHBOARD_PASS", "x");
    vi.stubEnv("SESSION_SECRET", "");
    resetConfigForTests();
    expect(() => getConfig()).toThrow(/SESSION_SECRET|invalide/);
  });

  it("exige DASHBOARD_PASS en production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "a".repeat(32));
    vi.stubEnv("DASHBOARD_PASS", "");
    resetConfigForTests();
    expect(() => getConfig()).toThrow(/DASHBOARD_PASS/);
  });
});
