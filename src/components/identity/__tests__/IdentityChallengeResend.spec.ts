import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import IdentityChallengeResend from "@/components/identity/IdentityChallengeResend.vue";
import { IdentityChallengeStore } from "@/stores/IdentityChallengeStore";

const mountResend = (onResend: () => Promise<void>) =>
  mount(IdentityChallengeResend, {
    props: { onResend },
    global: {
      stubs: {
        VBtn: {
          props: ["disabled", "loading"],
          emits: ["click"],
          template:
            '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  });

describe("IdentityChallengeResend", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T12:00:00Z"));
    setActivePinia(createPinia());
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down, blocks early resend and replaces the reference", async () => {
    const store = IdentityChallengeStore();
    store.begin({
      challenge_reference: "first",
      expires_in: 30,
      resend_available_in: 2,
      delivery_status: "pending",
    });
    const onResend = vi.fn(async () => {
      store.begin({
        challenge_reference: "second",
        expires_in: 30,
        resend_available_in: 2,
        delivery_status: "pending",
      });
    });
    const wrapper = mountResend(onResend);

    expect(wrapper.text()).toContain("Reenviar en 2 s");
    await wrapper.get("button").trigger("click");
    expect(onResend).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2000);
    await wrapper.get("button").trigger("click");
    expect(onResend).toHaveBeenCalledOnce();
    expect(store.reference).toBe("second");

    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps cooldown independent after OTP expiration and never enables resend early", async () => {
    const store = IdentityChallengeStore();
    store.begin({
      challenge_reference: "short-lived",
      expires_in: 1,
      resend_available_in: 3,
      delivery_status: "pending",
    });
    const onResend = vi.fn(async () => {
      store.begin({
        challenge_reference: "replacement",
        expires_in: 10,
        resend_available_in: 3,
        delivery_status: "pending",
      });
    });
    const wrapper = mountResend(onResend);

    await vi.advanceTimersByTimeAsync(1000);

    expect(store.isExpired).toBe(true);
    expect(store.reference).toBe("short-lived");
    expect(store.canResend).toBe(false);
    expect(wrapper.text()).toContain("El codigo expiro");
    expect(wrapper.text()).toContain("Reenviar en 2 s");
    expect(wrapper.get("button").attributes("disabled")).toBeDefined();

    await wrapper.get("button").trigger("click");
    expect(onResend).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2000);

    expect(store.canResend).toBe(true);
    expect(wrapper.get("button").attributes("disabled")).toBeUndefined();
    await wrapper.get("button").trigger("click");
    expect(onResend).toHaveBeenCalledOnce();
    expect(store.reference).toBe("replacement");

    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("restores password-reset email and both independent deadlines after reload", async () => {
    const store = IdentityChallengeStore();
    store.begin(
      {
        challenge_reference: "persisted",
        purpose: "password_reset",
        channel: "email",
        expires_in: 1,
        resend_available_in: 4,
        delivery_status: "pending",
      },
      true,
      "User@Example.Test",
    );

    await vi.advanceTimersByTimeAsync(1500);

    setActivePinia(createPinia());
    const restored = IdentityChallengeStore();
    const email = restored.restorePasswordReset();
    const wrapper = mountResend(vi.fn(async () => undefined));

    expect(email).toBe("user@example.test");
    expect(restored.passwordResetEmail).toBe("user@example.test");
    expect(restored.reference).toBe("persisted");
    expect(restored.isExpired).toBe(true);
    expect(restored.canResend).toBe(false);
    expect(wrapper.text()).toContain("Reenviar en 3 s");

    await vi.advanceTimersByTimeAsync(3000);
    expect(restored.canResend).toBe(true);

    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports a disabled channel without claiming delivery", () => {
    const store = IdentityChallengeStore();
    store.begin({
      challenge_reference: "disabled-channel",
      expires_in: 30,
      resend_available_in: 60,
      delivery_status: "disabled",
    });
    const wrapper = mountResend(vi.fn(async () => undefined));

    expect(wrapper.text()).toContain(
      "El canal no esta disponible temporalmente.",
    );
    expect(wrapper.text()).not.toContain("codigo fue enviado");

    wrapper.unmount();
  });
});
