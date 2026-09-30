import { describe, expect, it } from "vitest";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import { buildOrderTimeline } from "../timeline";
import type { Order } from "@/interfaces/Order/Order.model";

const makeOrder = (overrides: Record<string, any> = {}): Order => {
  const attributes = {
    user_id: 10,
    tranx_no: "TNX000001",
    status_id: 1,
    currency_id: 1,
    payment_type_id: 2,
    shipping_type_id: "",
    account_delivery_id: "",
    type: OrderTypes.VENTA,
    red_id: 1,
    amount_currency: "10",
    received_amount: "10",
    fee: "0",
    currency_price: "4000",
    exchange_reference: "1",
    total_exchange_reference: "10",
    exchange_local: "4000",
    total_exchange_local: "40000",
    account_delivery_type: "bank",
    xcop_payment: false,
    administrative_fee_order: "0",
    is_terminal: false,
    address_assignment_pending: true,
    sale_payment_proof_uploaded: false,
    underpaid: false,
    overpaid: false,
    late_deposit: false,
    crypto: {
      status: null,
      address: null,
      provider_reference: null,
      txid: null,
      confirmations: 0,
      required_confirmations: 20,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    ...(overrides.attributes ?? {}),
  };

  const relationships = {
    status: {
      id: 1,
      attributes: {
        name: "Orden Recibida",
        description: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    ...(overrides.relationships ?? {}),
  };

  return {
    id: 1,
    attributes,
    relationships,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    ...overrides,
  } as Order;
};

describe("buildOrderTimeline", () => {
  it("shows real sell progression without inventing deadlines", () => {
    const timeline = buildOrderTimeline(
      makeOrder({
        attributes: {
          type: OrderTypes.VENTA,
          address_assignment_pending: true,
          crypto: {
            status: "confirming",
            address: "TDepositAddress123",
            provider_reference: "provider-ref-1",
            txid: null,
            confirmations: 3,
            required_confirmations: 20,
          },
          sale_payment_proof_uploaded: true,
        },
      })
    );

    expect(timeline.map((item) => item.text)).toEqual([
      "Orden creada",
      "Direccion asignada",
      "Confirmando en red",
      "Comprobante registrado",
      "Pendiente",
    ]);
  });

  it("covers sell manual review and deposit exceptions", () => {
    const manualReview = buildOrderTimeline(
      makeOrder({
        attributes: {
          manual_review_reason: "address_assignment_failed",
        },
        relationships: {
          status: {
            id: 2,
            attributes: {
              name: "Revision manual cripto",
              description: "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        },
      })
    );

    const underpaid = buildOrderTimeline(
      makeOrder({
        attributes: {
          underpaid: true,
        },
      })
    );

    expect(manualReview.at(-1)?.text).toBe("Manual review");
    expect(underpaid.at(-1)?.text).toBe("Deposito menor al esperado");
  });

  it("covers buy voucher and payout submitted states", () => {
    const timeline = buildOrderTimeline(
      makeOrder({
        attributes: {
          type: OrderTypes.COMPRA,
          shipping_type_id: 1,
          voucher_uploaded_at: "2026-07-05T10:00:00Z",
          crypto: {
            status: "submitted",
            address: null,
            provider_reference: "payout-ref-1",
            txid: null,
            confirmations: 0,
            required_confirmations: 0,
          },
        },
        relationships: {
          status: {
            id: 3,
            attributes: {
              name: "Comprobante aprobado",
              description: "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        },
      })
    );

    expect(timeline.map((item) => item.text)).toEqual([
      "Orden creada",
      "Comprobante aprobado",
      "Payout enviado al provider",
      "Pendiente",
    ]);
  });
});
