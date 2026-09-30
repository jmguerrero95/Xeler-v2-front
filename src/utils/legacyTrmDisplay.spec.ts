import { describe, expect, it } from "vitest";
import { legacyTrmDisplayValue } from "@/utils/legacyTrmDisplay";

describe("paridad visual de Valores basados en TRM con Xeler V1", () => {
  const ticker = {
    symbol: "TETHER",
    buy: "4123",
    buy_cash: "4160",
    sell: "4075",
    oficial: "4100",
  };

  it("muestra oficial para criptoactivos históricos", () => {
    expect(legacyTrmDisplayValue("BTC", { ...ticker, oficial: "260923953" })).toBe(260923953);
  });

  it("muestra buy_cash para Tether y sus aliases V2", () => {
    expect(legacyTrmDisplayValue("USDT", ticker)).toBe(4160);
    expect(legacyTrmDisplayValue("USDC", ticker)).toBe(4160);
  });

  it("no fabrica un valor cuando el ticker no es válido", () => {
    expect(legacyTrmDisplayValue("ETH", { ...ticker, oficial: "0" })).toBe(0);
  });
});
