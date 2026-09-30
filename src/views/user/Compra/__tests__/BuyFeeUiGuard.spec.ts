import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

describe("buy fee UI guard", () => {
  it("uses one canonical breakdown for desktop and mobile confirmation", () => {
    const confirmOrder = source("../ConfirmOrder.vue");
    const occurrences = confirmOrder.match(/<BuyFeeBreakdown\b/g) ?? [];

    expect(occurrences).toHaveLength(1);
    expect(confirmOrder).not.toMatch(/smAndDown|PreviewOrderForConfirm|feeSummary/);
  });

  it("keeps XCOP and legacy fee reconstruction out of buy confirmation summaries", () => {
    const confirmOrder = source("../ConfirmOrder.vue");
    const legacyPreview = source("../../../../layouts/full/menuRight/PreviewOrder/PreviewOrderForConfirm.vue");
    const combined = `${confirmOrder}\n${legacyPreview}`;

    expect(combined).not.toMatch(/Usar XCOP|Fee Mineros|feeMiner|feeAdministrative|orderHaveFees/);
  });

  it("does not render the legacy side preview for a buy order", () => {
    const menuRight = source("../../../../layouts/full/menuRight/MenuRight.vue");

    expect(menuRight).toContain("transactionStore.typeOrder !== OrderTypes.COMPRA");
  });
});
