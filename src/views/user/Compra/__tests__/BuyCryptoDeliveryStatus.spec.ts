import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import BuyCryptoDeliveryStatus from "../CheckBuy/components/BuyCryptoDeliveryStatus.vue";

const makeOrder = (overrides: Record<string, unknown> = {}) => ({
  id: 91,
  attributes: {
    tranx_no: "BUY-91",
    status_name: "Comprobante aprobado",
    network: "BTC",
    address_send: "bc1qcustomer",
    final_crypto_received_amount: "0.01000000",
    is_terminal: false,
    manual_review: false,
    crypto: {
      currency: "BTC",
      network: "BTC",
      address: "bc1qcustomer",
      payout_status: "pending",
      confirmations: 0,
      required_confirmations: 1,
      final_crypto_received_amount: "0.01000000",
      txid: null,
      explorer_url: null,
      can_view_txid: false,
    },
    ...overrides,
  },
  relationships: {
    currency: { attributes: { abbreviation: "BTC" } },
  },
});

const mountStatus = (order: ReturnType<typeof makeOrder>) => mount(BuyCryptoDeliveryStatus, {
  props: { order: order as any },
  global: {
    stubs: {
      VCard: { template: "<section><slot /></section>" },
      VIcon: { template: "<i><slot /></i>" },
      VProgressLinear: { template: "<div data-test='progress' />" },
      VBtn: { props: ["href"], template: "<a :href='href'><slot /></a>" },
    },
  },
});

describe("buy crypto delivery status", () => {
  it("shows payment approved and payout pending without freezing", () => {
    const wrapper = mountStatus(makeOrder());
    expect(wrapper.text()).toContain("Pago confirmado");
    expect(wrapper.text()).toContain("Preparando el envio de tu criptomoneda");
    expect(wrapper.find("[data-test='progress']").exists()).toBe(true);
  });

  it("supports provider reference state without requiring a txid", () => {
    const order = makeOrder({ crypto: { ...makeOrder().attributes.crypto, payout_status: "submitted" } });
    const wrapper = mountStatus(order);
    expect(wrapper.text()).toContain("Envio solicitado");
    expect(wrapper.text()).toContain("esperando el TXID");
    expect(wrapper.find("a").exists()).toBe(false);
  });

  it("shows txid, confirmations and only a backend-provided explorer link", () => {
    const order = makeOrder({
      crypto: {
        ...makeOrder().attributes.crypto,
        payout_status: "confirming",
        txid: "a".repeat(64),
        confirmations: 1,
        required_confirmations: 2,
        explorer_url: "https://mempool.space/tx/" + "a".repeat(64),
        can_view_txid: true,
      },
    });
    const wrapper = mountStatus(order);
    expect(wrapper.text()).toContain("Transaccion enviada");
    expect(wrapper.text()).toContain("Confirmando 1 de 2");
    expect(wrapper.find("a").attributes("href")).toContain("mempool.space/tx/");
  });

  it("does not create an explorer link for an empty txid", () => {
    const order = makeOrder({
      crypto: { ...makeOrder().attributes.crypto, explorer_url: "https://example.test/unsafe", can_view_txid: true },
    });
    expect(mountStatus(order).find("a").exists()).toBe(false);
  });

  it("shows a neutral manual review message without operational causes", () => {
    const wrapper = mountStatus(makeOrder({ manual_review: true }));
    expect(wrapper.text()).toContain("Tu operacion esta siendo revisada antes del envio");
    expect(wrapper.text()).not.toMatch(/wallet|provider|bitgo|cryptocurrencyapi|usd 500|liquidez|circuit/i);
  });

  it("shows the final state and stops the progress indicator", () => {
    const wrapper = mountStatus(makeOrder({
      is_terminal: true,
      crypto: { ...makeOrder().attributes.crypto, payout_status: "confirmed", confirmations: 1 },
    }));
    expect(wrapper.text()).toContain("Compra completada");
    expect(wrapper.find("[data-test='progress']").exists()).toBe(false);
  });

  it("never renders internal payout details", () => {
    const wrapper = mountStatus(makeOrder());
    expect(wrapper.text()).not.toMatch(/wallet|provider_reference|saldo|limite automatico|automatic payout/i);
  });
});
