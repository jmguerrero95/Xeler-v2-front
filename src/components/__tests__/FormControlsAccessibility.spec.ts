import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import InputComponent from "@/components/InputComponent.vue";
import SelectComponent from "@/components/SelectComponent.vue";

const labelStub = {
  props: ["for"],
  template: '<label :for="$props.for"><slot /></label>',
};

const responsiveStub = {
  template: "<div><slot /></div>",
};

const testI18n = () => createI18n({ legacy: false, locale: "es", messages: { es: {} } });

describe("shared form controls accessibility", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("associates the visible InputComponent label with its real input", () => {
    const wrapper = mount(InputComponent, {
      props: {
        modelValue: "",
        name: "Alias",
        idElement: "wallet-alias",
      },
      global: {
        plugins: [createPinia(), testI18n()],
        stubs: {
          VLabel: labelStub,
          VResponsive: responsiveStub,
          VTextField: {
            props: ["id"],
            template: '<input :id="id" />',
          },
        },
      },
    });

    expect(wrapper.get("label").attributes("for")).toBe("wallet-alias");
    expect(wrapper.get("input").attributes("id")).toBe("wallet-alias");
  });

  it("associates the visible SelectComponent label with its combobox", () => {
    const wrapper = mount(SelectComponent, {
      props: {
        modelValue: "",
        name: "Monedas",
        id: "wallet-currency",
        items: [],
        itemTitle: "attributes.name",
        itemValue: "id",
      },
      global: {
        plugins: [createPinia(), testI18n()],
        stubs: {
          VLabel: labelStub,
          VResponsive: responsiveStub,
          VAutocomplete: {
            props: ["id"],
            template: '<input role="combobox" :id="id" />',
          },
        },
      },
    });

    expect(wrapper.get("label").attributes("for")).toBe("wallet-currency");
    expect(wrapper.get('[role="combobox"]').attributes("id")).toBe("wallet-currency");
  });
});
