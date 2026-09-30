import { createPinia, setActivePinia } from "pinia";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderRegistrationTurnstile } from "@/services/turnstile";
import { IdentityChallengeStore } from "@/stores/IdentityChallengeStore";

const source = (path: string) =>
  readFileSync(resolve(process.cwd(), "src", path), "utf8");

describe("identity registration, verification and recovery flows", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionStorage.clear();
    vi.unstubAllEnvs();
    delete (globalThis as typeof globalThis & { turnstile?: unknown }).turnstile;
  });

  it("fails safely when Turnstile has no configured site key", async () => {
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "");
    await expect(renderRegistrationTurnstile(document.createElement("div"), vi.fn(), vi.fn())).rejects.toThrow(
      "TURNSTILE_UNAVAILABLE",
    );
  });

  it("tracks challenge reference, disabled channel and cooldown without creating password-reset storage", () => {
    const store = IdentityChallengeStore();
    store.begin(
      {
        challenge_reference: "challenge-one",
        purpose: "phone_verification",
        channel: "sms",
        expires_in: 600,
        resend_available_in: 60,
        delivery_status: "disabled",
        masked_destination: "***4567",
      },
      true,
    );

    expect(store.reference).toBe("challenge-one");
    expect(store.deliveryStatus).toBe("disabled");
    expect(store.canResend).toBe(false);

    const passwordResetState = sessionStorage.getItem(
      "identity.password-reset.challenge",
    );
    expect(passwordResetState).toBeNull();
  });

  it("keeps expiration and resend cooldown independent until explicit cleanup", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T12:00:00Z"));
    const store = IdentityChallengeStore();
    store.begin({
      challenge_reference: "second",
      expires_in: 1,
      resend_available_in: 3,
      delivery_status: "pending",
    });
    expect(store.reference).toBe("second");

    const stopClock = store.startClock();
    vi.advanceTimersByTime(1000);

    expect(store.reference).toBe("second");
    expect(store.isExpired).toBe(true);
    expect(store.canResend).toBe(false);

    vi.advanceTimersByTime(2000);
    expect(store.canResend).toBe(true);

    store.clear();
    expect(store.reference).toBeNull();
    stopClock();
    vi.useRealTimers();
  });

  it("persists only password-reset context required to resume the resend cooldown", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T12:00:00Z"));
    const store = IdentityChallengeStore();
    store.begin(
      {
        challenge_reference: "persisted-reset",
        purpose: "password_reset",
        channel: "email",
        expires_in: 8,
        resend_available_in: 60,
        delivery_status: "pending",
      },
      true,
      "USER@example.test",
    );

    const serialized = sessionStorage.getItem(
      "identity.password-reset.challenge",
    );
    expect(serialized).toContain("user@example.test");
    expect(serialized).not.toContain("123456");
    expect(serialized).not.toContain("password");

    setActivePinia(createPinia());
    const restored = IdentityChallengeStore();
    expect(restored.restorePasswordReset()).toBe("user@example.test");
    expect(restored.reference).toBe("persisted-reset");
    expect(restored.canResend).toBe(false);
    vi.useRealTimers();
  });

  it("submits challenge references for email and phone and supports SMS or WhatsApp", () => {
    const phone = source(
      "views/user/Profile/ValidationPhone/ValidationPhone.vue",
    );
    const email = source(
      "views/user/Profile/ValidationEmail/ValidationEmail.vue",
    );
    const adminPhone = source(
      "views/admin/profile/ValidationPhone/ValidationPhone.vue",
    );
    expect(phone).toContain('value: "sms"');
    expect(phone).toContain('value: "whatsapp"');
    expect(phone).toContain("challenge_reference: challenges.reference");
    expect(phone).toContain("challenges.deliveryStatus !== 'disabled'");
    expect(email).toContain("challenge_reference: challenges.reference");
    expect(email).toContain("verification/email/verify");
    expect(adminPhone).toContain("challenge_reference: challenges.reference");
  });

  it("uses generic recovery contract, confirmation and clears secrets after success", () => {
    const recovery = source("views/auth/RecoverPassword.vue");
    expect(recovery).toContain("send/reset/password/code");
    expect(recovery).toContain("challenge_reference: challenges.reference");
    expect(recovery).toContain("password_confirmation");
    expect(recovery).toContain('form.password = ""');
    expect(recovery).toContain("challenges.clear()");
  });

  it("registration delegates Turnstile and resets its sensitive form", () => {
    const register = source("views/auth/Register.vue");
    expect(register).toContain("renderRegistrationTurnstile");
    expect(register).toContain('"cf-turnstile-response"');
    expect(register).toContain("registerStore.reset()");
    expect(register).toContain(
      'toast.error("No fue posible validar reCAPTCHA.")',
    );
    expect(register).toContain("No fue posible completar el registro.");
  });

  it("keeps phone verification mandatory through the single router authority", () => {
    const middleware = source("router/middleware.ts");
    const envExample = readFileSync(
      resolve(process.cwd(), ".env.example"),
      "utf8",
    );

    expect(envExample).toContain(
      "VITE_IDENTITY_PHONE_VERIFICATION_REQUIRED=true",
    );
    expect(middleware).toContain(
      'import.meta.env.VITE_IDENTITY_PHONE_VERIFICATION_REQUIRED ?? "true"',
    );
    expect(middleware).toContain("phoneVerificationRequired");
  });
});
