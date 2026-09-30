import { describe, expect, it } from "vitest";
import { validatePayoutReconciliation } from "../cryptoPayoutReconciliation";

describe("payout reconciliation validation", () => {
  it("requires TXID and reason for a transmitted payout", () => {
    expect(validatePayoutReconciliation({ action: "transmitted", reason: "", txid: "" })).toContain("motivo");
    expect(validatePayoutReconciliation({ action: "transmitted", reason: "Provider checked", txid: "" })).toContain("TXID");
    expect(validatePayoutReconciliation({ action: "transmitted", reason: "Provider checked", txid: "a".repeat(64) })).toBeNull();
  });

  it("requires reason and explicit confirmation when not transmitted", () => {
    expect(validatePayoutReconciliation({ action: "not_transmitted", reason: "Provider checked" })).toContain("confirmar");
    expect(validatePayoutReconciliation({ action: "not_transmitted", reason: "Provider checked", confirmation: true })).toBeNull();
  });
});
