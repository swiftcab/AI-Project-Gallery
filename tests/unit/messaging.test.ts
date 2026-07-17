import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("TwilioSmsProvider", () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    process.env.MESSAGING_PROVIDER = "twilio";
    process.env.TWILIO_ACCOUNT_SID = "ACxxxx";
    process.env.TWILIO_AUTH_TOKEN = "secret";
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("envoie un SMS via l'API REST Twilio (Basic Auth, form-urlencoded)", async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe("https://api.twilio.com/2010-04-01/Accounts/ACxxxx/Messages.json");
      expect(init.headers).toMatchObject({ authorization: expect.stringContaining("Basic ") });
      expect((init.body as URLSearchParams).toString()).toContain("Body=Bonjour");
      return new Response(JSON.stringify({ sid: "SMxxxx" }), { status: 201 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { resetConfigForTests } = await import("@/lib/config");
    resetConfigForTests();
    const { TwilioSmsProvider } = await import("@/lib/messaging/twilio");
    const result = await new TwilioSmsProvider().sendSms({ to: "+33612345678", from: "+33900000001", body: "Bonjour" });

    expect(result.providerId).toBe("SMxxxx");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("lève MessagingError si Twilio répond une erreur HTTP", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("invalid From number", { status: 400 })));

    const { resetConfigForTests } = await import("@/lib/config");
    resetConfigForTests();
    const { TwilioSmsProvider } = await import("@/lib/messaging/twilio");
    const { MessagingError } = await import("@/lib/messaging/provider");

    await expect(new TwilioSmsProvider().sendSms({ to: "+33612345678", from: "+33900000001", body: "Bonjour" })).rejects.toThrow(
      MessagingError,
    );
  });

  it("lève une erreur explicite si les identifiants Twilio manquent", async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;

    const { resetConfigForTests } = await import("@/lib/config");
    resetConfigForTests();
    const { TwilioSmsProvider } = await import("@/lib/messaging/twilio");

    await expect(new TwilioSmsProvider().sendSms({ to: "+33612345678", from: "+33900000001", body: "x" })).rejects.toThrow(
      /TWILIO_ACCOUNT_SID/,
    );
  });

  it("getMessaging() route vers TwilioSmsProvider quand MESSAGING_PROVIDER=twilio", async () => {
    const { resetConfigForTests } = await import("@/lib/config");
    resetConfigForTests();
    const { getMessaging } = await import("@/lib/messaging");
    const { TwilioSmsProvider } = await import("@/lib/messaging/twilio");
    expect(getMessaging()).toBeInstanceOf(TwilioSmsProvider);
  });
});
