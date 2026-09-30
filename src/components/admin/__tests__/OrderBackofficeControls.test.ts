import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { runAction } = vi.hoisted(() => ({ runAction: vi.fn() }));
const challenge = vi.hoisted(() => ({ callback: { fn: async () => {} }, modal: false, requestedScope: "" }));
vi.mock("@/stores/TwoFactorAuthStore", () => ({ TwoFactorAuthStore: () => challenge }));
vi.mock("@/services/orderBackofficeApi", () => ({
  runOrderAssignmentAction: runAction,
}));
import OrderBackofficeControls from "../OrderBackofficeControls.vue";

const stubs = {
  VAlert: { template: "<div><slot /></div>" },
  VBtn: {
    props: ["disabled"],
    emits: ["click"],
    template:
      "<button :disabled='disabled' @click='$emit(`click`)'><slot /></button>",
  },
  VDialog: {
    props: ["modelValue"],
    template: "<div v-if='modelValue'><slot /></div>",
  },
  VCard: { template: "<div><slot /></div>" },
  VCardText: { template: "<div><slot /></div>" },
  VCardActions: { template: "<div><slot /></div>" },
  VTextField: { template: "<input />" },
  VTextarea: {
    props: ["modelValue"],
    emits: ["update:modelValue"],
    template:
      "<textarea data-test='reason' :value='modelValue' @input='$emit(`update:modelValue`, $event.target.value)' />",
  },
};

describe("OrderBackofficeControls", () => {
  beforeEach(() => { runAction.mockClear().mockResolvedValue({}); challenge.modal = false; });

  it("renders only authorized actions and takes an order", async () => {
    const wrapper = mount(OrderBackofficeControls, {
      props: { orderId: 8, actions: { can_take: true } },
      global: { stubs },
    });
    expect(wrapper.find('[data-test="take"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="release"]').exists()).toBe(false);
    await wrapper.get('[data-test="take"]').trigger("click");
    expect(runAction).not.toHaveBeenCalled();
    expect(challenge.requestedScope).toBe("finance.order_admin");
    await challenge.callback.fn();
    expect(runAction).toHaveBeenCalledWith(8, "take", {});
  });

  it("requires a reason and exposes read-only assignment mode", async () => {
    const wrapper = mount(OrderBackofficeControls, {
      props: {
        orderId: 9,
        actions: { can_release: true, read_only_by_assignment: true },
      },
      global: { stubs },
    });
    expect(wrapper.text()).toContain("Modo lectura");
    await wrapper.get('[data-test="release"]').trigger("click");
    expect(
      wrapper.get('[data-test="confirm"]').attributes("disabled"),
    ).toBeDefined();
    await wrapper.get('[data-test="reason"]').setValue("Correccion operativa");
    await wrapper.get('[data-test="confirm"]').trigger("click");
    expect(runAction).not.toHaveBeenCalled();
    expect(challenge.requestedScope).toBe("finance.order_admin");
    await challenge.callback.fn();
    expect(runAction).toHaveBeenCalledWith(9, "release", {
      reason: "Correccion operativa",
      target_admin_id: undefined,
    });
  });
});
