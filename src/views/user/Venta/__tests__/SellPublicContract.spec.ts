import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";

const readSource = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

describe("sell public API contract", () => {
  it("does not request admin configuration or recalculate quote fees", () => {
    const sellView = readSource("../VentaView.vue");
    const initSell = readSource("../InitSell.vue");
    const publicFlow = `${sellView}\n${initSell}`;

    expect(publicFlow).not.toContain("GeneralConfiguration");
    expect(publicFlow).not.toContain("getGeneralData");
    expect(publicFlow).not.toContain("order_fee_limit");
    expect(sellView).not.toContain("administrative_fee_order =");
    expect(initSell).toContain("quote.value.fees?.total_fees");
    expect(initSell).toContain("compareDecimalStrings");
  });
});
