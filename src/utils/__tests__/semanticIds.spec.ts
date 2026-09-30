import { describe, expect, it } from "vitest";
import { paymentMethodCode, requirePaymentMethod } from "@/utils/paymentMethodSemantics";
import { PENALTY_NAMES, PENALTY_TYPES } from "@/enums/PenaltyTypes.enum";

const methods = [
  { id: 77, attributes: { name: "Banco", code: "bank", slug: "bank" } },
  { id: 88, attributes: { name: "Efectivo", code: "cash", slug: "cash" } },
  { id: 99, attributes: { name: "Otros", code: "other", slug: "other" } },
] as any;

describe("identidades semánticas", () => {
  it("resuelve tipos de pago por code/slug y conserva el id físico real", () => {
    expect(requirePaymentMethod(methods, "bank").id).toBe(77);
    expect(requirePaymentMethod(methods, "cash").id).toBe(88);
    expect(requirePaymentMethod(methods, "other").id).toBe(99);
    expect(paymentMethodCode({ id: 123, attributes: { name: "Banco", slug: "bank" } } as any)).toBe("bank");
  });

  it("falla cerrado si falta la semántica requerida", () => {
    expect(() => requirePaymentMethod(methods, "xcop")).toThrow("No se encontró");
  });

  it("representa Compra/Venta por código y no por id físico", () => {
    expect(PENALTY_TYPES.COMPRA).toBe("buy");
    expect(PENALTY_TYPES.VENTA).toBe("sell");
    expect(PENALTY_NAMES[PENALTY_TYPES.COMPRA]).toBe("Compra");
    expect(PENALTY_NAMES[PENALTY_TYPES.VENTA]).toBe("Venta");
  });
});
