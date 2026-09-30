import { flushPromises, mount } from "@vue/test-utils";
import { nextTick, ref } from "vue";
import { describe, expect, it, vi } from "vitest";

const order = ref<any>({
  id: 44,
  attributes: {
    type: "Venta",
    can_view_sell_beneficiary: true,
    payment_account_snapshot: {
      beneficiary_name: "Snapshot Titular",
      beneficiary_document_masked: "******1234",
      account_number_masked: "******9876",
      bank_name: "Banco Snapshot",
      account_type: "Ahorros",
    },
  },
  relationships: {
    account_delivery: {
      attributes: {
        beneficiary: "Relacion Mutable",
        identification_document: "999999999",
        account_number: "111111111",
      },
      relationships: {},
    },
  },
});
const http = vi.fn().mockResolvedValue({ data: { data: { beneficiary_name: "Snapshot Titular", account_number: "000009876" } } });
const twoFactor: any = { modal: false, newFlow: false, callback: null, code: "123456" };

vi.mock("pinia", async (original) => ({ ...(await original<typeof import("pinia")>()), storeToRefs: () => ({ order }) }));
vi.mock("@/stores/TransactionStore", () => ({ TransactionStore: () => ({}) }));
vi.mock("@/stores/TwoFactorAuthStore", () => ({ TwoFactorAuthStore: () => twoFactor }));
vi.mock("@/helper", () => ({
  helperStore: () => ({ http }),
  formatNumber: (value: unknown) => String(value),
  itemHaveImages: () => false,
}));

import DetailAccountSell from "../TransactionDetail/DetailAccountSell.vue";

describe("DetailAccountSell", () => {
  it("uses the immutable masked snapshot and reveals private data only through the 2FA action", async () => {
    http.mockResolvedValue({ data: { data: { beneficiary_name: "Snapshot Titular", account_number: "000009876" } } });
    const wrapper = mount(DetailAccountSell, {
      global: {
        stubs: {
          VImg: true,
          VBtn: { template: "<button @click='$emit(`click`)'><slot /></button>" },
          VRow: { template: "<div><slot /></div>" },
          VCol: { template: "<div><slot /></div>" },
          VTooltip: { template: "<div><slot name='activator' :props='{}' /><slot /></div>" },
          VIcon: true,
        },
      },
    });

    expect(wrapper.text()).toContain("Snapshot Titular");
    expect(wrapper.text()).toContain("******9876");
    expect(wrapper.text()).not.toContain("Relacion Mutable");
    expect(wrapper.text()).not.toContain("111111111");

    await wrapper.get("button").trigger("click");
    expect(twoFactor.modal).toBe(true);
    await twoFactor.callback.fn();
    await flushPromises();

    expect(http).toHaveBeenCalledWith("admin/crypto/orders/44/sell-beneficiary", "post", expect.anything(), "", false, { financialAction: true });
    expect(wrapper.text()).toContain("000009876");
    order.value = {
      id: 45,
      attributes: {
        type: "Venta",
        can_view_sell_beneficiary: true,
        payment_account_snapshot: {
          beneficiary_name: "Titular B",
          account_number_masked: "******2222",
        },
      },
    };
    await nextTick();

    expect(wrapper.text()).toContain("Titular B");
    expect(wrapper.text()).toContain("******2222");
    expect(wrapper.text()).not.toContain("000009876");
  });
});
