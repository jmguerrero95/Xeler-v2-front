const TOKEN_KEY = "token";
const TOKEN_EXPIRES_AT_KEY = "token_expires_at";

const storage = (): Storage => window.sessionStorage;

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const tokenExpiry = (token: string): number | null => {
  const stored = storage().getItem(TOKEN_EXPIRES_AT_KEY);
  if (stored) {
    const parsed = Date.parse(stored);
    if (Number.isFinite(parsed)) return parsed;
  }

  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : null;
};

export const clearAuthToken = (): void => {
  storage().removeItem(TOKEN_KEY);
  storage().removeItem(TOKEN_EXPIRES_AT_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
};

export const isAuthTokenExpired = (token: string): boolean => {
  const expiresAt = tokenExpiry(token);
  return expiresAt !== null && expiresAt <= Date.now();
};

export const getAuthToken = (): string | null => {
  const token = storage().getItem(TOKEN_KEY);
  if (!token) return null;

  if (isAuthTokenExpired(token)) {
    clearAuthToken();
    return null;
  }

  return token;
};

export const setAuthToken = (
  token: string,
  expiresAt?: string | number | Date | null,
): string => {
  const normalized = token.trim();
  if (!normalized) {
    clearAuthToken();
    throw new Error("Authentication token is required.");
  }

  storage().setItem(TOKEN_KEY, normalized);
  if (expiresAt != null) {
    const parsed =
      expiresAt instanceof Date
        ? expiresAt
        : new Date(typeof expiresAt === "number" ? expiresAt : expiresAt);
    if (!Number.isFinite(parsed.getTime())) {
      clearAuthToken();
      throw new Error("Authentication token expiration is invalid.");
    }
    storage().setItem(TOKEN_EXPIRES_AT_KEY, parsed.toISOString());
  } else {
    storage().removeItem(TOKEN_EXPIRES_AT_KEY);
  }

  // A bearer token must never persist beyond the browser session.
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  return normalized;
};
