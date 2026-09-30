import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/services/apiClient", () => ({ apiClient: client }));

import {
  addInternationalAccountProducts,
  isInternationalAccountsMenuAvailable,
  requestInternationalAccountAccess,
  transitionInternationalAccount,
} from "@/services/internationalAccountsApi";

describe("internationalAccountsApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends only the normalized request contract with idempotency", () => {
    const payload = {
      requested_products: ["usd"] as Array<"usd" | "eur">,
      use_case: "Pagos internacionales",
      expected_monthly_volume: "1000.25",
      expected_monthly_volume_currency: "usd" as const,
    };
    requestInternationalAccountAccess(payload);

    expect(client.post).toHaveBeenCalledWith(
      "international-accounts/access/request",
      payload,
      { idempotent: true },
    );
  });

  it("uses explicit administrative transition endpoints", () => {
    transitionInternationalAccount(7, "approve", "KYC interno aprobado");
    expect(client.post).toHaveBeenCalledWith(
      "admin/international-accounts/7/approve",
      { reason: "KYC interno aprobado" },
      { idempotent: true, financialScope: "finance.international_accounts" },
    );
  });

  it("adds approved products through the idempotent expansion endpoint", () => {
    addInternationalAccountProducts(["eur"]);
    expect(client.post).toHaveBeenCalledWith(
      "international-accounts/access/products",
      { requested_products: ["eur"] },
      { idempotent: true },
    );
  });

  it("hides the client menu unless backend feature and permission are enabled", () => {
    expect(isInternationalAccountsMenuAvailable(false, "user", true)).toBe(
      false,
    );
    expect(isInternationalAccountsMenuAvailable(true, "user", false)).toBe(
      false,
    );
    expect(isInternationalAccountsMenuAvailable(true, "admin", true)).toBe(
      false,
    );
    expect(isInternationalAccountsMenuAvailable(true, "user", true)).toBe(true);
  });
});
