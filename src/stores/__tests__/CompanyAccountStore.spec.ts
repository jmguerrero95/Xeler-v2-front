import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyAccountStore } from "../CompanyAccountStore";

const httpMock = vi.fn();

vi.mock("@/helper", () => ({
  helperStore: () => ({
    http: httpMock,
  }),
}));

describe("CompanyAccountStore flow payment methods", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    httpMock.mockReset();
    httpMock.mockResolvedValue({ data: { response: [] } });
  });

  it("omits include_unavailable when the normal UI requests only enabled methods", async () => {
    const store = CompanyAccountStore();

    await store.getFlowPaymentMethods({
      type: "buy",
      currency_id: 3,
    });

    expect(httpMock).toHaveBeenCalledWith("order/flow/payment-methods", "get", {
      params: {
        type: "Compra",
        currency_id: 3,
        company_id: undefined,
        include_unavailable: undefined,
      },
    });
  });

  it("serializes include_unavailable as Laravel-compatible 1 when requested", async () => {
    const store = CompanyAccountStore();

    await store.getFlowPaymentMethods({
      type: "sale",
      currency_id: 9,
      include_unavailable: true,
    });

    expect(httpMock).toHaveBeenCalledWith("order/flow/payment-methods", "get", {
      params: {
        type: "Venta",
        currency_id: 9,
        company_id: undefined,
        include_unavailable: 1,
      },
    });
  });
});
