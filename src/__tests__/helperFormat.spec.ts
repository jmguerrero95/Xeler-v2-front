import { describe, expect, it } from "vitest";
import { formatNumber, getWalletFormated } from "@/helper";

describe("formatNumber", () => {
  it("formats decimal strings returned by financial APIs without crashing", () => {
    expect(formatNumber("3201.50", ",", ".", 0)).toBe("3.202");
  });

  it("fails safely for non-numeric presentation values", () => {
    expect(formatNumber("not-a-number")).toBe("0");
  });
});

describe("getWalletFormated", () => {
  it("renders absent destination wallets safely for sell orders", () => {
    expect(getWalletFormated(null)).toBe("-");
    expect(getWalletFormated(undefined)).toBe("-");
  });
});
