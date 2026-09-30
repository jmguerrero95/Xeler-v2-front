import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAuthToken,
  getAuthToken,
  isAuthTokenExpired,
  setAuthToken,
} from "@/services/authToken";

describe("authoritative authentication token storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("stores the normalized login token only for the browser session", () => {
    expect(setAuthToken("17|session-bearer")).toBe("17|session-bearer");
    expect(getAuthToken()).toBe("17|session-bearer");
    expect(sessionStorage.getItem("token")).toBe("17|session-bearer");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("rejects and removes an explicitly expired token", () => {
    const expiredAt = new Date(Date.now() - 1000);
    const token = setAuthToken("expired-token", expiredAt);

    expect(isAuthTokenExpired(token)).toBe(true);
    expect(getAuthToken()).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
  });

  it("removes all bearer access on logout", () => {
    setAuthToken("active-token");
    localStorage.setItem("token", "legacy-token");
    clearAuthToken();

    expect(getAuthToken()).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
