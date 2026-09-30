import Pusher, { Channel, type Options } from "pusher-js";
import { getAuthToken } from "@/services/authToken";

const hasAmbiguousExternalPrefix = (url: string): boolean =>
  /^[\\/]{2}/.test(url);

export const resolvePusherAuthEndpoint = (
  apiBase: string,
  configuredEndpoint?: string,
): string | null => {
  try {
    if (!apiBase || hasAmbiguousExternalPrefix(apiBase)) return null;
    const officialApi = new URL(apiBase, window.location.origin);
    if (!["http:", "https:"].includes(officialApi.protocol)) return null;

    const officialPath = officialApi.pathname.replace(/\/+$/, "");
    const allowed = new URL(`${officialPath}/pusher/auth`, officialApi.origin);
    const configured = configuredEndpoint?.trim();
    if (!configured) return allowed.toString();
    if (hasAmbiguousExternalPrefix(configured)) return null;

    const candidate = new URL(
      configured,
      `${officialApi.origin}${officialPath}/`,
    );
    if (!["http:", "https:"].includes(candidate.protocol)) return null;
    if (
      candidate.username ||
      candidate.password ||
      candidate.search ||
      candidate.hash
    ) {
      return null;
    }

    return candidate.origin === allowed.origin &&
      candidate.pathname === allowed.pathname
      ? candidate.toString()
      : null;
  } catch {
    return null;
  }
};

export default class usePusher<T = unknown> {
  private pusher: Pusher;
  private channel: Channel;
  private eventHandler: (event: T) => void;

  constructor(
    private channelName: string,
    private eventName: string,
    private callback: (event: T) => void,
  ) {
    const appKey = import.meta.env.VITE_PUSHER_APP_KEY?.trim();
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER?.trim();
    if (!appKey || !cluster) {
      throw new Error("Pusher is not configured.");
    }

    const options: Options = {
      cluster,
    };
    const configuredHost = import.meta.env.VITE_PUSHER_HOST?.trim();
    if (configuredHost) {
      const configuredScheme =
        import.meta.env.VITE_PUSHER_SCHEME?.trim().toLowerCase() === "https"
          ? "https"
          : "http";
      const configuredPort = Number(import.meta.env.VITE_PUSHER_PORT);
      if (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65535) {
        throw new Error("Invalid Pusher port.");
      }
      options.wsHost = configuredHost;
      options.wsPort = configuredPort;
      options.wssPort = configuredPort;
      options.forceTLS = configuredScheme === "https";
      options.enabledTransports = configuredScheme === "https" ? ["wss"] : ["ws"];
    }

    if (this.channelName.startsWith("private-")) {
      const authEndpoint = resolvePusherAuthEndpoint(
        import.meta.env.VITE_API_URL,
        import.meta.env.VITE_BROADCAST_AUTH_URL,
      );
      if (!authEndpoint) {
        throw new Error(
          "Invalid private channel authentication configuration.",
        );
      }

      options.channelAuthorization = {
        endpoint: authEndpoint,
        transport: "ajax",
        headersProvider: () => {
          const token = getAuthToken();
          return token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {};
        },
      };
    }

    this.pusher = new Pusher(appKey, options);
    this.channel = this.pusher.subscribe(this.channelName);

    this.eventHandler = (data: T) => {
      this.callback(data);
    };

    this.channel.bind(this.eventName, this.eventHandler);
  }

  public unMounted() {
    this.channel.unbind(this.eventName, this.eventHandler);
    this.pusher.unsubscribe(this.channelName);
    this.pusher.disconnect();
  }
}
