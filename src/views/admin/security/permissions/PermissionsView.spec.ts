import { afterEach, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import axios from "axios";
import { apiClient } from "@/services/apiClient";
import { clearFinancialStepUp, takeFinancialStepUp } from "@/services/securityStepUp";
import type { FinancialStepUpScope } from "@/services/securityStepUp";

vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock("@/stores/UserStore", () => ({ UserStore: () => ({ hasPermission: () => true, clearAuth: vi.fn() }) }));
vi.mock("@/helper", async () => {
  const { defineStore } = await import("pinia");
  const { apiClient } = await import("@/services/apiClient");
  return { helperStore: defineStore("permissions07c", {
    state: () => ({
      url: "", formCrud: {} as Record<string, string>, item: { id: 1 },
      items: [{ id: 1, attributes: { name: "Permiso de prueba", guard_name: "sanctum", deleted_at: null } }],
      clickIn: "Create", openModalCrud: false, pagination: { currentPage: 1, total: 1 },
      methodVerificatedStatus: null,
      formRef: { validate: async () => ({ valid: true }), reset: () => {} },
    }),
    actions: {
      canAction() { return true; }, index() {}, showNotify() {},
      http(url: string, method = "get", options: any = {}, _message = "", _silent = false, security: any = {}) {
        return apiClient.request(method as any, url, { ...options, ...security });
      },
      create(data: unknown, _notify: boolean, scope: FinancialStepUpScope) {
        return apiClient.post(this.url, data, { financialScope: scope });
      },
    },
  }), formatNumber: (value: unknown) => String(value) };
});

import PermissionsView from "./PermissionsView.vue";
import Crud from "@/components/global/CrudComponent.vue";
import Table from "@/components/global/TableComponent.vue";
import Challenge from "@/components/TwoFactorAuth.vue";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";
import { helperStore } from "@/helper";

// Reuse 07B's lightweight presentation stubs; business components/guard/store/client remain real.
const box = { template: "<div><slot/><slot name='content'/><slot name='actions'/></div>" };
const dialog = { props: ["dialog"], template: "<section v-if='dialog'><slot/><slot name='content'/><slot name='actions'/></section>" };
const button = { props: ["disabled"], emits: ["click"], template: "<button :disabled='disabled' @click='$emit(\"click\", $event)'><slot/></button>" };
const input = { props: ["modelValue", "type"], emits: ["update:modelValue"], template: "<input :type='type' :value='modelValue' @input='$emit(\"update:modelValue\", $event.target.value)'/>" };
const global: any = {
  stubs: {
    DialogBase: dialog, DialogGlobal: dialog, DialogConfirm: true, FormComponent: true,
    SearchInputComponentVue: true, InputComponent: input, VBtn: button, VBtnPrimary: button,
    VTable: { template: "<table><slot/></table>" }, VRow: box, VCol: box,
    VIcon: true, VChip: box, VMenu: box, VList: box, VListItem: box, VListItemTitle: box, VPagination: true,
  },
  mocks: { $t: (key: string) => key, $vuetify: { display: { xs: false } } },
};

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); clearFinancialStepUp(); localStorage.clear(); });

it("monta permisos como listado hermano de CRUD y sólo envía la mutación tras admin.security, nunca al cancelar", async () => {
  setActivePinia(createPinia()); clearFinancialStepUp(); localStorage.clear();
  vi.stubEnv("VITE_API_URL", "https://api.example.test/api");
  const requests: any[] = [];
  vi.spyOn(axios, "request").mockImplementation(async (config: any) => {
    requests.push(config);
    return { data: config.url === "security/step-up" ? { data: { grant: "permissions-test-grant" } } : { data: {} }, status: 200, headers: {}, config } as any;
  });
  const view = mount(PermissionsView, { global });
  const challenge = mount(Challenge, { global });
  await flushPromises();
  const crud = view.getComponent(Crud);
  const table = view.getComponent(Table);
  expect(view.get("table tbody").text()).toContain("Permiso de prueba");
  expect(table.vm.$parent?.$).toBe(view.vm.$);
  expect(crud.findComponent(Table).exists()).toBe(false);
  expect(crud.vm.$slots.default).toBeUndefined();
  expect(crud.props()).toMatchObject({ requireTwoFactor: true, financialScope: "admin.security" });

  const start = async () => {
    await view.findAll("button").find(b => b.text() === "buttons.add")!.trigger("click");
    helperStore().formCrud = { name: "permissions.fixture" };
    await flushPromises();
    await crud.findAll("button").find(b => b.text() === "buttons.create")!.trigger("click");
    await flushPromises();
    expect(TwoFactorAuthStore().modal).toBe(true);
    expect(TwoFactorAuthStore().requestedScope).toBe("admin.security");
  };
  await start();
  expect(requests).toHaveLength(0);
  await challenge.findAll("button").find(b => b.text() === "buttons.cancel")!.trigger("click");
  await flushPromises();
  expect(TwoFactorAuthStore().modal).toBe(false);
  expect(requests).toHaveLength(0);

  await start();
  await challenge.get("input").setValue("Fixture07c!Password");
  await challenge.findAll("button").find(b => b.text() === "Continuar")!.trigger("click");
  await flushPromises();
  expect(requests).toHaveLength(2);
  expect(requests[0]).toMatchObject({ url: "security/step-up", data: { scope: "admin.security" } });
  expect(requests[1]).toMatchObject({ url: "permissions", method: "post", data: { name: "permissions.fixture" } });
  expect(requests[1].headers["X-Financial-Step-Up"]).toBe("permissions-test-grant");
  expect(takeFinancialStepUp("admin.security")).toBeNull();
  expect(view.get("table tbody").text()).toContain("Permiso de prueba");
  view.unmount(); challenge.unmount();
});
