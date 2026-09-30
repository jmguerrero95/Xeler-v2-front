import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import vuetify from "@/plugins/vuetify";
import type { Order } from "@/interfaces/Order/Order.model";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import { buildOrderTimeline } from "../../timeline";
import ConfirmOrder from "../ConfirmOrder.vue";

const makeOrder = (attributes: Record<string, unknown> = {}, statusName = "Orden recibida"): Order => ({
  id: 4001,
  attributes: {
    tranx_no: "L4-SELL-4001",
    type: OrderTypes.VENTA,
    payment_method_code: "bank",
    can_cancel_order: false,
    is_terminal: false,
    address_assignment_pending: false,
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
      required_confirmations: 1,
    },
    ...attributes,
  },
  relationships: {
    status: {
      id: 1,
      attributes: {
        name: statusName,
      },
    },
  },
}) as Order;

describe("Lote 4 sell frontend contracts", () => {
  it("does not report fiat payment as completed for a cancelled terminal sell", () => {
    const timeline = buildOrderTimeline(makeOrder({ is_terminal: true }, "Orden cancelada"));

    expect(timeline.find((item) => item.key === "fiat")?.text).toBe("Pago fiat pendiente");
    expect(timeline.find((item) => item.key === "final")?.text).toBe("Cancelada");
    expect(timeline.some((item) => item.text === "Pago completado")).toBe(false);
  });

  it("renders the immutable public cash location name without private location data", () => {
    const order = makeOrder({ payment_method_code: "cash" });
    order.relationships!.account_delivery = {
      id: null,
      type: "masked_payment_account",
      attributes: {
        location_name: "Punto QA Centro",
        beneficiary: "Usuario QA",
      },
    } as any;

    const wrapper = mount(ConfirmOrder, {
      props: { order },
      global: {
        plugins: [vuetify],
        stubs: {
          CryptoDepositPanel: true,
          PreviewOrder: true,
          CancelOrder: true,
        },
        mocks: {
          $vuetify: { display: { smAndDown: false } },
        },
      },
    });

    expect(wrapper.text()).toContain("Punto QA Centro");
    expect(wrapper.text()).toContain("Responsable: Usuario QA");
  });
});
