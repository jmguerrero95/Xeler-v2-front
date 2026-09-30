import { helperStore } from "@/helper";
import type { OrderCreate } from "@/interfaces/Order/Order.dto";
import type { ShippingType } from "@/interfaces/ShippingType/ShippingType.model";
import { ref } from "vue";
import { defineStore } from "pinia";
import { useRouter } from "vue-router";
import type { Order } from "@/interfaces/Order/Order.model";
import type { OrderQuoteAttributes } from "@/interfaces/Order/OrderQuote.model";
import type { Wallet } from "@/interfaces/Wallet/Wallet.model";
import type { NetworkType } from "@/interfaces/NetworkType/NetworkType.model";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";
import type { NormalizedApiError } from "@/services/apiErrors";

export const ConfirmOrderStore = defineStore("confirm-order", () => {
  const router = useRouter();
  const helper = helperStore();

  const form = ref<OrderCreate & { company_id: number | null; breb_key_id: number | string; payment_method_code: string }>({
    red_id: "",
    amount_currency: "0",
    currency_id: "",
    currency_price: "0",
    exchange_local: "0",
    exchange_reference: "0",
    fee: "0",
    fee_mining_cop: "0",
    payment_type_id: "",
    received_amount: "0",
    shipping_type_id: "",
    total_exchange_local: "0",
    total_exchange_reference: "0",
    type: OrderTypes.COMPRA,
    account_delivery_id: "",
    wallet_id: "",
    address_send: "",
    xcop_payment: false,
    administrative_fee_order: 0,
    fiat_received: "0",
    quote_id: "",
    company_id: null,
    breb_key_id: "",
    payment_method_code: "",
  });

  const shippingType = ref<ShippingType[]>([]);
  const quote = ref<OrderQuoteAttributes | null>(null);
  const quoteError = ref<string | null>(null);
  const quoteNeedsUserReconfirmation = ref(false);
  const quoteRequiresRefresh = ref(false);
  const creatingOrder = ref(false);
  const requestingQuote = ref(false);
  const quoteInputSide = ref<"fiat" | "crypto">("fiat");
  const quoteInputAmount = ref<string>("0");

  const setQuoteInput = (side: "fiat" | "crypto", amount: string): void => {
    quoteInputSide.value = side;
    quoteInputAmount.value = amount;
  };
  let quoteRequestPromise: Promise<OrderQuoteAttributes> | null = null;
  let quoteRequestPayloadHash: string | null = null;

  const quotePayloadHash = (payload: Record<string, unknown>): string =>
    JSON.stringify(
      Object.keys(payload)
        .sort()
        .reduce<Record<string, unknown>>((normalized, key) => {
          const value = payload[key];
          if (value !== undefined) normalized[key] = value;
          return normalized;
        }, {}),
    );

  const getShippingTypes = async () => {
    if (!form.value.payment_type_id || !form.value.currency_id) {
      shippingType.value = [];
      return;
    }

    const url = "order/flow/shipping-types";
    const res = await helper.http(url, "get", {
      params: {
        type: form.value.type,
        payment_type_id: form.value.payment_type_id,
        currency_id: form.value.currency_id,
      },
    });
    shippingType.value = res.data.response;
  };

  const feeOptions = ref<{
    currency: string | null;
    network: string | null;
    provider: string | null;
    fee_mode: string;
    fee_asset: string | null;
    selectable: boolean;
    options: Array<Record<string, unknown>>;
  } | null>(null);

  const getFeeOptions = async () => {
    if (!form.value.currency_id || !form.value.type) {
      feeOptions.value = null;
      return null;
    }

    const res = await helper.http("order/flow/fee-options", "get", {
      params: {
        type: form.value.type,
        currency_id: form.value.currency_id,
      },
    });

    feeOptions.value = res.data.data ?? res.data.response ?? null;
    return feeOptions.value;
  };

  const createOrder = async (type: OrderTypes) => {
    if (creatingOrder.value) {
      return false;
    }

    const url = "order";
    const data = {
      quote_id: String(form.value.quote_id ?? ""),
      company_id: form.value.company_id,
      type: form.value.type,
      currency_id: form.value.currency_id,
      payment_type_id: form.value.payment_type_id,
      breb_key_id: form.value.breb_key_id || undefined,
      shipping_type_id: form.value.shipping_type_id,
      account_delivery_id: form.value.account_delivery_id,
      wallet_id: form.value.wallet_id,
      address_send: form.value.address_send,
      red_id: form.value.red_id,
      grades: form.value.grades,
      ...(form.value.type === OrderTypes.VENTA ? { xcop_payment: Boolean(form.value.xcop_payment) } : {}),
    };

    let res;
    creatingOrder.value = true;
    try {
      const scope = "order-create";
      const idempotencyKey = createOperationKey(scope, data);

      if (!form.value.quote_id) {
        helper.showNotify("Debes solicitar una cotizacion valida antes de crear la orden.", {
          type: "error",
        });
        return false;
      }

      if (quoteNeedsUserReconfirmation.value) {
        quoteNeedsUserReconfirmation.value = false;
        helper.showNotify(
          "La cotizacion fue actualizada. Revisa los nuevos valores y confirma nuevamente.",
          { type: "warning" },
        );
        return false;
      }

      res = await helper.http(
        url,
        "post",
        {
          data,
        },
        "",
        false,
        {
          idempotent: true,
          idempotencyKey,
          financialAction: true,
          silent: true,
        }
      );
    } catch (caught: unknown) {
      const error = caught as NormalizedApiError;
      const code = error.code;
      const message = error.message || error.messages?.[0];

      if (code === "QUOTE_EXPIRED") {
        invalidateQuoteAfterFailure(
          "La cotizacion vencio. Solicita una nueva cotizacion.",
        );
      } else if (code === "QUOTE_EXPIRY_PENALTY_ACTIVE") {
        invalidateQuoteAfterFailure(
          message ?? "Debes esperar antes de crear otra orden.",
        );
      } else if ([
        "COMPANY_ACCOUNT_UNAVAILABLE",
        "COMPANY_ACCOUNT_PAYMENT_MISMATCH",
        "COMPANY_ACCOUNT_LIMIT_EXCEEDED",
        "CASH_POINT_UNAVAILABLE",
        "PAYMENT_METHOD_UNAVAILABLE",
        "SHIPPING_TYPE_UNAVAILABLE",
      ].includes(String(code))) {
        invalidateQuoteAfterFailure(
          message ?? "No pudimos crear la orden con este metodo de pago.",
        );
      } else {
        helper.showNotify(
          message ??
            (error.status === 409
              ? "La orden tiene un conflicto de estado."
              : "No fue posible crear la orden."),
          { type: "error" },
        );
      }
      return false;
    } finally {
      creatingOrder.value = false;
    }

    clearOperationKey("order-create");
    const name = type === OrderTypes.COMPRA ? "user-check-buy" : "user-check-sell";
    router.push({
      name,
      params: {
        numTransaction: (res.data.response as Order).attributes.tranx_no,
      },
    });

    return true;
  };

  const wallets = ref<Wallet[]>([]);
  const walletsLoading = ref(false);
  const walletsError = ref("");

  const getWallets = async (currencyId?: number | string | null) => {
    const url = "order/flow/client-wallets";
    const params = currencyId ? { currency_id: currencyId } : undefined;
    walletsLoading.value = true;
    walletsError.value = "";

    try {
      const res = await helper.http(url, "get", { params });
      wallets.value = res.data.response as Wallet[];
    } catch {
      wallets.value = [];
      walletsError.value =
        "No pudimos cargar tus billeteras cripto en este momento.";
    } finally {
      walletsLoading.value = false;
    }
  };

  const networkTypes = ref<NetworkType[]>([]);

  const getNetworkTypes = async () => {
    const url = "order/flow/networks";
    const res = await helper.http(url, "get", {
      params: { currency_id: form.value.currency_id },
    });
    networkTypes.value = res.data.response as NetworkType[];
  };

  type QuoteRequestPayload = {
    type: "Compra" | "Venta";
    currency_id: number | string;
    payment_type_id: number | string;
    shipping_type_id?: number | string | "";
    input_currency: "COP" | "CRYPTO";
    input_amount: string;
    company_id?: number | null;
    breb_key_id?: number | string | null;
    xcop_payment?: boolean;
  };

  const performQuoteRequest = async (
    quotePayload: Record<string, unknown>,
  ): Promise<OrderQuoteAttributes> => {
    quoteError.value = null;

    try {
      const res = await helper.http(
        "order/flow/quote",
        "post",
        {
          data: quotePayload,
        },
        "",
        false,
        {
          idempotent: true,
          idempotencyKey: createOperationKey("order-quote", quotePayload),
          financialAction: true,
          silent: true,
        },
      );

      const previousQuote = quote.value;
      quote.value = res.data.data as OrderQuoteAttributes;
      quoteRequiresRefresh.value = false;
      quoteNeedsUserReconfirmation.value = quoteChanged(previousQuote, quote.value);
      form.value.quote_id = quote.value.quote_id;
      form.value.breb_key_id = quote.value.breb?.breb_key_id ?? form.value.breb_key_id;
      form.value.amount_currency = quote.value.amount_currency;
      form.value.received_amount =
        quote.value.net_amount_currency ?? quote.value.amount_currency;
      form.value.fee = quote.value.network_fee_currency;
      form.value.fee_mining_cop = quote.value.network_fee_local;
      form.value.currency_price = quote.value.rate;
      form.value.exchange_local = quote.value.rate;
      form.value.exchange_reference = quote.value.rate;
      form.value.total_exchange_local = quote.value.total_exchange_local;
      form.value.total_exchange_reference = quote.value.total_exchange_reference;
      form.value.administrative_fee_order = quote.value.administrative_fee_local;

      return quote.value;
    } catch (caught: unknown) {
      const error = caught as NormalizedApiError;
      const message =
        error.message ||
        error.messages?.[0] ||
        "No pudimos generar la cotizacion.";

      if ([
        "QUOTE_EXPIRED",
        "QUOTE_EXPIRY_PENALTY_ACTIVE",
        "PAYMENT_METHOD_UNAVAILABLE",
        "COMPANY_ACCOUNT_UNAVAILABLE",
        "COMPANY_ACCOUNT_PAYMENT_MISMATCH",
        "COMPANY_ACCOUNT_LIMIT_EXCEEDED",
        "CASH_POINT_UNAVAILABLE",
        "SHIPPING_TYPE_UNAVAILABLE",
      ].includes(String(error.code))) {
        invalidateQuoteAfterFailure(message);
      } else {
        quoteError.value = message;
        helper.showNotify(message, { type: "error" });
      }

      throw caught;
    } finally {
      // Una clave de quote protege solamente este intento HTTP. La siguiente
      // cotizacion, incluso con el mismo payload, debe volver a calcularse.
      clearOperationKey("order-quote");
    }
  };

  const requestQuote = (payload: QuoteRequestPayload): Promise<OrderQuoteAttributes> => {
    const quotePayload: Record<string, unknown> = {
      ...payload,
      company_id: form.value.company_id,
      breb_key_id: payload.breb_key_id ?? (form.value.breb_key_id || undefined),
      ...(payload.type === "Venta"
        ? { xcop_payment: Boolean(payload.xcop_payment) }
        : {}),
    };
    const payloadHash = quotePayloadHash(quotePayload);

    if (quoteRequestPromise) {
      if (quoteRequestPayloadHash === payloadHash) {
        return quoteRequestPromise;
      }

      // Serializa un cambio de formulario ocurrido mientras la solicitud
      // anterior sigue en curso para que una respuesta antigua no sobrescriba
      // la configuracion nueva.
      return quoteRequestPromise
        .catch(() => undefined)
        .then(() => requestQuote(payload));
    }

    requestingQuote.value = true;
    quoteRequestPayloadHash = payloadHash;
    const activePromise = performQuoteRequest(quotePayload);
    quoteRequestPromise = activePromise;

    void activePromise
      .finally(() => {
        if (quoteRequestPromise === activePromise) {
          quoteRequestPromise = null;
          quoteRequestPayloadHash = null;
          requestingQuote.value = false;
        }
      })
      .catch(() => undefined);

    return activePromise;
  };

  const resetQuote = () => {
    clearOperationKey("order-quote");
    clearOperationKey("order-create");
    quote.value = null;
    quoteError.value = null;
    quoteNeedsUserReconfirmation.value = false;
    form.value.quote_id = "";
    form.value.breb_key_id = "";
    form.value.amount_currency = "0";
    form.value.received_amount = "0";
    form.value.fee = "0";
    form.value.fee_mining_cop = "0";
    form.value.currency_price = "0";
    form.value.exchange_local = "0";
    form.value.exchange_reference = "0";
    form.value.total_exchange_local = "0";
    form.value.total_exchange_reference = "0";
    form.value.administrative_fee_order = "0";
  };

  const invalidateQuoteAfterFailure = (message: string) => {
    resetQuote();
    quoteRequiresRefresh.value = true;
    quoteError.value = message;
    helper.showNotify(message, { type: "error" });
  };

  const quoteChanged = (
    previous: OrderQuoteAttributes | null,
    next: OrderQuoteAttributes,
  ): boolean => {
    if (!previous) return false;

    return [
      "rate",
      "amount_currency",
      "network_fee_currency",
      "network_fee_crypto",
      "network_fee_local",
      "total_exchange_local",
      "total_exchange_reference",
        "net_amount_currency",
        "gross_crypto_amount",
        "final_crypto_received_amount",
        "received_amount",
        "provider_fee_currency",
        "provider_fee_local",
      "fee_policy",
      "fee_asset",
      "fee_source",
        "fee_is_estimated",
      "administrative_fee_local",
      "fee_payment_mode",
      "xcop_payment",
    ].some((field) => String(previous[field as keyof OrderQuoteAttributes] ?? "") !== String(next[field as keyof OrderQuoteAttributes] ?? ""))
      || JSON.stringify(previous.fees ?? {}) !== JSON.stringify(next.fees ?? {});
  };

  return {
    form,
    shippingType,
    quote,
    quoteError,
    quoteNeedsUserReconfirmation,
    quoteRequiresRefresh,
    creatingOrder,
    requestingQuote,
    quoteInputSide,
    quoteInputAmount,
    setQuoteInput,
    getShippingTypes,
    createOrder,
    wallets,
    walletsLoading,
    walletsError,
    getWallets,
    networkTypes,
    getNetworkTypes,
    feeOptions,
    getFeeOptions,
    requestQuote,
    resetQuote,
  };
});
