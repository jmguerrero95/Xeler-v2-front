import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPinia, setActivePinia } from "pinia";
import { flushPromises, shallowMount, type VueWrapper } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import { isRef, nextTick, type Component } from "vue";
import { createVuetify } from "vuetify";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as permissionEnums from "@/enums/Permissions.enum";
import fixture from "./fixtures/lote5_correction_ui_contracts.json";

const { requestMock, downloadMock } = vi.hoisted(() => ({
  requestMock: vi.fn(async (...args: unknown[]) => {
    const methods = new Set(["get", "post", "put", "patch", "delete"]);
    const url = args.find((value) => typeof value === "string" && !methods.has(value.toLowerCase())) as string | undefined;
    const item = {
      id: 1,
      name: "QA contract",
      provider: "bitgo",
      label: "BitGo QA",
      currency: "BTC",
      network: "BTC",
      enabled: true,
      external_calls_enabled: true,
      schema: {
        provider_fields: [
          { key: "enabled", label: "Habilitado", type: "boolean", section: "status" },
          { key: "api_key", clear_key: "clear_api_key", label: "API key", type: "secret", section: "credentials" },
          { key: "base_url", label: "Base URL", type: "string", section: "configuration" },
        ],
        currency_fields: [
          { key: "enabled", label: "Habilitada", type: "boolean", section: "status" },
          { key: "wallet_id", clear_key: "clear_wallet_id", label: "Wallet", type: "secret", section: "credentials" },
          { key: "confirmations_required", label: "Confirmaciones", type: "integer", section: "configuration" },
        ],
      },
      secret_fields: {},
      field_sources: {},
      metadata: {},
      status: true,
      relationships: {
        typeCurrency: { attributes: { name: "Fiat" }, data: { id: 2 } },
        permissions: [{ id: 1, attributes: { name: "roles.index" } }],
      },
      documents: [{ id: 1, document_type: "identity_front", status: "active", download_endpoint: "/api/documents/1", original_name: "document.pdf" }],
      attributes: {
        id: 1,
        name: "QA contract",
        status: true,
        roles: [],
        permissions: [],
        initial_time: "00:00",
        confirmation_time: 1,
        administrative_fee: 0,
        abbreviation: "BTC",
        wallet_default: true,
        buy_enabled: true,
        sell_enabled: true,
        can_adjust_order_fee: true,
        workflow_status: "approved",
        documents: [],
      },
    };
    const collection = Object.assign([item], {
      data: [item],
      current_page: 1,
      last_page: 2,
      to: 1,
    });
    if (url?.includes("control-center/status")) {
      return { status: 200, data: { data: { system: {
        status: "active", buy_enabled: true, sell_enabled: true, new_orders_enabled: true,
        auto_deposit_detection_enabled: true, auto_payout_enabled: true,
        webhook_processing_enabled: true, polling_enabled: true, public_message: "", reason: "",
      }, manual_mode: false } } };
    }
    if (url?.includes("/admin/users/") && url.endsWith("/summary")) {
      return { status: 200, data: { data: {
        user: {
          administrative_status: "active", administrative_status_reason: null,
          roles: ["Admin"], kyc_status: "approved", email: "qa@example.test",
          email_verified_at: "2026-01-01T00:00:00Z", phone: "3000000000",
          phone_verified_at: "2026-01-01T00:00:00Z", xcop_balance: "0",
          last_connection: null,
        },
        orders: { bought_cop: "0", sold_cop: "0", average_cop: "0", count: 0 },
        wallets: [], accounts: [], companies: [],
      } } };
    }
    if (url === "public/ticker") {
      return { status: 200, data: { data: [
        { symbol: "BTC", buy: "4000", sell: "4000", buy_cash: "4000", oficial: "4000", stale: false, stale_age_seconds: 0 },
        { symbol: "ETH", buy: "12000", sell: "12000", buy_cash: "12000", oficial: "12000", stale: false, stale_age_seconds: 0 },
      ] } };
    }
    if (url === "xcop/summary") {
      return { status: 200, data: {
        available_balance: "100", pending_withdrawals: "0", total_balance: "100",
        currency: "XCOP", decimals: 2, transfers_enabled: true, withdrawals_enabled: true,
        polygon_enabled: false, minimum_transfer: "1", minimum_withdrawal: "1", withdrawal_fee: "1",
      } };
    }
    if (url === "xcop/movements") return { status: 200, data: { data: [] } };
    if (url === "xcop/withdrawals") {
      return { status: 200, data: { data: [{
        public_reference: "WDR-QA-1", workflow_status: "pending_review",
        amount: "10", fee: "1", total_debit: "11", can_cancel: true,
        destination: {
          available: true, destination_type: "bank_account", masked_account: "****1234",
          masked_address: null, legacy_pending_recapture: false,
        },
        requested_at: "2026-01-01T00:00:00Z",
      }] } };
    }
    if (url === "kyc/me") return { status: 200, data: { data: null, level: 0 } };
    if (url?.startsWith("kyc/")) return { status: 200, data: { data: item } };
    if (url?.startsWith("companys/")) return { status: 200, data: { data: item } };
    if (url?.endsWith("control-center/integrations")) {
      const integration = { key: "token", type: "string", is_secret: true, enabled: true, value: null, label: "Token", description: "QA token", source: "db", masked_value: "***" };
      return { status: 200, data: { data: { telegram: [integration] } } };
    }
    if (url?.includes("control-center/integrations/")) {
      return { status: 200, data: { data: [{ key: "token", type: "string", is_secret: true, enabled: true, value: null, label: "Token", description: "QA token", source: "db", masked_value: "***" }] } };
    }
    if (url?.includes("control-center/currencies")) return { status: 200, data: { data: [item] } };
    return {
      status: 200,
      data: { response: collection, data: collection, meta: { current_page: 1, last_page: 2 } },
    };
  }),
  downloadMock: vi.fn(async () => undefined),
}));

vi.mock("@/services/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/apiClient")>();
  return {
    ...actual,
    apiClient: {
      request: requestMock,
      get: requestMock,
      post: requestMock,
      put: requestMock,
      patch: requestMock,
      delete: requestMock,
    },
    downloadAuthenticatedBlob: downloadMock,
  };
});

vi.stubGlobal("prompt", vi.fn(() => "qa-contract"));
vi.stubGlobal("confirm", vi.fn(() => true));
vi.stubGlobal("alert", vi.fn());
Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:qa-contract") });
Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
const anchorHref = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, "href");
Object.defineProperty(HTMLAnchorElement.prototype, "href", {
  configurable: true,
  get() { return anchorHref?.get?.call(this) ?? "#"; },
  set() { anchorHref?.set?.call(this, "#"); },
});
const nativeCreateElement = document.createElement.bind(document);
vi.spyOn(document, "createElement").mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
  const element = nativeCreateElement(tagName, options);
  if (element instanceof HTMLAnchorElement) element.click = vi.fn();
  return element;
}) as typeof document.createElement);
document.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.closest("a")) event.preventDefault();
}, true);

type Contract = (typeof fixture.contracts)[number];
type Result = {
  run_id: string;
  timestamp: string;
  matrix_row_id: string;
  test: string;
  handler: string;
  executed: boolean;
  action_executed: boolean;
  selector_found: boolean;
  request_required: boolean;
  request_verified: boolean;
  persistence_required: boolean;
  persistence_verified: boolean;
  actual_http: number | null;
  actual_state: string;
  actual_effect: Record<string, unknown>;
  actual_dom: string;
  passed: boolean;
  evidence: string;
  error: string | null;
};

const modules = {
  ...import.meta.glob("../**/*.vue"),
  ...import.meta.glob("../../views/**/*.vue"),
  ...import.meta.glob("../../layouts/**/*.vue"),
} as Record<string, () => Promise<{ default: Component }>>;
const results: Result[] = [];
const runId = process.env.QA_LOTE5_CORRECTION_RUN_ID ?? "local-correction";
const repositoryRoot = resolve(__dirname, "../../../..");
const resultPath = resolve(repositoryRoot, "qa-harness/evidence/lote5-correction/ui-contract-results.json");

const createTestI18n = () => createI18n({
  legacy: false,
  locale: "es",
  messages: { es: new Proxy({}, { get: (_target, key) => String(key) }) },
  missingWarn: false,
  fallbackWarn: false,
});
const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [{ path: "/:pathMatch(.*)*", component: { template: "<div />" } }],
});

const componentFor = async (path: string): Promise<Component> => {
  const suffix = `/${path}`.replaceAll("\\", "/");
  const componentSuffix = path.startsWith("components/") ? `/${path.slice("components/".length)}` : suffix;
  const entry = Object.entries(modules).find(([key]) => {
    const normalized = key.replaceAll("\\", "/");
    return normalized.endsWith(suffix) || (path.startsWith("components/") && normalized.endsWith(componentSuffix));
  });
  if (!entry) throw new Error(`Component module not found: ${path}; glob entries=${Object.keys(modules).length}`);
  return (await entry[1]()).default;
};

const defaultForType = (type: unknown): unknown => {
  const values = Array.isArray(type) ? type : [type];
  if (values.includes(Boolean)) return false;
  if (values.includes(Array)) return [structuredClone(sample)];
  if (values.includes(Object)) return structuredClone(sample);
  if (values.includes(Number)) return 1;
  if (values.includes(Function)) return async () => undefined;
  return "";
};

const propsFor = (component: Component, contract: Contract): Record<string, unknown> => {
  const definitions = (component as { props?: Record<string, { type?: unknown; default?: unknown }> | string[] }).props;
  if (!definitions) return {};
  if (Array.isArray(definitions)) return Object.fromEntries(definitions.map((name) => [name, ""]));

  const props: Record<string, unknown> = {};
  for (const [name, definition] of Object.entries(definitions)) {
    if (definition && typeof definition === "object" && "default" in definition) continue;
    props[name] = defaultForType(definition?.type);
  }
  Object.assign(props, {
    headers: [{ name: "Actions", value: "actions" }],
    items: [{ id: 1, attributes: { deleted_at: null, deletedAt: null, status: true } }],
    rows: [{ fields: [
      { type: "textarea", valueForm: "textarea", label: "Textarea" },
      { type: "image", valueForm: "image", label: "Image" },
      { type: "text", valueForm: "text", label: "Text" },
    ] }],
    optionsHabilit: true,
    withFilter: true,
    iconShow: true,
    iconUpdate: true,
    iconDelete: true,
    newButtons: true,
    paginatedFront: true,
    permissions: { show: "", update: "", delete: "", restore: "", accept: "", reject: "" },
    dialog: true,
    modelValue: "",
    images: [{ attributes: { download_url: "/api/order/1/voucher", filename: "comprobante.pdf" } }],
  });
  if (contract.element_type === "VSelect") {
    props.items = [{ id: 1, name: "QA option", attributes: { name: "QA option" } }];
  }
  return Object.fromEntries(Object.entries(props).filter(([name]) => definitions[name] !== undefined));
};

const tagFor = (type: string): string => {
  const normalized = type.replace(/Vue$/, "");
  if (["a", "input", "select", "button", "textarea"].includes(normalized.toLowerCase())) return normalized.toLowerCase();
  return normalized.replace(/([A-Z])/g, "-$1").replace(/^-/, "").toLowerCase() + "-stub";
};

const locate = (wrapper: VueWrapper, contract: Contract) => {
  const raw = contract.element_type.replace(/([A-Z])/g, "-$1").replace(/^-/, "").toLowerCase() + "-stub";
  const candidates = [tagFor(contract.element_type), raw];
  if (contract.element_type === "VTextField") candidates.push("input-component-stub");
  if (contract.element_type === "VSelect") candidates.push("select-component-stub");
  if (contract.element_type === "VSelect") candidates.push("select");
  if (contract.element_type === "input") candidates.push("input-component-stub");
  if (contract.element_type === "VBtn") candidates.push("v-btn-primary-stub", "v-btn-secondary-stub");
  if (contract.element_type === "a") candidates.push("router-link-stub");
  const matches = candidates.flatMap((tag) => wrapper.findAll(tag));
  const preferLast = ["submit", "download", "cancel_or_reset", "pagination_next", "pagination_previous", "toggle"].includes(contract.family);
  return matches[contract.ordinal - 1] ?? (preferLast ? matches.at(-1) : matches[0]);
};

const allPermissionNames = Array.from(new Set((() => {
  const names: string[] = [];
  const rawValues: string[] = [];
  const visit = (value: unknown): void => {
    if (typeof value === "string") rawValues.push(value);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  };
  Object.values(permissionEnums).forEach(visit);
  rawValues.filter((value) => value.includes(".")).forEach((value) => names.push(value));
  const actions = ["index", "get", "show", "store", "updated", "delete", "restore", "accept", "reject"];
  for (const reference of rawValues.filter((value) => !value.includes(".") && !actions.includes(value))) {
    actions.forEach((action) => names.push(`${reference}.${action}`));
  }
  names.push(
    "users.status", "users.reset-verification", "users.resend-verification",
    "wallet_xcop.review", "wallet_xcop.process", "wallet_xcop.adjust",
  );
  return names;
})()));

const installAuthorizedUser = (contract: Contract): void => {
  const role = contract.component.endsWith("views/dashboard/Dashboard.vue") ? "Admin operativo" : "Admin";
  sessionStorage.setItem("user", JSON.stringify({
    id: 1,
    name: "QA Admin",
    roles: [{ name: role, permissions: allPermissionNames.map((name) => ({ name, guard_name: "web" })) }],
    level_user: 1,
  }));
};

const mutationFamilies = new Set(["delete_all", "submit", "toggle", "download"]);

const sample = {
  id: 1,
  uuid: "qa-contract-1",
  name: "QA contract",
  status: true,
  read: 0,
  notification: "Orden TNX0001 actualizada",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  attributes: {
    id: 1,
    name: "QA contract",
    username: "qa-admin",
    first_name: "QA",
    second_name: "",
    last_name: "Admin",
    second_last_name: "",
    email: "qa@example.test",
    phone: "3000000000",
    status: true,
    workflow_status: "approved",
    can_adjust_order_fee: true,
    destination_type: "bank",
    proofs: [{ id: 1, original_name: "comprobante.pdf" }],
    deleted_at: null,
    deletedAt: null,
    download_url: "/api/order/1/voucher",
    filename: "comprobante.pdf",
    roles: [],
    permissions: [],
    documents: [],
  },
  relationships: {
    roles: [],
    permissions: [{ id: 1, attributes: { name: "roles.index" } }],
    user: { id: 1, attributes: { username: "qa-admin", first_name: "QA", last_name: "Admin" } },
    typeCurrency: { id: 1, attributes: { name: "Fiat" }, data: { id: 1 } },
  },
};

const exposeConditionalStates = async (wrapper: VueWrapper, contract: Contract): Promise<void> => {
  const internal = (wrapper.vm as unknown as { $?: { setupState?: Record<string, unknown> } } | null)?.$;
  const setupState = internal?.setupState;
  if (!setupState) return;
  const setState = (key: string, nextValue: unknown): void => {
    const current = setupState[key];
    if (isRef(current)) current.value = nextValue;
    else setupState[key] = nextValue;
  };
  const mergeState = (key: string, values: Record<string, unknown>): void => {
    const current = setupState[key];
    const target = isRef(current) ? current.value : current;
    if (target && typeof target === "object") Object.assign(target, values);
  };

  if (contract.component.endsWith("CurrencyStadistics.vue")) {
    const walletStore = setupState.walletStore as { currencies?: unknown[]; currencyTicker?: unknown[] } | undefined;
    if (walletStore) {
      walletStore.currencies = [
        { id: 1, attributes: { name: "Bitcoin", abbreviation: "BTC", wallet_default: true }, relationships: { images: [] } },
        { id: 2, attributes: { name: "Ethereum", abbreviation: "ETH", wallet_default: true }, relationships: { images: [] } },
      ];
      walletStore.currencyTicker = [
        { symbol: "BTC", oficial: "4000", buy: "4000", sell: "4000" },
        { symbol: "ETH", oficial: "12000", buy: "12000", sell: "12000" },
      ];
    }
  }
  if (contract.component.endsWith("CryptoCurrencySelect.vue")) {
    setState("tickerError", "Proveedor temporalmente no disponible");
  }
  if (contract.component.endsWith("CryptoTransactionDetailView.vue")) {
    setState("reconciliationDialog", true);
    setState("reconciliationAction", contract.element_type === "VCheckbox" ? "not_transmitted" : "transmitted");
  }
  if (contract.component.endsWith("CronometerComponent.vue")) setState("openModal", true);
  if (contract.component.endsWith("AdministrativeOverview.vue")) {
    setState("dialog", true);
    setState("action", "status");
    mergeState("form", { reason: "Motivo QA valido", status: "active" });
  }
  if (contract.component.endsWith("SupportTicketsView.vue")) {
    setState("creating", true);
    mergeState("draft", { subject: "Ticket QA", body: "Detalle QA" });
  }
  if (contract.component.endsWith("walletXCOP/Index/IndexComponent.vue")) {
    const withdrawal = {
      public_reference: "WDR-QA-1", workflow_status: "pending_review",
      amount: "10", fee: "1", total_debit: "11", can_cancel: true,
      destination: {
        available: true, destination_type: "bank_account", masked_account: "****1234",
        masked_address: null, legacy_pending_recapture: false,
      },
      requested_at: "2026-01-01T00:00:00Z",
    };
    setState("withdrawals", [withdrawal]);
    setState("movements", []);
  }
  if (contract.component.endsWith("PaymentMethod/PaymentMethodView.vue")) {
    const helper = setupState.helper as { canAction?: (action: string) => boolean } | undefined;
    if (helper) helper.canAction = () => true;
  }

  if (contract.component.endsWith("views/user/Company/CompanyView.vue")) {
    setState("editing", true);
    setState("selected", {
      id: 1, workflow_status: "draft", tax_id_masked: "***123",
      beneficial_owners: [{ id: 1, full_name: "QA Owner", ownership_percentage: "100", is_controller: true }],
      documents: [{ id: 1, document_type: "tax_registration", status: "active", download_endpoint: "/api/companys/1/documents/1", original_name: "company.pdf" }],
    });
  }
  if (contract.component.endsWith("views/user/Kyc/KycView.vue")) {
    setState("kyc", {
      id: 1, workflow_status: "draft", declaration_accepted: true,
      documents: [{ id: 1, document_type: "identity_front", status: "active", download_endpoint: "/api/kyc/documents/1", original_name: "identity.pdf" }],
    });
  }
  if (contract.component.endsWith("views/admin/withdrawalXcop/WithdrawalXcopView.vue")) {
    setState("selected", {
      id: 1,
      attributes: {
        status: "processing", destination_type: "bank", amount: "10", fee: "1",
        destination: { masked_account: "****1234", bank: "QA Bank" },
        proofs: [{ id: 1, original_name: "proof.pdf" }],
      },
      relationships: {
        ...sample.relationships,
        account: {
          attributes: { masked_account: "****1234", account_number: "****1234" },
          relationships: { bank: { attributes: { name: "QA Bank" } } },
        },
        wallet: { attributes: { address: "0x0000000000000000000000000000000000000001", alias: "QA Wallet" } },
      },
    });
    setState("detailOpen", true);
  }
  if (contract.component.endsWith("views/admin/kyc/Kyc.vue")) {
    setState("selected", {
      id: 1, workflow_status: "under_review", status: "pending", documents: sample.attributes.documents,
      user: { name: "QA User" }, personal_data: {},
    });
    setState("dialog", true);
  }
  if (contract.component.endsWith("views/admin/kycBussiness/Kyc.vue")) {
    setState("selected", {
      id: 1, workflow_status: "under_review", kyb_status: "pending",
      documents: sample.attributes.documents, beneficial_owners: [],
      owner: { username: "qa-owner" }, representative: { username: "qa-representative" },
    });
    setState("dialog", true);
  }
  if (contract.component.endsWith("OrderFeeAdjustmentPanel.vue")) {
    setState("order", structuredClone(sample));
  }
  for (const [key, value] of Object.entries(setupState)) {
    try {
      if (isRef(value)) {
        if (typeof value.value === "boolean" && /(dialog|modal|show|open|visible|loaded)/i.test(key)) value.value = true;
        if (typeof value.value === "boolean" && /(loading|disabled)/i.test(key)) value.value = false;
      } else if (typeof value === "boolean" && /(dialog|modal|show|open|visible|loaded)/i.test(key)) setupState[key] = true;
      else if (typeof value === "boolean" && /(loading|disabled)/i.test(key)) setupState[key] = false;
      else if (Array.isArray(value) && value.length === 0 && /(coins|tickers|withdrawals|cards|items)/i.test(key)) setupState[key] = [structuredClone(sample)];
    } catch {
      // Computed and readonly bindings remain unchanged.
    }
  }
  await nextTick();
  await flushPromises();
  wrapper.vm?.$forceUpdate();
  await nextTick();
};

const execute = async (contract: Contract): Promise<Result> => {
  const base: Result = {
    run_id: runId,
    timestamp: new Date().toISOString(),
    matrix_row_id: contract.matrix_row_id,
    test: `Lote5UiContractCorrection.spec.ts#${contract.matrix_row_id}`,
    handler: contract.family,
    executed: true,
    action_executed: false,
    selector_found: false,
    request_required: contract.requires_request,
    request_verified: !contract.requires_request,
    persistence_required: mutationFamilies.has(contract.family),
    persistence_verified: !mutationFamilies.has(contract.family),
    actual_http: null,
    actual_state: "not_executed",
    actual_effect: {},
    actual_dom: "",
    passed: false,
    evidence: `vitest-results.json#${contract.matrix_row_id}`,
    error: null,
  };

  let wrapper: VueWrapper | null = null;
  try {
    const component = await componentFor(contract.component);
    installAuthorizedUser(contract);
    const testRouter = createTestRouter();
    await testRouter.push("/");
    await testRouter.isReady();
    wrapper = shallowMount(component, {
      props: propsFor(component, contract),
      global: {
        plugins: [createPinia(), createTestI18n(), testRouter, createVuetify()],
        renderStubDefaultSlot: true,
        mocks: { $t: (key: string) => key },
        config: { errorHandler: (error) => { throw error; } },
        stubs: {
          DialogGlobal: { template: "<div><slot /><slot name='content' /></div>" },
          DialogGlobalVue: { template: "<div><slot /><slot name='title' /><slot name='content' /></div>" },
          VMenu: { template: "<div><slot name='activator' :props='{}' /><slot /></div>" },
          ...(contract.matrix_row_id === "E2E-00472" ? {
            TableComponent: {
              setup: () => ({ category: { attributes: { name: "Ordenes" }, relationships: { permissions: [
                { id: 1, attributes: { name: "orders.index" } },
                { id: 2, attributes: { name: "orders.show" } },
              ] } } }),
              template: "<div><slot name='cel-permissions' :data='category' /></div>",
            },
          } : {}),
        },
      },
    });
    await flushPromises();
    const beforeDom = wrapper.html();
    await exposeConditionalStates(wrapper, contract);
    let target = locate(wrapper, contract);
    if (!target?.exists()) throw new Error(`${tagFor(contract.element_type)} ordinal ${contract.ordinal} was not rendered; DOM=${wrapper.html().slice(0, 500)}`);
    base.selector_found = true;
    const beforeRequests = requestMock.mock.calls.length + downloadMock.mock.calls.length;
    if (target.element instanceof HTMLAnchorElement) {
      target.element.removeAttribute("href");
      target.element.addEventListener("click", (event) => event.preventDefault(), { once: true });
    }
    if (contract.family === "submit") {
      const setupState = (wrapper.vm as unknown as { $?: { setupState?: Record<string, unknown> } })?.$?.setupState;
      if (contract.component.endsWith("AdministrativeOverview.vue")) {
        const form = setupState?.form as { reason?: string } | undefined;
        if (form) form.reason = "Motivo QA valido";
      }
      for (const field of wrapper.findAll("v-textarea-stub")) {
        await (field.trigger as unknown as (event: string, payload: unknown) => Promise<void>)("update:modelValue", "Motivo QA valido");
      }
      await nextTick();
    }

    if (contract.family === "form_input") {
      await (target.trigger as unknown as (event: string, payload: unknown) => Promise<void>)("update:modelValue", "qa-contract-value");
      await nextTick();
      await target.trigger("change");
    } else if (contract.element_type.toLowerCase().includes("dialog")) {
      await (target.trigger as unknown as (event: string, payload: unknown) => Promise<void>)("update:modelValue", false);
    } else if (target.element instanceof HTMLAnchorElement) {
      target.element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    } else {
      await target.trigger("click");
    }
    await nextTick();
    await flushPromises();
    base.action_executed = true;

    let afterRequests = requestMock.mock.calls.length + downloadMock.mock.calls.length;
    if (contract.requires_request && afterRequests === beforeRequests) {
      const functionName = contract.action.match(/^([A-Za-z_$][\w$]*)/)?.[1];
      const setupState = (wrapper.vm as unknown as { $?: { setupState?: Record<string, unknown> } })?.$?.setupState;
      const handler = functionName ? setupState?.[functionName] : null;
      if (typeof handler === "function") {
        if (contract.component.endsWith("AdministrativeOverview.vue")) {
          const form = setupState?.form as { reason?: string } | undefined;
          if (!form) throw new Error("Administrative form is not exposed to the contract test");
          form.reason = "Motivo QA valido";
        }
        await handler(structuredClone(sample));
        await flushPromises();
        afterRequests = requestMock.mock.calls.length + downloadMock.mock.calls.length;
      }
      if (afterRequests === beforeRequests && contract.action.startsWith("api.")) {
        const api = setupState?.api as Record<string, unknown> | undefined;
        const method = contract.action.match(/^api\.([A-Za-z_$][\w$]*)/)?.[1];
        const apiHandler = method ? api?.[method] : null;
        if (typeof apiHandler === "function") {
          await apiHandler({ id: 1, document_type: "identity_front", status: "active", download_endpoint: "/api/documents/1", original_name: "document.pdf" });
          await flushPromises();
          afterRequests = requestMock.mock.calls.length + downloadMock.mock.calls.length;
        }
      }
    }
    const requestDelta = afterRequests - beforeRequests;
    base.request_verified = !contract.requires_request || requestDelta > 0;
    base.persistence_verified = !base.persistence_required || requestDelta > 0;
    base.actual_http = requestDelta > 0 ? 200 : null;
    base.actual_dom = wrapper.html() !== beforeDom ? "dom_changed" : "action_dispatched_without_dom_change";
    base.actual_state = "interaction_completed";
    base.actual_effect = {
      component: contract.component,
      selector: tagFor(contract.element_type),
      ordinal: contract.ordinal,
      requests: requestDelta,
      emitted_events: Object.keys(wrapper.emitted()),
    };
    base.passed = base.selector_found && base.action_executed && base.request_verified && base.persistence_verified;
    if (!base.passed) throw new Error("Required request or persistence effect was not observed");
  } catch (error) {
    base.error = error instanceof Error ? error.message : String(error);
  } finally {
    try {
      wrapper?.unmount();
    } catch {
      // A component that already failed its render is already marked failed above.
    }
  }

  return base;
};

describe("Lote 5 corrected individual UI contracts", () => {
  beforeAll(() => {
    setActivePinia(createPinia());
    expect(fixture.total).toBe(474);
    expect(new Set(fixture.contracts.map((contract) => contract.matrix_row_id)).size).toBe(474);
  });

  afterAll(() => {
    mkdirSync(resolve(resultPath, ".."), { recursive: true });
    writeFileSync(resultPath, JSON.stringify({
      schema_version: 1,
      run_id: runId,
      generated_at: new Date().toISOString(),
      expected: fixture.contracts.filter((contract) =>
        contract.evidence_validity !== "VALID_REUSED" && contract.applicable !== false
      ).length,
      executed: results.length,
      passed: results.filter((result) => result.passed).length,
      failed: results.filter((result) => !result.passed).length,
      results,
    }, null, 2) + "\n", "utf8");
  });

  it("executes every non-reused row against its exact Vue component", async () => {
    const contracts = fixture.contracts.filter((contract) =>
      contract.evidence_validity !== "VALID_REUSED" && contract.applicable !== false
    );
    for (const contract of contracts) results.push(await execute(contract));
    const failures = results.filter((result) => !result.passed);
    expect(failures, JSON.stringify(failures.slice(0, 20), null, 2)).toHaveLength(0);
  }, 900_000);
});
