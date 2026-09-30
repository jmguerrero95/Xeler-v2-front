import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import vuetify from "@/plugins/vuetify";
import CryptoDepositPanel from "../CryptoDepositPanel.vue";

const baseOrder = {
  id: 1,
  attributes: {
    amount_currency: "10.000000",
    address_send: "",
    address_assignment_pending: true,
    manual_review_reason: "underpaid",
    manual_review_code: "underpaid",
    manual_review_action_hint: "Verificar monto recibido antes de acreditar.",
    crypto_txid: null,
    crypto: {
      address: null,
      currency: "USDT",
      network: "TRC20",
      provider: "cryptocurrencyapi",
      status: "manual_review",
      address_status: "assigned",
      confirmations: 0,
      required_confirmations: 20,
      amount_detected: "9.500000",
      txid: null,
      provider_reference: "provider-ref-1",
    },
  },
  relationships: {
    currency: {
      attributes: {
        abbreviation: "USDT",
        name: "USDT",
      },
    },
    red: {
      attributes: {
        name: "TRC20",
      },
    },
  },
};

describe("CryptoDepositPanel", () => {
  it("shows address pending state without rendering an empty QR", () => {
    const wrapper = mount(CryptoDepositPanel, {
      props: {
        order: baseOrder as any,
      },
      global: {
        plugins: [vuetify],
        stubs: {
          QrcodeVue: { template: "<div data-test='qr-stub' />" },
          CopyComponent: { template: "<button />" },
        },
        mocks: {
          $vuetify: {
            display: {
              smAndDown: false,
            },
          },
        },
      },
    });

    expect(wrapper.text()).toContain("Preparando direccion de deposito...");
    expect(wrapper.find("[data-test='qr-stub']").exists()).toBe(false);
  });

  it("shows manual review reason and actionable hint", () => {
    const wrapper = mount(CryptoDepositPanel, {
      props: {
        order: baseOrder as any,
      },
      global: {
        plugins: [vuetify],
        stubs: {
          QrcodeVue: { template: "<div data-test='qr-stub' />" },
          CopyComponent: { template: "<button />" },
        },
        mocks: {
          $vuetify: {
            display: {
              smAndDown: false,
            },
          },
        },
      },
    });

    expect(wrapper.text()).toContain("Motivo: underpaid");
    expect(wrapper.text()).toContain("Verificar monto recibido antes de acreditar.");
  });

  it("uses the backend TRC20 QR and shows aggregate variance and payout evidence without provider data", () => {
    const order = structuredClone(baseOrder) as any;
    order.attributes.address_assignment_pending = false;
    order.attributes.deposit_qr_payload = "TDepositAddress123";
    order.attributes.expected_deposit_amount = "10.000000";
    order.attributes.detected_crypto_amount = "10.500000";
    order.attributes.confirmed_crypto_amount = "10.500000";
    order.attributes.variance_message = "El monto recibido fue superior al esperado. El valor final a pagar fue actualizado.";
    order.attributes.manual_review = false;
    order.attributes.fiat_payout_status = "sent";
    order.attributes.final_fiat_payout = "39000";
    order.attributes.payment_reference = "REF-001";
    order.attributes.payment_sent_at = "2026-07-15T10:00:00-05:00";
    order.attributes.sale_payment_proof_download_url = "/proof/signed";
    order.attributes.crypto.address = "TDepositAddress123";
    order.attributes.crypto.status = "confirmed";
    order.attributes.crypto.confirmations = 20;

    const wrapper = mount(CryptoDepositPanel, {
      props: { order },
      global: {
        plugins: [vuetify],
        stubs: {
          QrcodeVue: { props: ["value"], template: "<div data-test='qr-stub'>{{ value }}</div>" },
          CopyComponent: { template: "<button />" },
        },
        mocks: { $vuetify: { display: { smAndDown: false } } },
      },
    });

    expect(wrapper.get("[data-test='qr-stub']").text()).toBe("TDepositAddress123");
    expect(wrapper.text()).toContain("No envies USDT por ERC20");
    expect(wrapper.text()).toContain("Confirmado: 10.500000");
    expect(wrapper.text()).toContain("Referencia: REF-001");
    expect(wrapper.text()).not.toContain("cryptocurrencyapi");
  });
});
