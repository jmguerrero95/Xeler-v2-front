import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { VueTelInput } from "vue-tel-input";
import TelInput from "@/components/TelInput.vue";

describe("TelInput", () => {
  it("renders the actual telephone control instead of the plugin wrapper", () => {
    const wrapper = mount(TelInput, {
      props: {
        modelValue: "",
        name: "Telefono",
        placeholder: "Telefono",
        required: true,
      },
      global: {
        stubs: {
          VLabel: { template: "<label><slot /></label>" },
        },
      },
    });

    const input = wrapper.get('input[name="phone"]');
    expect(input.attributes("autocomplete")).toBe("tel");
    expect(input.attributes("inputmode")).toBe("tel");
  });

  it("wraps validation errors inside the available mobile width", async () => {
    const wrapper = mount(TelInput, {
      props: {
        modelValue: "",
        name: "Telefono",
        placeholder: "Telefono",
        required: true,
      },
      global: {
        stubs: {
          VLabel: { template: '<label v-bind="$attrs"><slot /></label>' },
        },
      },
    });

    wrapper.findComponent(VueTelInput).vm.$emit("onInput", "", {
      valid: false,
      countryCallingCode: "57",
      nationalNumber: "",
      country: { name: "Colombia", iso2: "CO", dialCode: "57" },
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.get(".tel-input-error").text()).toContain("obligatorio");
  });
});
