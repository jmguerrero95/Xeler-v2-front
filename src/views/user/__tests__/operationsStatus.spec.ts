import { describe, expect, it } from "vitest";
import { buildOperationsBlockedMessage } from "../operationsStatus";

describe("operations status", () => {
  it("fails closed while loading or when public status cannot be fetched", () => {
    expect(buildOperationsBlockedMessage("buy", null, true, "")).toContain("verificando la disponibilidad operativa");
    expect(buildOperationsBlockedMessage("sell", null, false, "No fue posible verificar la disponibilidad operativa de ventas."))
      .toBe("No fue posible verificar la disponibilidad operativa de ventas.");
  });

  it("uses backend public message when buy or sell is disabled", () => {
    const status = {
      system_status: "normal",
      buy_enabled: false,
      sell_enabled: true,
      new_orders_enabled: true,
      manual_mode: false,
      public_message: "Compras temporalmente cerradas.",
      currencies: [],
    };

    expect(buildOperationsBlockedMessage("buy", status, false, "")).toBe("Compras temporalmente cerradas.");
    expect(buildOperationsBlockedMessage("sell", status, false, "")).toBe("");
  });
});
