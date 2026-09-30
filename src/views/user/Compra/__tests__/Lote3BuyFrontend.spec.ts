import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import { ConfirmOrderStore } from "../CompraStore";

const httpMock = vi.fn();
const notifyMock = vi.fn();
const pushMock = vi.fn();

vi.mock("@/helper", () => ({
  helperStore: () => ({ http: httpMock, showNotify: notifyMock }),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};

const quotePayload = {
  type: "Compra" as const,
  currency_id: 1,
  payment_type_id: 2,
  shipping_type_id: 3,
  input_currency: "COP" as const,
  input_amount: "100000",
};

const quoteResponse = (quoteId: string) => ({
  data: {
    data: {
      quote_id: quoteId,
      amount_currency: "25",
      net_amount_currency: "25",
      network_fee_currency: "0",
      network_fee_local: "1000",
      rate: "4000",
      total_exchange_local: "100000",
      total_exchange_reference: "25",
      administrative_fee_local: "3000",
    },
  },
});

describe("Lote 3 Compra frontend contracts", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    httpMock.mockReset();
    notifyMock.mockReset();
    pushMock.mockReset();
  });

  it("coalesces two identical in-flight quote requests", async () => {
    const pending = deferred<ReturnType<typeof quoteResponse>>();
    httpMock.mockReturnValueOnce(pending.promise);
    const store = ConfirmOrderStore();

    const first = store.requestQuote(quotePayload);
    const second = store.requestQuote(quotePayload);

    expect(store.requestingQuote).toBe(true);
    expect(httpMock).toHaveBeenCalledTimes(1);

    pending.resolve(quoteResponse("quote-l3-one"));
    await expect(first).resolves.toMatchObject({ quote_id: "quote-l3-one" });
    await expect(second).resolves.toMatchObject({ quote_id: "quote-l3-one" });
    expect(store.form.quote_id).toBe("quote-l3-one");
    expect(store.requestingQuote).toBe(false);
  });

  it("serializes a changed quote request so stale data cannot win", async () => {
    const firstPending = deferred<ReturnType<typeof quoteResponse>>();
    httpMock
      .mockReturnValueOnce(firstPending.promise)
      .mockResolvedValueOnce(quoteResponse("quote-l3-new"));
    const store = ConfirmOrderStore();

    const first = store.requestQuote(quotePayload);
    const second = store.requestQuote({ ...quotePayload, input_amount: "120000" });
    expect(httpMock).toHaveBeenCalledTimes(1);

    firstPending.resolve(quoteResponse("quote-l3-old"));
    await first;
    await expect(second).resolves.toMatchObject({ quote_id: "quote-l3-new" });

    expect(httpMock).toHaveBeenCalledTimes(2);
    expect(store.form.quote_id).toBe("quote-l3-new");
  });

  it("submits a buy once when the confirmation button is triggered twice", async () => {
    const pending = deferred<{ data: { response: { attributes: { tranx_no: string } } } }>();
    httpMock.mockReturnValueOnce(pending.promise);
    const store = ConfirmOrderStore();
    Object.assign(store.form, {
      quote_id: "quote-l3-create",
      type: OrderTypes.COMPRA,
      currency_id: 1,
      payment_type_id: 2,
      shipping_type_id: 3,
      account_delivery_id: 4,
      red_id: 5,
      address_send: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
    });

    const first = store.createOrder(OrderTypes.COMPRA);
    const second = await store.createOrder(OrderTypes.COMPRA);

    expect(second).toBe(false);
    expect(httpMock).toHaveBeenCalledTimes(1);
    expect(pushMock).not.toHaveBeenCalled();

    pending.resolve({ data: { response: { attributes: { tranx_no: "L3-BUY-1" } } } });
    await expect(first).resolves.toBe(true);
    expect(pushMock).toHaveBeenCalledOnce();
    expect(pushMock).toHaveBeenCalledWith({
      name: "user-check-buy",
      params: { numTransaction: "L3-BUY-1" },
    });
  });

  it("invalidates economic state after a retryable destination failure", async () => {
    const store = ConfirmOrderStore();
    Object.assign(store.form, {
      quote_id: "quote-l3-stale",
      amount_currency: "25",
      received_amount: "25",
      total_exchange_local: "100000",
    });
    httpMock.mockRejectedValueOnce({
      status: 409,
      code: "COMPANY_ACCOUNT_UNAVAILABLE",
      message: "No hay una cuenta disponible.",
      messages: [],
    });

    const created = await store.createOrder(OrderTypes.COMPRA);

    expect(created).toBe(false);
    expect(store.quoteRequiresRefresh).toBe(true);
    expect(store.form.quote_id).toBe("");
    expect(store.form.amount_currency).toBe("0");
    expect(store.form.received_amount).toBe("0");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("clears stale wallets when the filtered request fails", async () => {
    const store = ConfirmOrderStore();
    httpMock
      .mockResolvedValueOnce({ data: { response: [{ id: 1 }] } })
      .mockRejectedValueOnce(new Error("network unavailable"));

    await store.getWallets(1);
    expect(store.wallets).toHaveLength(1);

    await store.getWallets(2);
    expect(store.wallets).toEqual([]);
    expect(store.walletsError).toContain("billeteras cripto");
    expect(store.walletsLoading).toBe(false);
  });
});
