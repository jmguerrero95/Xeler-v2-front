import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, shallowMount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia, defineStore } from "pinia";
import { defineComponent } from "vue";
import axios from "axios";
import { apiClient } from "@/services/apiClient";
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";
import { clearFinancialStepUp, takeFinancialStepUp, financialScopeForPath } from "@/services/securityStepUp";
import type { FinancialStepUpScope } from "@/services/securityStepUp";

vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {}, query: {} }) }));
vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock("@/stores/UserStore", () => ({ UserStore: () => ({
  userAuth: { attributes: { email: "current@example.test", google_authentication: false } },
  authUser: { email: "current@example.test" }, hasPermission: () => true,
  updateUserAuth: vi.fn(), clearAuth: vi.fn(),
}) }));
vi.mock("@/helper", async () => {
  const { defineStore } = await import("pinia");
  const { apiClient } = await import("@/services/apiClient");
  return { helperStore: defineStore("helper07b", {
    state: () => ({ url: "company/wallet", formCrud: {}, item: { id: 1 }, items: [], clickIn: "Create", openModalCrud: true, pagination: { currentPage: 1 },
      formRef: { validate: async () => ({ valid: true }), reset: () => {} },
    }),
    actions: {
      http(url: string, method = "get", opts: any = {}, _message = "", _silent = false, security: any = {}) { return apiClient.request(method as any, url, { ...opts, ...security }); },
      create(data: any, _notify: boolean, scope: FinancialStepUpScope) { return apiClient.post(this.url, data, { financialScope: scope }); },
      put(id: any, data: any, _notify: boolean, scope: FinancialStepUpScope) { return apiClient.put(`${this.url}/${id}`, data, { financialScope: scope }); },
      deleted(id: any, _notify: boolean, scope: FinancialStepUpScope) { return apiClient.delete(`${this.url}/${id}`, { financialScope: scope }); },
      index() {}, showNotify() {}, initView() {},
    },
  }), formatNumber: (n: unknown) => String(n) };
});

import { helperStore } from "@/helper";
import Enrollment from "@/views/admin/profile/PasswordTab/TwoFactor.vue";
import Challenge from "@/components/TwoFactorAuth.vue";
import UserEmail from "@/views/user/Profile/ValidationEmail/ValidationEmail.vue";
import AdminEmail from "@/views/admin/profile/ValidationEmail/ValidationEmail.vue";
import Crud from "@/components/global/CrudComponent.vue";
import Table from "@/components/global/TableComponent.vue";
import Outbound from "@/views/user/InternationalAccounts/components/InternationalOutboundPanel.vue";
import Backoffice from "@/components/admin/OrderBackofficeControls.vue";
import Withdrawal from "@/views/admin/withdrawalXcop/WithdrawalXcopView.vue";
import { brebApi } from "@/services/brebApi";
import { updateSystemControl } from "@/services/controlCenterApi";
import { updateInternationalServiceFee } from "@/services/internationalAccountsApi";
import { feesApi } from "@/services/feesApi";

const box = { template: "<div><slot/><slot name='content'/><slot name='actions'/></div>" };
const button = { props: ["disabled"], emits: ["click"], template: "<button :disabled='disabled' @click='$emit(\"click\", $event)'><slot/></button>" };
const input = { props: ["modelValue", "type", "name", "placeholder"], emits: ["update:modelValue"], template: "<input :name='name' :type='type' :placeholder='placeholder' :value='modelValue' @input='$emit(\"update:modelValue\", $event.target.value)'/>" };
const stubs: any = { DialogGlobal: box, DialogGlobalVue: box, DialogBase: box, InputComponent: input, NewInputComponentVue: input,
  VIcon: true, VChip: box, VDialog: box, VAlert: box, VTextField: input, VTextarea: input, VSelect: input,
  VBtnPrimary: button, VBtn: button, VRow: box, VCol: box, VCard: box, VCardText: box, VCardActions: box,
  IdentityChallengeResend: true, FormComponent: true,
};
const global: any = { stubs, mocks: { $t: (x: string) => x, $vuetify: { display: { xs: false } } } };
const state = (wrapper: any): any => wrapper.vm.$.setupState;
let requests: any[];
let grantNumber: number;
const writes = () => requests.filter(r => r.method !== "get" && r.url !== "security/step-up");
async function confirm(scope: FinancialStepUpScope) {
  const store = TwoFactorAuthStore();
  expect(store.modal).toBe(true);
  expect(store.requestedScope).toBe(scope);
  store.code = "Fixture07b!Password";
  await store.ejectFunction2();
  await flushPromises();
}

beforeEach(() => {
  setActivePinia(createPinia()); clearFinancialStepUp(); requests = []; grantNumber = 0;
  vi.stubEnv("VITE_API_URL", "https://api.example.test/api");
  vi.spyOn(axios, "request").mockImplementation(async (config: any) => {
    requests.push(config);
    let data: any = { data: [], response: [], meta: {} };
    if (config.url === "security/step-up") data = { data: { grant: `fixture-grant-${++grantNumber}` } };
    if (config.url === "users/qr/auth") data = { svg: '<svg fill="#000000"></svg>', code: "PENDING_FIXTURE" };
    if (/email\/(send|change)$/.test(config.url)) data = { data: { challenge_reference: "fixture-reference", expires_in: 300, resend_available_in: 30, delivery_status: "sent" } };
    if (config.url === "international-accounts/beneficiaries" && config.method === "post") data = { data: { id: 7 } };
    if (config.url === "international-accounts/transfers" && config.method === "post") data = { data: { id: 8 } };
    return { data, status: 200, headers: {}, config } as any;
  });
});

describe("07B behavioral identity flows", () => {
  it("captures the initial password in its own field and advances to pending TOTP confirmation", async () => {
    const enrollment = mount(Enrollment, { global });
    await enrollment.findAll("button").find(b => b.text().includes("Habilitar"))!.trigger("click");
    const challenge = mount(Challenge, { global });
    await challenge.get('input[name="current_password"]').setValue("Fixture07b!Password");
    expect(TwoFactorAuthStore().code).toBe("");
    await challenge.findAll("button").find(b => b.text() === "Continuar")!.trigger("click");
    await flushPromises();
    expect(writes()[0]).toMatchObject({ url: "users/qr/auth", data: { current_password: "Fixture07b!Password" } });
    expect(state(enrollment).modal).toBe(true);
    expect(state(enrollment).codeString).toBe("PENDING_FIXTURE");
    expect(requests.some(r => r.url === "users/validate/code/auth")).toBe(false);
    expect(enrollment.text()).toContain("Confirmar 2FA");
    enrollment.unmount(); challenge.unmount();
  });

  for (const [label, component] of [["cliente", UserEmail], ["admin", AdminEmail]] as const) {
    for (const change of [false, true]) it(`${label}: ${change ? "cambio" : "correo actual"} confirma el challenge por su endpoint`, async () => {
      const wrapper = mount(component, { props: { email: change ? "new@example.test" : "current@example.test", isValidEmail: true }, global });
      await wrapper.findAll("button").find(b => b.text() === "Validar")!.trigger("click");
      await flushPromises();
      if (change) {
        await wrapper.get('input[type="password"]').setValue("Fixture07b!Password");
        await wrapper.findAll("button").find(b => b.text() === "Enviar código")!.trigger("click");
        await flushPromises();
      }
      const codeInput = wrapper.findAll("input").find(i => i.attributes("type") !== "password")!;
      await codeInput.setValue("123456");
      await wrapper.findAll("button").find(b => b.text() === "commons.verificate")!.trigger("click");
      await flushPromises();
      expect(writes().map(r => r.url)).toEqual(change ? ["identity/email/change", "identity/email/change/confirm"] : ["verification/email/send", "verification/email/verify"]);
      expect(wrapper.emitted("updateEmail")).toHaveLength(1);
      wrapper.unmount();
    });
  }
});

describe("07B scoped requests", () => {
  it("matches admin order and manual verification scopes without crossing provider configuration", () => {
    expect(financialScopeForPath("admin/orders/1/sale-payment-complete")).toBe("finance.order_admin");
    expect(financialScopeForPath("admin/crypto/manual-incoming-verifications/1/review")).toBe("finance.crypto_payout");
    expect(financialScopeForPath("admin/crypto/providers/1")).toBe("finance.financial_configuration");
  });
  it("cancellation never invokes the pending financial request", async () => {
    const pending = useTwoFactorGuard().authorizeWithTwoFactor(() => brebApi.submit("fixture"), "finance.financial_destination");
    const rejected = expect(pending).rejects.toThrow("Autorización cancelada");
    const dialog = mount(Challenge, { global });
    await dialog.findAll("button").find(b => b.text() === "buttons.cancel")!.trigger("click");
    await rejected;
    expect(writes()).toHaveLength(0);
    expect(TwoFactorAuthStore().modal).toBe(false);
    dialog.unmount();
  });
  for (const [scope, url] of [["admin.security", "roles"], ["finance.financial_destination", "company/account"], [undefined, "category/faq"]] as const) {
    it(`Table ${url}: eliminación usa el scope declarado`, async () => {
      helperStore().url = url;
      const wrapper = shallowMount(Table, { props: { headers: [], optionsHabilit: false, items: [{ id: 1, attributes: {} }], requireTwoFactor: !!scope, financialScope: scope }, global });
      state(wrapper).openConfirmModal(1); await state(wrapper).okDeletedRestore();
      if (scope) { expect(writes()).toHaveLength(0); await confirm(scope); }
      expect(writes()[0]).toMatchObject({ url: `${url}/1`, method: "delete" });
      expect(writes()[0].headers["X-Financial-Step-Up"]).toBe(scope ? "fixture-grant-1" : undefined);
      wrapper.unmount();
    });
  }
  for (const [scope, url] of [["admin.security", "roles"], ["finance.financial_destination", "company/wallet"], [undefined, "category/faq"]] as const) {
    it(`CRUD ${url}: solicita solamente el scope declarado`, async () => {
      const helper = helperStore(); helper.url = url;
      const wrapper = mount(Crud, { props: { singular: "Registro", rows: [], requireTwoFactor: !!scope, financialScope: scope }, global });
      await state(wrapper).CreateOrUpdate();
      if (scope) { expect(writes()).toHaveLength(0); await confirm(scope); }
      expect(writes()).toHaveLength(1);
      expect(writes()[0].url).toBe(url);
      expect(writes()[0].headers["X-Financial-Step-Up"]).toBe(scope ? "fixture-grant-1" : undefined);
      wrapper.unmount();
    });
  }

  it("International UI obtains separate grants for beneficiary, external account and transfer", async () => {
    const wrapper = shallowMount(Outbound, { global }); await flushPromises();
    const ui = state(wrapper);
    Object.assign(ui.beneficiaryForm, { alias: "Destino", country: "USA", street_line_1: "Fixture", city: "Fixture", postal_code: "10001", bank_name: "Fixture", first_name: "Fixture", last_name: "Fixture", account_number: "123456", routing_number: "123456789" });
    const saving = ui.saveBeneficiary();
    expect(writes()).toHaveLength(0);
    await confirm("finance.international_accounts");
    expect(writes()).toHaveLength(1);
    expect(TwoFactorAuthStore().modal).toBe(true);
    await confirm("finance.international_accounts"); await saving;
    expect(writes().map(r => r.url)).toEqual(["international-accounts/beneficiaries", "international-accounts/beneficiaries/7/external-accounts"]);
    expect(writes().map(r => r.headers["X-Financial-Step-Up"])).toEqual(["fixture-grant-1", "fixture-grant-2"]);
    ui.preview = { can_submit: true }; Object.assign(ui.transferForm, { international_account_id: 1, external_account_id: 2, destination_amount: "10", payment_rail: "ach" });
    const transfer = ui.confirmTransfer(); await confirm("finance.international_accounts"); await transfer;
    expect(writes()[2].url).toBe("international-accounts/transfers");
    expect(writes()[2].headers["X-Financial-Step-Up"]).toBe("fixture-grant-3");
    expect(takeFinancialStepUp("finance.international_accounts")).toBeNull(); wrapper.unmount();
  });

  it("XCOP admin adjustment waits for finance.xcop", async () => {
    const wrapper = shallowMount(Withdrawal, { global }); await flushPromises();
    const ui = state(wrapper); Object.assign(ui.adjustment, { user_id: "1", amount: "10", reason: "Fixture autorizado" });
    const action = ui.applyAdjustment(); expect(writes()).toHaveLength(0);
    await confirm("finance.xcop"); await action;
    expect(writes()[0]).toMatchObject({ url: "admin/xcop/adjustments", headers: { "X-Financial-Step-Up": "fixture-grant-1" } }); wrapper.unmount();
  });

  it("backoffice take is deferred and uses order_admin", async () => {
    const wrapper = mount(Backoffice, { props: { orderId: 8, actions: { can_take: true } }, global });
    await wrapper.get('[data-test="take"]').trigger("click"); expect(writes()).toHaveLength(0);
    await confirm("finance.order_admin");
    expect(writes()[0]).toMatchObject({ url: "admin/backoffice/orders/8/take", headers: { "X-Financial-Step-Up": "fixture-grant-1" } }); wrapper.unmount();
  });

  for (const [name, scope, action] of [
    ["Control Center", "finance.financial_configuration", () => updateSystemControl({})],
    ["Bre-B submit", "finance.financial_destination", () => brebApi.submit("fixture")],
    ["International admin fees", "finance.international_accounts", () => updateInternationalServiceFee(1, {})],
    ["Fees", "finance.financial_configuration", () => feesApi.toggle(1, false, "Fixture")],
  ] as const) it(`${name}: prompt, grant y request de scope correcto`, async () => {
    let run: () => Promise<unknown>;
    const host = mount(defineComponent({ setup() { const guard = useTwoFactorGuard(); run = () => guard.authorizeWithTwoFactor(action, scope); return () => null; } }), { global });
    const pending = run!(); expect(writes()).toHaveLength(0);
    await confirm(scope); await pending;
    expect(writes()[0].headers["X-Financial-Step-Up"]).toBe("fixture-grant-1");
    expect(takeFinancialStepUp(scope)).toBeNull(); host.unmount();
  });
});
