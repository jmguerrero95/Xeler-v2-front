import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import { createVuetify } from "vuetify";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import InitBuy from "../InitBuy.vue";
import CheckEfectyOrder from "../CheckBuy/components/CheckEfectyOrder.vue";

const httpMock = vi.fn();
const showNotifyMock = vi.fn();
const uploadMock = vi.fn();
const getMyOrderByTransactionMock = vi.fn();

vi.mock("@/helper", () => ({
  helperStore: () => ({
    http: httpMock,
    showNotify: showNotifyMock,
  }),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/stores/TransactionStore", () => ({
  TransactionStore: () => ({
    getMyOrderByTransaction: getMyOrderByTransactionMock,
  }),
}));

vi.mock("@/composables/useVoucherUpload", () => ({
  useVoucherUpload: vi.fn(() => ({
    canSubmit: computed(() => true),
    submitting: ref(false),
    upload: uploadMock,
  })),
}));

vi.mock("vue3-google-map", () => ({
  GoogleMap: { template: "<div data-test=\"google-map\"><slot /></div>" },
  Marker: { template: "<div data-test=\"marker\" />" },
}));

const mountInitBuy = () =>
  mount(InitBuy, {
    global: {
      plugins: [createPinia(), createVuetify()],
      mocks: {
        $t: (key: string) => key,
        $vuetify: { display: { mdAndDown: false } },
      },
      stubs: {
        CryptoCurrencySelect: true,
        PaymentMethods: true,
        CalculadoraComponent: true,
        VBtnPrimary: true,
        VRow: { template: "<div><slot /></div>" },
        VCol: { template: "<div><slot /></div>" },
        VImg: true,
        VSpacer: true,
      },
    },
  });

const baseOrder = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 88,
    attributes: {
      tranx_no: "TRX-CASH",
      type: OrderTypes.COMPRA,
      currency_id: 1,
      payment_type_id: 11,
      shipping_type_id: 1,
      account_delivery_id: 44,
      red_id: 1,
      amount_currency: "0",
      received_amount: "0",
      fee: "0",
      currency_price: "4000",
      exchange_reference: "1",
      total_exchange_reference: "25",
      exchange_local: "4000",
      total_exchange_local: "100000",
      user_id: 1,
      status_id: 1,
      can_upload_voucher: true,
      can_cancel_order: false,
      payment_deadline_at: "2026-07-10T20:00:00Z",
      voucher_deadline_at: "2026-07-10T20:00:00Z",
      server_time: "2026-07-10T19:00:00Z",
      account_delivery_type: "cash",
      xcop_payment: false,
      administrative_fee_order: "0",
      ...overrides,
    },
    relationships: {
      status: { id: 1, attributes: { name: "Pendiente", description: "" } },
      account_delivery: {
        id: 44,
        attributes: {
          description: "Punto Efecty Centro",
          beneficiary: "Xeler Go",
          coordinate: "4.710989,-74.072092",
        },
      },
      images: [],
    },
  }) as any;

describe("Buy payment methods", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    httpMock.mockReset();
    showNotifyMock.mockReset();
    uploadMock.mockReset();
    getMyOrderByTransactionMock.mockReset();
  });

  it("loads bank details by backend slug and keeps the payment type id opaque", async () => {
    httpMock.mockResolvedValue({ data: { response: [] } });

    const wrapper = mountInitBuy();

    (wrapper.vm as any).currency = { id: 1, attributes: { min_buy: "10000" } };
    (wrapper.vm as any).itemDetailSelected = { relationships: { bank: { id: 0 } } };
    await flushPromises();
    (wrapper.vm as any).paymentMethod = {
      id: 7,
      attributes: { slug: "bank", code: "bank", name: "Banco" },
    };
    await flushPromises();

    expect(httpMock).toHaveBeenCalledWith("order/flow/company-payment-banks", "get", {
      params: { payment_type_id: 7 },
    });
    expect(wrapper.text()).toContain("No hay bancos disponibles");
  });

  it("loads cash accounts by backend code without assuming a fixed id", async () => {
    httpMock.mockResolvedValue({ data: { response: [] } });

    const wrapper = mountInitBuy();

    (wrapper.vm as any).currency = { id: 1, attributes: { min_buy: "10000" } };
    await flushPromises();
    (wrapper.vm as any).paymentMethod = {
      id: 11,
      attributes: { slug: "legacy-cash", code: "cash", name: "Efecty" },
    };
    await flushPromises();

    expect(httpMock).toHaveBeenCalledWith("order/flow/company-payment-accounts", "get", {
      params: { payment_type_id: 11 },
    });
    expect(wrapper.text()).toContain("No hay puntos de efectivo disponibles");
  });

  it("renders receipt upload controls for cash buy orders and calls voucher upload", async () => {
    const wrapper = mount(CheckEfectyOrder, {
      props: { order: baseOrder() },
      global: {
        stubs: {
          UploadImageComponent: {
            template: "<div data-test=\"cash-voucher-uploader\" />",
            props: ["modelValue", "text", "disabled", "sizeImage"],
          },
          CountDown: {
            template: "<span data-test=\"cash-countdown\" />",
            props: ["deadline", "serverTime"],
          },
          VBtnPrimary: {
            template: "<button data-test=\"upload-button\" @click=\"$emit('click')\"><slot /></button>",
            emits: ["click"],
          },
          CancelOrder: true,
          VAlert: { template: "<div><slot /></div>" },
          VRow: { template: "<div><slot /></div>" },
          VCol: { template: "<div><slot /></div>" },
          VSpacer: true,
        },
      },
    });

    expect(wrapper.find("[data-test='cash-voucher-uploader']").exists()).toBe(true);
    expect(wrapper.find("[data-test='cash-countdown']").exists()).toBe(true);

    await wrapper.get("[data-test='upload-button']").trigger("click");

    expect(uploadMock).toHaveBeenCalledTimes(1);
  });
});
