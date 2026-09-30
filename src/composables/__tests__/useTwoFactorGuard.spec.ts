import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  code: "",
  newFlow: false,
  callback: { fn: vi.fn() as () => unknown },
  modal: false,
  requestedScope: "finance.order_admin",
}));

vi.mock("@/stores/TwoFactorAuthStore", () => ({
  TwoFactorAuthStore: () => state,
}));

import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

describe("useTwoFactorGuard", () => {
  beforeEach(() => {
    localStorage.clear();
    state.code = "stale";
    state.newFlow = false;
    state.callback = { fn: vi.fn() };
    state.modal = false;
  });

  it("opens password confirmation and defers the sensitive action when 2FA is disabled", async () => {
    const action = vi.fn();
    const guard = useTwoFactorGuard();

    await guard.runWithTwoFactor(action, "finance.xcop");

    expect(guard.hasTwoFactorEnabled()).toBe(false);
    expect(state.code).toBe("");
    expect(state.newFlow).toBe(true);
    expect(state.modal).toBe(true);
    expect(state.requestedScope).toBe("finance.xcop");
    expect(action).not.toHaveBeenCalled();

    await state.callback.fn();
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("uses the same deferred guard when 2FA is enabled", async () => {
    localStorage.setItem("2fa", "1");
    const action = vi.fn();
    const guard = useTwoFactorGuard();

    await guard.runWithTwoFactor(action, "finance.crypto_payout");

    expect(guard.hasTwoFactorEnabled()).toBe(true);
    expect(state.modal).toBe(true);
    expect(state.requestedScope).toBe("finance.crypto_payout");
    expect(action).not.toHaveBeenCalled();
  });
});
