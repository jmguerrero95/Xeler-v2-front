import { mount } from "@vue/test-utils";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CheckBuy from "../CheckBuy/CheckBuy.vue";

const tracking = vi.hoisted(() => ({
  order: null as any,
  loading: false,
  error: "",
}));

vi.mock("@/composables/useOrderTracking", async () => {
  const { computed } = await import("vue");

  return {
    useOrderTracking: () => ({
      order: computed(() => tracking.order),
      loading: computed(() => tracking.loading),
      error: computed(() => tracking.error),
    }),
  };
});

vi.mock("../CheckBuy/components/CheckBankOrder.vue", () => ({
  default: { template: "<div data-test=\"check-bank\">bank</div>", props: ["order"] },
}));

vi.mock("../CheckBuy/components/CheckEfectyOrder.vue", () => ({
  default: { template: "<div data-test=\"check-cash\">cash</div>", props: ["order"] },
}));

vi.mock("../CheckBuy/components/CheckOtherOrder.vue", () => ({
  default: { template: "<div data-test=\"check-other\">other</div>", props: ["order"] },
}));

const orderWithPayment = (id: number, attributes: Record<string, unknown>) => ({
  id: 1,
  attributes: { tranx_no: "TNX-CHECK-BUY" },
  relationships: {
    payment: {
      id,
      attributes,
    },
  },
});

const mountCheckBuy = () =>
  mount(CheckBuy, {
    props: { numTransaction: "TNX-CHECK-BUY" },
  });

describe("CheckBuy payment method resolution", () => {
  beforeEach(() => {
    tracking.order = null;
    tracking.loading = false;
    tracking.error = "";
  });

  it("renders bank screen by payment code even when id is 77", () => {
    tracking.order = orderWithPayment(77, { code: "bank", slug: "bank" });

    const wrapper = mountCheckBuy();

    expect(wrapper.find("[data-test='check-bank']").exists()).toBe(true);
    expect(wrapper.find("[data-test='check-cash']").exists()).toBe(false);
    expect(wrapper.find("[data-test='check-other']").exists()).toBe(false);
  });

  it("renders cash screen by payment code even when id is 88", () => {
    tracking.order = orderWithPayment(88, { code: "cash", slug: "cash" });

    const wrapper = mountCheckBuy();

    expect(wrapper.find("[data-test='check-cash']").exists()).toBe(true);
  });

  it("renders other screen by payment code even when id is 99", () => {
    tracking.order = orderWithPayment(99, { code: "other", slug: "other" });

    const wrapper = mountCheckBuy();

    expect(wrapper.find("[data-test='check-other']").exists()).toBe(true);
  });

  it("falls back to slug and shows safe message for unknown payment methods", () => {
    tracking.order = orderWithPayment(123, { slug: "unknown-method" });

    const wrapper = mountCheckBuy();

    expect(wrapper.text()).toContain(
      "No se pudo identificar el método de pago de esta orden. Contacta soporte.",
    );
    expect(wrapper.find("[data-test='check-bank']").exists()).toBe(false);
    expect(wrapper.find("[data-test='check-cash']").exists()).toBe(false);
    expect(wrapper.find("[data-test='check-other']").exists()).toBe(false);
  });

  it("does not use the legacy constant for component resolution", () => {
    const legacyConstant = ["PAYMENT", "METHODS", "AVAILABLE"].join("_");
    const source = readFileSync(
      resolve(process.cwd(), "src/views/user/Compra/CheckBuy/CheckBuy.vue"),
      "utf8",
    );

    expect(source).not.toContain(legacyConstant);
    expect(source).not.toContain("relationships?.payment?.id");
  });
});
