type TurnstileCallbacks = {
  callback(token: string): void;
  "expired-callback"(): void;
  "error-callback"(): void;
};

type Turnstile = {
  render(container: HTMLElement, options: { sitekey: string } & TurnstileCallbacks): string;
  reset(widgetId?: string): void;
  remove(widgetId?: string): void;
};

const globalTurnstile = (): Turnstile | undefined =>
  (globalThis as typeof globalThis & { turnstile?: Turnstile }).turnstile;

let turnstileLoadPromise: Promise<Turnstile> | null = null;

const loadTurnstile = (): Promise<Turnstile> => {
  const loaded = globalTurnstile();
  if (loaded) return Promise.resolve(loaded);
  if (turnstileLoadPromise) return turnstileLoadPromise;

  turnstileLoadPromise = new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.xelerTurnstile = "registration";
    script.onload = () => {
      const turnstile = globalTurnstile();
      if (turnstile) {
        resolve(turnstile);
      } else {
        turnstileLoadPromise = null;
        reject(new Error("TURNSTILE_UNAVAILABLE"));
      }
    };
    script.onerror = () => {
      turnstileLoadPromise = null;
      reject(new Error("TURNSTILE_UNAVAILABLE"));
    };
    document.head.appendChild(script);
  });

  return turnstileLoadPromise;
};

export const renderRegistrationTurnstile = async (
  container: HTMLElement,
  onToken: (token: string) => void,
  onInvalid: () => void,
): Promise<string> => {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  if (!siteKey) {
    throw new Error("TURNSTILE_UNAVAILABLE");
  }

  const turnstile = await loadTurnstile();
  return turnstile.render(container, {
    sitekey: siteKey,
    callback: onToken,
    "expired-callback": onInvalid,
    "error-callback": onInvalid,
  });
};

export const resetRegistrationTurnstile = (widgetId: string | null): void => {
  if (widgetId) globalTurnstile()?.reset(widgetId);
};

export const removeRegistrationTurnstile = (widgetId: string | null): void => {
  if (widgetId) globalTurnstile()?.remove(widgetId);
};
