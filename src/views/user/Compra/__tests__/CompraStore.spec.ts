import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import { ConfirmOrderStore } from "../CompraStore";

const httpMock = vi.fn();
const showNotifyMock = vi.fn();
const pushMock = vi.fn();

vi.mock("@/helper", () => ({
  helperStore: () => ({
    http: httpMock,
    showNotify: showNotifyMock,
  }),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("ConfirmOrderStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    httpMock.mockReset();
    showNotifyMock.mockReset();
    pushMock.mockReset();
  });

  it("does not create an order without quote_id", async () => {
    const store = ConfirmOrderStore();

    Object.assign(store.form, {
      type: OrderTypes.COMPRA,
      currency_id: 1,
      payment_type_id: 2,
      shipping_type_id: 3,
      account_delivery_id: 4,
      amount_currency: "1",
      currency_price: "4000",
      exchange_local: "4000",
      exchange_reference: "1",
      received_amount: "1",
      total_exchange_local: "4000",
      total_exchange_reference: "1",
      fiat_received: "4000",
      administrative_fee_order: "0",
      quote_id: "",
    });

    const created = await store.createOrder(OrderTypes.COMPRA);

    expect(created).toBe(false);
    expect(httpMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(showNotifyMock).toHaveBeenCalledWith(
      expect.stringContaining("cotizacion"),
      { type: "error" },
    );
  });

  it("resets quote totals and quote_id", async () => {
    const store = ConfirmOrderStore();

    httpMock.mockResolvedValueOnce({
      data: {
        data: {
          quote_id: "quote-1",
          amount_currency: "10",
          net_amount_currency: "9.5",
          network_fee_currency: "0.5",
          network_fee_local: "2000",
          rate: "4000",
          total_exchange_local: "38000",
          total_exchange_reference: "10",
          administrative_fee_local: "3000",
        },
      },
    });

    await store.requestQuote({
      type: "Venta",
      currency_id: 1,
      payment_type_id: 2,
      input_currency: "CRYPTO",
      input_amount: "10",
    });

    expect(store.form.quote_id).toBe("quote-1");
    expect(store.quote?.quote_id).toBe("quote-1");

    store.resetQuote();

    expect(store.form.quote_id).toBe("");
    expect(store.quote).toBeNull();
    expect(store.form.amount_currency).toBe("0");
    expect(store.form.total_exchange_local).toBe("0");
    expect(store.form.received_amount).toBe("0");
  });

  it("does not navigate when backend rejects with ACTIVE_PENALTY", async () => {
    const store = ConfirmOrderStore();

    Object.assign(store.form, {
      type: OrderTypes.VENTA,
      currency_id: 1,
      payment_type_id: 2,
      account_delivery_id: 4,
      amount_currency: "10",
      currency_price: "4000",
      exchange_local: "4000",
      exchange_reference: "1",
      received_amount: "10",
      total_exchange_local: "37000",
      total_exchange_reference: "10",
      fiat_received: "0",
      administrative_fee_order: "3000",
      quote_id: "quote-penalty",
    });

    httpMock.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          code: "ACTIVE_PENALTY",
          message: "Actualmente tienes una penalizacion activa.",
        },
      },
    });

    const created = await store.createOrder(OrderTypes.VENTA);

    expect(created).toBe(false);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows backend buy payment method errors without navigating", async () => {
    const store = ConfirmOrderStore();

    Object.assign(store.form, {
      type: OrderTypes.COMPRA,
      currency_id: 1,
      payment_type_id: 7,
      shipping_type_id: 3,
      account_delivery_id: 4,
      amount_currency: "0",
      currency_price: "4000",
      exchange_local: "4000",
      exchange_reference: "1",
      received_amount: "0",
      total_exchange_local: "100000",
      total_exchange_reference: "25",
      fiat_received: "100000",
      administrative_fee_order: "0",
      quote_id: "quote-limit",
    });

    httpMock.mockRejectedValueOnce({
      status: 409,
      code: "COMPANY_ACCOUNT_LIMIT_EXCEEDED",
      message: "La cuenta de pago no tiene cupo disponible.",
      messages: ["La cuenta de pago no tiene cupo disponible."],
      validationErrors: {},
      isNetworkError: false,
      original: null,
    });

    const created = await store.createOrder(OrderTypes.COMPRA);

    expect(created).toBe(false);
    expect(pushMock).not.toHaveBeenCalled();
    expect(showNotifyMock).toHaveBeenCalledWith(
      "La cuenta de pago no tiene cupo disponible.",
      { type: "error" },
    );
  });

  it("requires explicit reconfirmation when refreshed quote values change", async () => {
    const store = ConfirmOrderStore();
    const quoteA = {
      quote_id: "quote-1",
      amount_currency: "10",
      net_amount_currency: "9.5",
      network_fee_currency: "0.5",
      network_fee_local: "2000",
      rate: "4000",
      total_exchange_local: "38000",
      total_exchange_reference: "10",
      administrative_fee_local: "3000",
    };
    const quoteB = {
      ...quoteA,
      quote_id: "quote-2",
      rate: "4100",
      total_exchange_local: "38950",
    };

    httpMock
      .mockResolvedValueOnce({ data: { data: quoteA } })
      .mockResolvedValueOnce({ data: { data: quoteB } })
      .mockResolvedValueOnce({
        data: {
          response: {
            attributes: {
              tranx_no: "TRX-1",
            },
          },
        },
      });

    await store.requestQuote({
      type: "Compra",
      currency_id: 1,
      payment_type_id: 2,
      shipping_type_id: 3,
      input_currency: "COP",
      input_amount: "100000",
    });
    await store.requestQuote({
      type: "Compra",
      currency_id: 1,
      payment_type_id: 2,
      shipping_type_id: 3,
      input_currency: "COP",
      input_amount: "100000",
    });

    expect(store.quoteNeedsUserReconfirmation).toBe(true);
    expect(store.form.quote_id).toBe("quote-2");

    Object.assign(store.form, {
      type: OrderTypes.COMPRA,
      currency_id: 1,
      payment_type_id: 2,
      shipping_type_id: 3,
      account_delivery_id: 4,
      red_id: 5,
      address_send: "TQn9Y2khDD95J42FQtQTdwVVRKnj5yDR9k",
      exchange_reference: "1",
      fiat_received: "100000",
    });

    const firstAttempt = await store.createOrder(OrderTypes.COMPRA);

    expect(firstAttempt).toBe(false);
    expect(store.quoteNeedsUserReconfirmation).toBe(false);
    expect(showNotifyMock).toHaveBeenCalledWith(
      "La cotizacion fue actualizada. Revisa los nuevos valores y confirma nuevamente.",
      { type: "warning" },
    );
    expect(httpMock).toHaveBeenCalledTimes(2);

    const secondAttempt = await store.createOrder(OrderTypes.COMPRA);

    expect(secondAttempt).toBe(true);
    expect(httpMock).toHaveBeenCalledTimes(3);
    expect(pushMock).toHaveBeenCalledWith({
      name: "user-check-buy",
      params: { numTransaction: "TRX-1" },
    });
  });

  it.each([
    ["network fee", { network_fee_currency: "0.75", network_fee_local: "3075" }],
    ["received amount", { final_crypto_received_amount: "9.25", received_amount: "9.25" }],
  ])("requires reconfirmation when %s changes", async (_label, changes) => {
    const store = ConfirmOrderStore();
    const baseQuote = {
      quote_id: "quote-fee-a",
      amount_currency: "10",
      gross_crypto_amount: "10",
      net_amount_currency: "9.5",
      final_crypto_received_amount: "9.5",
      received_amount: "9.5",
      network_fee_currency: "0.5",
      network_fee_local: "2000",
      provider_fee_currency: "0",
      provider_fee_local: "0",
      fee_policy: "company_absorbed",
      fee_source: "configured_fallback",
      fee_is_estimated: true,
      rate: "4000",
      total_exchange_local: "100000",
      total_exchange_reference: "25",
      administrative_fee_local: "3000",
    };

    httpMock
      .mockResolvedValueOnce({ data: { data: baseQuote } })
      .mockResolvedValueOnce({ data: { data: { ...baseQuote, ...changes, quote_id: "quote-fee-b" } } });

    const payload = {
      type: "Compra" as const,
      currency_id: 1,
      payment_type_id: 2,
      shipping_type_id: 3,
      input_currency: "COP" as const,
      input_amount: "100000",
    };
    await store.requestQuote(payload);
    await store.requestQuote(payload);

    expect(store.quoteNeedsUserReconfirmation).toBe(true);
  });

  it("does not send authoritative economic fields when creating an order", async () => {
    const store = ConfirmOrderStore();
    Object.assign(store.form, {
      quote_id: "quote-safe-payload",
      type: OrderTypes.COMPRA,
      currency_id: 1,
      payment_type_id: 2,
      shipping_type_id: 3,
      account_delivery_id: 4,
      red_id: 5,
      address_send: "TQn9Y2khDD95J42FQtQTdwVVRKnj5yDR9k",
      amount_currency: "999",
      received_amount: "999",
      fee: "0",
      fee_mining_cop: "0",
      currency_price: "1",
      administrative_fee_order: "0",
    });
    httpMock.mockResolvedValueOnce({
      data: { response: { attributes: { tranx_no: "TRX-SAFE" } } },
    });

    expect(await store.createOrder(OrderTypes.COMPRA)).toBe(true);

    const payload = httpMock.mock.calls[0][2].data;
    expect(payload).not.toHaveProperty("amount_currency");
    expect(payload).not.toHaveProperty("received_amount");
    expect(payload).not.toHaveProperty("fee");
    expect(payload).not.toHaveProperty("fee_mining_cop");
    expect(payload).not.toHaveProperty("currency_price");
    expect(payload).not.toHaveProperty("administrative_fee_order");
    expect(payload).not.toHaveProperty("xcop_payment");
    expect(payload.quote_id).toBe("quote-safe-payload");
  });
});
