import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Turnstile = {
  render: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

const setTurnstile = (turnstile: Turnstile | undefined) => {
  Object.defineProperty(globalThis, "turnstile", {
    configurable: true,
    value: turnstile,
  });
};

const service = async () => {
  vi.resetModules();
  return import("./turnstile");
};

describe("Turnstile de registro", () => {
  beforeEach(() => {
    document.head.querySelectorAll('[data-xeler-turnstile]').forEach((script) => script.remove());
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "public-test-site-key");
    setTurnstile(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    setTurnstile(undefined);
  });

  it("renderiza el widget y entrega el token al registro", async () => {
    const turnstile: Turnstile = {
      render: vi.fn((_container, options) => {
        options.callback("synthetic-turnstile-token");
        return "widget-registration";
      }),
      reset: vi.fn(),
      remove: vi.fn(),
    };
    setTurnstile(turnstile);
    const onToken = vi.fn();
    const onInvalid = vi.fn();

    await expect((await service()).renderRegistrationTurnstile(document.createElement("div"), onToken, onInvalid))
      .resolves.toBe("widget-registration");
    expect(onToken).toHaveBeenCalledWith("synthetic-turnstile-token");
    expect(turnstile.render).toHaveBeenCalledWith(expect.any(HTMLDivElement), expect.objectContaining({
      sitekey: "public-test-site-key",
      callback: onToken,
    }));
  });

  it("carga el script oficial y falla de forma cerrada cuando no queda disponible", async () => {
    const promise = (await service()).renderRegistrationTurnstile(document.createElement("div"), vi.fn(), vi.fn());
    const script = document.head.querySelector<HTMLScriptElement>('[data-xeler-turnstile="registration"]');

    expect(script?.src).toContain("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit");
    script?.dispatchEvent(new Event("error"));
    await expect(promise).rejects.toThrow("TURNSTILE_UNAVAILABLE");
  });

  it("rechaza la inicialización si falta la site key pública", async () => {
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "");

    await expect((await service()).renderRegistrationTurnstile(document.createElement("div"), vi.fn(), vi.fn()))
      .rejects.toThrow("TURNSTILE_UNAVAILABLE");
  });
});
