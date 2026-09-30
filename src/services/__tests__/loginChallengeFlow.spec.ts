import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { handleInitialLoginResponse } from "@/services/loginFlow";
import type { UserAuth } from "@/interfaces/User/User.auth";

const http = vi.fn();
const setAuth = vi.fn((token: string) => sessionStorage.setItem("token", token));

vi.mock("@/helper", () => ({
  helperStore: () => ({ http }),
  getUserAuth: () => ({ roles: [{ name: "User" }] }),
}));
vi.mock("@/stores/UserStore", () => ({
  UserStore: () => ({
    setAuth,
    defaultAuthenticatedRoute: () => "user-home",
  }),
}));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("login challenge flow", () => {
  beforeEach(() => {
    vi.useRealTimers();
    setActivePinia(createPinia());
    localStorage.clear();
    sessionStorage.clear();
    http.mockReset();
    setAuth.mockClear();
  });

  it("stores the token immediately only for users without 2FA", () => {
    const complete = vi.fn(({ token }) => sessionStorage.setItem("token", token));
    const challengeStore = { beginLoginChallenge: vi.fn() };

    expect(
      handleInitialLoginResponse(
        { token: "normal-token", user: { id: 1 } as UserAuth },
        challengeStore,
        complete,
      ),
    ).toBe("authenticated");
    expect(sessionStorage.getItem("token")).toBe("normal-token");
    expect(challengeStore.beginLoginChallenge).not.toHaveBeenCalled();
  });

  it("keeps token empty after first factor and stores challenge only in memory", async () => {
    const { TwoFactorAuthStore } = await import("@/stores/TwoFactorAuthStore");
    const store = TwoFactorAuthStore();
    const complete = vi.fn();

    expect(
      handleInitialLoginResponse(
        {
          two_factor_required: true,
          challenge_token: "challenge-123",
          expires_in: 300,
        },
        store,
        complete,
      ),
    ).toBe("challenge");
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("challenge_token")).toBeNull();
    expect(store.loginChallengeToken).toBe("challenge-123");
    expect(complete).not.toHaveBeenCalled();
  });

  it("rejects an unexpected response without storing authentication", () => {
    const challengeStore = { beginLoginChallenge: vi.fn() };
    const complete = vi.fn();

    expect(() =>
      handleInitialLoginResponse({}, challengeStore, complete),
    ).toThrow("Invalid login response");
    expect(complete).not.toHaveBeenCalled();
    expect(challengeStore.beginLoginChallenge).not.toHaveBeenCalled();
  });

  it("confirmation sends only challenge and code, then stores token and clears challenge", async () => {
    const { TwoFactorAuthStore } = await import("@/stores/TwoFactorAuthStore");
    const store = TwoFactorAuthStore();
    store.beginLoginChallenge("challenge-456");
    store.code = "123456";
    store.form = { email: "private@example.test", password: "never-send" };
    http.mockResolvedValue({ data: { token: "2fa-token", user: { id: 2 } } });

    await store.ejectFunction();

    expect(http).toHaveBeenCalledWith("login/f2a", "post", {
      data: { challenge_token: "challenge-456", code: "123456" },
    });
    expect(sessionStorage.getItem("token")).toBe("2fa-token");
    expect(store.loginChallengeToken).toBeNull();
  });

  it("clears an unsubmitted challenge when its server lifetime elapses", async () => {
    vi.useFakeTimers();
    const { TwoFactorAuthStore } = await import("@/stores/TwoFactorAuthStore");
    const store = TwoFactorAuthStore();
    store.beginLoginChallenge("short-lived", 1);

    vi.advanceTimersByTime(1000);

    expect(store.loginChallengeToken).toBeNull();
    expect(store.modal).toBe(false);
    vi.useRealTimers();
  });
});
