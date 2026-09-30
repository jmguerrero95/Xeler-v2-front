import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, defineStore, setActivePinia } from "pinia";
import { defineComponent, h } from "vue";

const state = vi.hoisted(() => ({
  registrationError: null as unknown,
  requestData: null as Record<string, unknown> | null,
  turnstileToken: "synthetic-turnstile-token",
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: "<a><slot /></a>" },
}));

vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock("@/services/turnstile", () => ({
  renderRegistrationTurnstile: vi.fn(async (_container: HTMLElement, onToken: (token: string) => void) => {
    onToken(state.turnstileToken);
    return "registration-widget";
  }),
  resetRegistrationTurnstile: vi.fn(),
  removeRegistrationTurnstile: vi.fn(),
}));
vi.mock("vue3-toastify", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/helper", async () => {
  const { defineStore } = await import("pinia");
  return {
    helperStore: defineStore("registration-phone-ux", {
      state: () => ({
        formRef: { validate: async () => ({ valid: true }) },
      }),
      actions: {
        http(_endpoint: string, _method: string, options: { data: Record<string, unknown> }) {
          state.requestData = options.data;
          return Promise.reject(state.registrationError);
        },
      },
    }),
  };
});

import Register from "./Register.vue";
import { toast } from "vue3-toastify";
import { normalizeApiError } from "@/services/apiErrors";

const box = { template: "<div><slot /></div>" };
const button = {
  props: ["disabled"],
  emits: ["click"],
  template: "<button :disabled='disabled' @click='$emit(\"click\", $event)'><slot /></button>",
};
const input = {
  props: ["modelValue", "name", "placeholder", "type"],
  emits: ["update:modelValue"],
  template: "<input :name='name' :value='modelValue' @input='$emit(\"update:modelValue\", $event.target.value)' />",
};
const form = defineComponent({
  setup(_, { slots, expose }) {
    expose({ validate: async () => ({ valid: true }) });
    return () => h("form", slots.default?.({ isValid: true }));
  },
});
const tel = {
  props: ["modelValue", "name"],
  emits: ["update:modelValue", "phone", "phoneCode", "isValid"],
  template: "<input name='phone' :value='modelValue' @input='$emit(\"update:modelValue\", $event.target.value)' />",
};

const global: any = {
  config: {
    globalProperties: {
      $t: (key: string) => key,
    },
  },
  stubs: {
    RouterLink: { template: "<a><slot /></a>" },
    VToolbar: box,
    VToolbarTitle: box,
    VForm: form,
    VRow: box,
    VCol: box,
    VCheckbox: box,
    VAlert: box,
    VBtnPrimary: button,
    InputComponent: input,
    TelInput: tel,
  },
};

const normalized = (validationErrors: Record<string, string[]> = {}) => ({
  status: 422,
  message: "Validation failed.",
  messages: ["Validation failed.", ...Object.values(validationErrors).flat()],
  validationErrors,
  isNetworkError: false,
  original: {},
});

const submit = async (error: unknown) => {
  state.registrationError = error;
  const wrapper = mount(Register, { global });
  const setup = (wrapper.vm.$ as any).setupState as Record<string, any>;
  setup.isPhoneValid = true;
  setup.accepTerms = true;
  setup.form.phone = "3000000";
  setup.form.code_phone = "57";
  await flushPromises();
  await wrapper.find("button").trigger("click");
  await flushPromises();
  return wrapper;
};

beforeEach(() => {
  setActivePinia(createPinia());
  state.registrationError = null;
  state.requestData = null;
  state.turnstileToken = "synthetic-turnstile-token";
  vi.clearAllMocks();
});

describe("registro público: errores 422 visibles y específicos", () => {
  it("envía el token Turnstile estándar y bloquea el envío cuando no hay token", async () => {
    const wrapper = await submit(normalized({ phone: ["Este número de teléfono ya está registrado."] }));

    expect(state.requestData?.["cf-turnstile-response"]).toBe("synthetic-turnstile-token");
    wrapper.unmount();

    state.turnstileToken = "";
    state.requestData = null;
    const noToken = mount(Register, { global });
    const setup = (noToken.vm.$ as any).setupState as Record<string, any>;
    setup.isPhoneValid = true;
    setup.accepTerms = true;
    setup.form.phone = "3000000";
    setup.form.code_phone = "57";
    await flushPromises();
    expect(noToken.find("button").attributes("disabled")).toBeDefined();
    expect(state.requestData).toBeNull();
    noToken.unmount();
  });

  it("muestra el teléfono duplicado junto al campo y nunca el mensaje interno", async () => {
    const wrapper = await submit(normalized({ phone: ["Este número de teléfono ya está registrado."] }));

    expect(wrapper.get('[data-test="registration-error-phone"]').text()).toBe("Este número de teléfono ya está registrado.");
    expect(wrapper.text()).not.toContain("Validation failed.");
    expect(wrapper.text()).not.toContain("error validation");
    expect(toast.error).toHaveBeenCalledWith("Este número de teléfono ya está registrado.");
    wrapper.unmount();
  });

  it("prioriza errores específicos de correo y contraseña", async () => {
    const wrapper = await submit(normalized({
      email: ["Este correo electrónico ya está registrado."],
      password: ["La contraseña no cumple los requisitos."],
    }));

    expect(wrapper.get('[data-test="registration-error-email"]').text()).toBe("Este correo electrónico ya está registrado.");
    expect(wrapper.get('[data-test="registration-error-password"]').text()).toBe("La contraseña no cumple los requisitos.");
    expect(wrapper.get('[data-test="registration-validation-summary"]').text()).toContain("Este correo electrónico ya está registrado.");
    expect(wrapper.get('[data-test="registration-validation-summary"]').text()).toContain("La contraseña no cumple los requisitos.");
    wrapper.unmount();
  });

  it("conserva múltiples mensajes específicos en español", async () => {
    const wrapper = await submit(normalized({
      phone: ["Este número de teléfono ya está registrado."],
      email: ["Este correo electrónico ya está registrado."],
      password_confirmation: ["La confirmación de contraseña no coincide."],
    }));

    const summary = wrapper.get('[data-test="registration-validation-summary"]').text();
    expect(summary).toContain("Este número de teléfono ya está registrado.");
    expect(summary).toContain("Este correo electrónico ya está registrado.");
    expect(summary).toContain("La confirmación de contraseña no coincide.");
    wrapper.unmount();
  });

  it("usa el fallback en español cuando un 422 no entrega errores específicos", async () => {
    const wrapper = await submit(normalized({}));

    expect(wrapper.find('[data-test="registration-validation-summary"]').exists()).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Revisa los datos ingresados e inténtalo nuevamente.");
    expect(wrapper.text()).not.toContain("Validation failed.");
    wrapper.unmount();
  });

  it("usa data.errors como fallback específico sin filtrar los textos internos", async () => {
    const wrapper = await submit(normalizeApiError({
      response: {
        status: 422,
        data: {
          message: "Validation failed.",
          data: { errors: ["Este número de teléfono ya está registrado."] },
        },
        headers: {},
      },
    }));

    expect(wrapper.get('[data-test="registration-validation-summary"]').text()).toContain("Este número de teléfono ya está registrado.");
    expect(toast.error).toHaveBeenCalledWith("Este número de teléfono ya está registrado.");
    expect(wrapper.text()).not.toContain("Validation failed.");
    wrapper.unmount();
  });
});
