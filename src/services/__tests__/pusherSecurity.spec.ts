import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAuthToken, setAuthToken } from "@/services/authToken";

const bind = vi.fn();
const subscribe = vi.fn(() => ({ bind, unbind: vi.fn() }));
type PusherOptions = {
  channelAuthorization: {
    endpoint: string;
    headersProvider: () => Record<string, string>;
  };
};
const PusherClient = vi.fn(function (_key: string, _options: PusherOptions) {
  void _key;
  void _options;
  return { subscribe, unsubscribe: vi.fn(), disconnect: vi.fn() };
});

vi.mock("pusher-js", () => ({ default: PusherClient }));

describe("Pusher private auth endpoint boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    setAuthToken("private-pusher-token");
    vi.stubEnv("VITE_API_URL", "https://api.xeler.test/api");
    vi.stubEnv("VITE_PUSHER_APP_KEY", "public-browser-key");
    vi.stubEnv("VITE_PUSHER_CLUSTER", "us2");
    vi.stubEnv("VITE_BROADCAST_AUTH_URL", "");
  });

  it("derives the official auth endpoint and sends bearer only there", async () => {
    const { default: usePusher } = await import("@/pusher");
    new usePusher("private-notification.42", "event", vi.fn());

    const options = PusherClient.mock.calls[0]?.[1];
    expect(options).toBeDefined();
    if (!options) throw new Error("Expected Pusher to be initialized.");
    expect(localStorage.getItem("token")).toBeNull();
    expect(options.channelAuthorization.endpoint).toBe(
      "https://api.xeler.test/api/pusher/auth",
    );
    expect(options.channelAuthorization.headersProvider().Authorization).toBe(
      "Bearer private-pusher-token",
    );
  });

  it("reads the current session token for every authorization attempt", async () => {
    const { default: usePusher } = await import("@/pusher");
    new usePusher("private-notification.42", "event", vi.fn());
    const provider =
      PusherClient.mock.calls[0]?.[1].channelAuthorization.headersProvider;

    expect(provider()).toEqual({
      Authorization: "Bearer private-pusher-token",
    });
    setAuthToken("reconnected-token");
    expect(provider()).toEqual({ Authorization: "Bearer reconnected-token" });
  });

  it("does not invent authorization when the session token is absent", async () => {
    clearAuthToken();
    const { default: usePusher } = await import("@/pusher");
    new usePusher("private-notification.42", "event", vi.fn());

    const provider =
      PusherClient.mock.calls[0]?.[1].channelAuthorization.headersProvider;
    expect(provider()).toEqual({});
  });

  it.each([
    ["VITE_PUSHER_APP_KEY", ""],
    ["VITE_PUSHER_CLUSTER", ""],
  ])("does not initialize Pusher when %s is missing", async (name, value) => {
    vi.stubEnv(name, value);
    const { default: usePusher } = await import("@/pusher");

    expect(
      () => new usePusher("private-notification.42", "event", vi.fn()),
    ).toThrow("Pusher is not configured.");
    expect(PusherClient).not.toHaveBeenCalled();
  });

  it.each([
    "https://attacker.example/pusher/auth",
    "//attacker.example/pusher/auth",
    "https://api.xeler.test/api/pusher/auth/other",
  ])(
    "does not initialize Pusher for invalid auth endpoint %s",
    async (endpoint) => {
      vi.stubEnv("VITE_BROADCAST_AUTH_URL", endpoint);
      const { default: usePusher } = await import("@/pusher");

      expect(
        () => new usePusher("private-notification.42", "event", vi.fn()),
      ).toThrow("Invalid private channel authentication configuration.");
      expect(PusherClient).not.toHaveBeenCalled();
    },
  );

  it("never logs or exposes the bearer when configuration is invalid", async () => {
    vi.stubEnv("VITE_BROADCAST_AUTH_URL", "//attacker.example/pusher/auth");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { default: usePusher } = await import("@/pusher");

    let message = "";
    try {
      new usePusher("private-notification.42", "event", vi.fn());
    } catch (exception) {
      message = (exception as Error).message;
    }

    expect(message).not.toContain("private-pusher-token");
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
