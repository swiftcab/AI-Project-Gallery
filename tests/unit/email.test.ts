import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("BrevoProvider", () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    process.env.EMAIL_PROVIDER = "brevo";
    process.env.BREVO_API_KEY = "test-brevo-key";
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
    vi.unstubAllGlobals();
  });

  it("envoie un email via l'API REST Brevo", async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe("https://api.brevo.com/v3/smtp/email");
      expect(init.headers).toMatchObject({ "api-key": "test-brevo-key" });
      const body = JSON.parse(init.body as string);
      expect(body.to).toEqual([{ email: "karim@example.fr" }]);
      expect(body.subject).toBe("Bienvenue");
      return new Response(JSON.stringify({ messageId: "brevo-123" }), { status: 201 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { resetConfigForTests } = await import("@/lib/config");
    resetConfigForTests();
    const { BrevoProvider } = await import("@/lib/email/brevo");
    const result = await new BrevoProvider().sendEmail({ to: "karim@example.fr", subject: "Bienvenue", html: "<p>Salut</p>" });

    expect(result.providerId).toBe("brevo-123");
  });

  it("lève EmailError si Brevo répond une erreur HTTP", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("invalid sender", { status: 400 })));
    const { resetConfigForTests } = await import("@/lib/config");
    resetConfigForTests();
    const { BrevoProvider } = await import("@/lib/email/brevo");
    const { EmailError } = await import("@/lib/email/provider");

    await expect(new BrevoProvider().sendEmail({ to: "x@example.fr", subject: "s", html: "h" })).rejects.toThrow(EmailError);
  });

  it("lève une erreur explicite si BREVO_API_KEY manque", async () => {
    delete process.env.BREVO_API_KEY;
    const { resetConfigForTests } = await import("@/lib/config");
    resetConfigForTests();
    const { BrevoProvider } = await import("@/lib/email/brevo");

    await expect(new BrevoProvider().sendEmail({ to: "x@example.fr", subject: "s", html: "h" })).rejects.toThrow(/BREVO_API_KEY/);
  });

  it("getEmail() route vers BrevoProvider quand EMAIL_PROVIDER=brevo", async () => {
    const { resetConfigForTests } = await import("@/lib/config");
    resetConfigForTests();
    const { getEmail } = await import("@/lib/email");
    const { BrevoProvider } = await import("@/lib/email/brevo");
    expect(getEmail()).toBeInstanceOf(BrevoProvider);
  });
});

describe("templates", () => {
  it("welcomeEmailHtml inclut le prénom et le nom d'entreprise, jamais de prix/délai", async () => {
    const { welcomeEmailHtml } = await import("@/lib/email/templates");
    const { subject, html } = welcomeEmailHtml({ companyName: "Plomberie Karim", ownerFirstName: "Karim" });
    expect(subject).toContain("Karim");
    expect(html).toContain("Plomberie Karim");
    expect(html).not.toMatch(/\d+\s*€/);
  });
});
