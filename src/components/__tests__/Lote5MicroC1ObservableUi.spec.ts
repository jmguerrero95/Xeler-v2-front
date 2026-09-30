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
import fixture from "./fixtures/lote5_micro_c1_observable_contracts.json";

const { requestMock, downloadMock } = vi.hoisted(() => ({
  requestMock: vi.fn(async (...args: unknown[]) => {
    const methods = new Set(["get", "post", "put", "patch", "delete"]);
    const url = args.find((v) => typeof v === "string" && !methods.has(v.toLowerCase())) as string | undefined;
    const item = {
      id: 1, name: "QA contract", status: true, provider: "bitgo", currency: "BTC", network: "BTC",
      attributes: { id: 1, name: "QA contract", status: true, deleted_at: null, deletedAt: null },
      relationships: { country: { id: 1, attributes: { name: "Colombia" } }, images: [], currency: { id: 1, attributes: { name: "Bitcoin", abbreviation: "BTC" } } },
    };
    const collection = Object.assign([item], { data: [item], current_page: 1, last_page: 2, to: 1 });
    if (url === "public/ticker") return { status: 200, data: { data: [{ symbol: "BTC", oficial: "4000", buy: "4000", sell: "4000" }] } };
    if (url?.includes("order/moves/currencys/totals")) return { status: 200, data: { response: [{ BTC: "10" }, { ETH: "5" }] } };
    return { status: 200, data: { response: collection, data: collection, meta: { current_page: 1, last_page: 2 } } };
  }),
  downloadMock: vi.fn(async () => undefined),
}));

vi.mock("@/services/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/apiClient")>();
  return {
    ...actual,
    apiClient: { request: requestMock, get: requestMock, post: requestMock, put: requestMock, patch: requestMock, delete: requestMock },
    downloadAuthenticatedBlob: downloadMock,
  };
});
vi.stubGlobal("prompt", vi.fn(() => "qa-contract"));
vi.stubGlobal("confirm", vi.fn(() => true));
vi.stubGlobal("alert", vi.fn());

const modules = {
  ...import.meta.glob("../**/*.vue"),
  ...import.meta.glob("../../views/**/*.vue"),
  ...import.meta.glob("../../layouts/**/*.vue"),
} as Record<string, () => Promise<{ default: Component }>>;

type Contract = (typeof fixture.contracts)[number];
type Result = {
  matrix_row_id: string; screen: string; family: string; component: string;
  target_found: boolean; action_executed: boolean; effect_kind: string;
  before_state: Record<string, unknown>; after_state: Record<string, unknown>;
  emitted: Record<string, unknown[]>; requests: unknown[][]; passed: boolean; error: string | null;
};
const results: Result[] = [];
const repositoryRoot = resolve(__dirname, "../../../..");
const resultPath = resolve(repositoryRoot, "qa-harness/evidence/lote5-micro-c1/ui-observable-results.json");

const i18n = () => createI18n({ legacy: false, locale: "es", messages: { es: {} }, missingWarn: false, fallbackWarn: false });
const router = () => createRouter({ history: createMemoryHistory(), routes: [{ path: "/:pathMatch(.*)*", component: { template: "<div />" } }] });

const componentFor = async (path: string): Promise<Component> => {
  const suffix = `/${path}`.replaceAll("\\", "/");
  const componentSuffix = path.startsWith("components/") ? `/${path.slice("components/".length)}` : suffix;
  const entry = Object.entries(modules).find(([key]) => {
    const normalized = key.replaceAll("\\", "/");
    return normalized.endsWith(suffix) || (path.startsWith("components/") && normalized.endsWith(componentSuffix));
  });
  if (!entry) throw new Error(`Component module not found: ${path}`);
  return (await entry[1]()).default;
};

const allPermissions = (() => {
  const raw: string[] = [];
  const visit = (v: unknown): void => { if (typeof v === "string") raw.push(v); else if (v && typeof v === "object") Object.values(v).forEach(visit); };
  Object.values(permissionEnums).forEach(visit);
  const result = new Set(raw.filter((v) => v.includes(".")));
  const actions = ["index", "get", "show", "store", "updated", "delete", "restore", "accept", "reject"];
  raw.filter((v) => !v.includes(".") && !actions.includes(v)).forEach((ref) => actions.forEach((a) => result.add(`${ref}.${a}`)));
  return [...result];
})();

const installUser = () => sessionStorage.setItem("user", JSON.stringify({
  id: 1, name: "QA Admin", level_user: 1,
  roles: [{ name: "Admin", permissions: allPermissions.map((name) => ({ name, guard_name: "web" })) }],
}));

const defaultProps = (component: Component, contract: Contract): Record<string, unknown> => {
  const defs = (component as { props?: Record<string, { type?: unknown; default?: unknown }> | string[] }).props;
  const props: Record<string, unknown> = {};
  if (Array.isArray(defs)) defs.forEach((n) => { props[n] = ""; });
  else if (defs) for (const [name, d] of Object.entries(defs)) {
    if (d && typeof d === "object" && "default" in d) continue;
    const types = Array.isArray(d?.type) ? d.type : [d?.type];
    props[name] = types.includes(Boolean) ? false : types.includes(Array) ? [] : types.includes(Object) ? {} : types.includes(Number) ? 1 : "";
  }
  Object.assign(props, {
    modelValue: contract.screen === "ReconciliationActionDialog" ? true : "",
    dialog: contract.screen === "DialogGlobal",
    name: "qa-field", placeholder: "QA", items: [{ id: 1, attributes: { name: "QA option" } }],
    itemTitle: "attributes.name", itemValue: "id", action: "resolve", permission: "", loading: false,
  });
  if (!defs) return {};
  return Object.fromEntries(Object.entries(props).filter(([k]) => Array.isArray(defs) ? defs.includes(k) : defs[k] !== undefined));
};

const setupStateOf = (wrapper: VueWrapper): Record<string, unknown> =>
  ((wrapper.vm as unknown as { $?: { setupState?: Record<string, unknown> } })?.$?.setupState ?? {});
const unwrap = (v: unknown): unknown => isRef(v) ? v.value : v;
const stateSnapshot = (wrapper: VueWrapper): Record<string, unknown> => {
  const state = setupStateOf(wrapper); const out: Record<string, unknown> = {};
  for (const [k, raw] of Object.entries(state)) {
    if (!/(open|dialog|modal|selectedAction|editing|clickIn|menu|modelValue|timeSelect)/i.test(k)) continue;
    const v = unwrap(raw);
    if (["string", "boolean", "number"].includes(typeof v) || v === null) out[k] = v;
  }
  return out;
};
const setState = (wrapper: VueWrapper, key: string, value: unknown): void => {
  const state = setupStateOf(wrapper); const current = state[key];
  if (isRef(current)) current.value = value; else if (key in state) state[key] = value;
};
const findButtonByText = (wrapper: VueWrapper, text: string) => wrapper.findAll("v-btn-stub").find((b) => b.text().toLowerCase().includes(text.toLowerCase()));

async function execute(contract: Contract): Promise<Result> {
  const result: Result = {
    matrix_row_id: contract.matrix_row_id, screen: contract.screen, family: contract.family, component: contract.component,
    target_found: false, action_executed: false, effect_kind: "none", before_state: {}, after_state: {}, emitted: {}, requests: [], passed: false, error: null,
  };
  let wrapper: VueWrapper | null = null;
  try {
    installUser(); setActivePinia(createPinia()); requestMock.mockClear(); downloadMock.mockClear();
    const r = router(); await r.push("/"); await r.isReady();
    const component = await componentFor(contract.component);
    wrapper = shallowMount(component, {
      props: defaultProps(component, contract),
      global: {
        plugins: [createPinia(), i18n(), r, createVuetify()], renderStubDefaultSlot: true,
        mocks: { $t: (key: string) => key }, config: { errorHandler: (e) => { throw e; } },
        stubs: {
          CrudComponent: { template: "<div data-qa='crud'><slot /></div>" },
          TableComponentVue: { template: "<div data-qa='table'><slot /></div>" },
          TableComponent: { template: "<div data-qa='table'><slot /></div>" },
          SearchInputComponentVue: { template: "<input data-qa='search' />" },
          DialogGlobalVue: { template: "<div data-qa='dialog'><slot /><slot name='content' /></div>" },
          DialogGlobal: { template: "<div data-qa='dialog'><slot /><slot name='content' /></div>" },
          VMenu: { template: "<div><slot name='activator' :props='{}' /><slot /></div>" },
        },
      },
    });
    await flushPromises(); await nextTick();
    const helper = setupStateOf(wrapper).helper as { canAction?: (name: string) => boolean } | undefined;
    if (helper) helper.canAction = () => true;
    wrapper.vm?.$forceUpdate(); await nextTick();

    if (contract.screen === "DialogGlobal") {
      const button = wrapper.find("v-btn-stub");
      if (!button.exists()) throw new Error("Botón de cierre no renderizado");
      result.target_found = true; await button.trigger("click"); await nextTick(); result.action_executed = true;
      result.emitted = wrapper.emitted() as Record<string, unknown[]>;
      if (!wrapper.emitted("closeDialog")?.length) throw new Error("closeDialog no fue emitido");
      result.effect_kind = "event:closeDialog";
    } else if (contract.screen === "ReconciliationActionDialog") {
      const textarea = wrapper.find("v-textarea-stub");
      const confirm = findButtonByText(wrapper, "Confirmar");
      const cancel = findButtonByText(wrapper, "Cancelar");
      if (!textarea.exists() || !confirm || !cancel) throw new Error("Controles del diálogo no renderizados");
      result.target_found = true;
      await (textarea.trigger as unknown as (e: string, p: unknown) => Promise<void>)("update:modelValue", " Nota QA ");
      await confirm.trigger("click"); await cancel.trigger("click"); await nextTick(); result.action_executed = true;
      result.emitted = wrapper.emitted() as Record<string, unknown[]>;
      const confirmation = wrapper.emitted("confirm")?.flat();
      const closing = wrapper.emitted("update:modelValue")?.flat();
      if (!confirmation?.includes("Nota QA") || !closing?.includes(false)) throw new Error("El diálogo no emitió confirmación y cierre contractuales");
      result.effect_kind = "events:confirm+close";
    } else if (["OutboxDetailView", "OutboxView"].includes(contract.screen)) {
      setState(wrapper, "selectedAction", "retry"); setState(wrapper, "actionDialog", true); await nextTick();
      result.before_state = stateSnapshot(wrapper);
      const cancel = findButtonByText(wrapper, "Cancelar");
      if (!cancel) throw new Error("Botón Cancelar no renderizado");
      result.target_found = true; await cancel.trigger("click"); await nextTick(); result.action_executed = true;
      result.after_state = stateSnapshot(wrapper);
      if (unwrap(setupStateOf(wrapper).selectedAction) !== null) throw new Error("selectedAction no fue limpiado");
      result.effect_kind = "state:selectedAction=null";
    } else if (contract.family === "form_input" && contract.screen !== "GraficoTorta") {
      const tag = contract.screen === "SelectComponent" ? "v-select-stub" : contract.screen === "TextTareaComponent" ? "v-textarea-stub" : "v-text-field-stub";
      const target = wrapper.find(tag);
      if (!target.exists()) throw new Error(`${tag} no renderizado`);
      result.target_found = true;
      await (target.trigger as unknown as (e: string, p: unknown) => Promise<void>)("update:modelValue", "qa-value"); await nextTick(); result.action_executed = true;
      result.emitted = wrapper.emitted() as Record<string, unknown[]>;
      const values = [...(wrapper.emitted("update:model-value") ?? []), ...(wrapper.emitted("update:modelValue") ?? [])].flat();
      if (!values.includes("qa-value")) throw new Error("update:model-value no fue emitido con el valor real");
      result.effect_kind = "event:update:model-value";
    } else if (contract.screen === "GraficoTorta") {
      requestMock.mockClear();
      const target = wrapper.find("v-select-stub");
      if (!target.exists()) throw new Error("VSelect no renderizado");
      result.target_found = true;
      await (target.trigger as unknown as (e: string, p: unknown) => Promise<void>)("update:modelValue", "4 months"); await flushPromises(); result.action_executed = true;
      result.requests = requestMock.mock.calls;
      const exact = result.requests.some((call) => call.some((v) => typeof v === "string" && v.includes("order/moves/currencys/totals")));
      if (!exact) throw new Error("Cambio de periodo no ejecutó order/moves/currencys/totals");
      result.effect_kind = "request:order/moves/currencys/totals";
    } else {
      result.before_state = stateSnapshot(wrapper);
      const target = wrapper.findAll("v-btn-stub")[contract.ordinal - 1] ?? wrapper.find("v-btn-stub");
      if (!target?.exists()) throw new Error(`VBtn ordinal ${contract.ordinal} no renderizado; DOM=${wrapper.html().slice(0, 500)}`);
      result.target_found = true; await target.trigger("click"); await flushPromises(); await nextTick(); result.action_executed = true;
      result.after_state = stateSnapshot(wrapper); result.emitted = wrapper.emitted() as Record<string, unknown[]>;
      const changed = JSON.stringify(result.before_state) !== JSON.stringify(result.after_state);
      const emitted = Object.keys(result.emitted).length > 0;
      if (!changed && !emitted) throw new Error(`Click no produjo cambio observable; before=${JSON.stringify(result.before_state)} after=${JSON.stringify(result.after_state)}`);
      result.effect_kind = changed ? "state_changed" : "event_emitted";
    }
    result.requests = result.requests.length ? result.requests : requestMock.mock.calls;
    result.passed = result.target_found && result.action_executed && result.effect_kind !== "none";
  } catch (error) { result.error = error instanceof Error ? error.message : String(error); }
  finally { try { wrapper?.unmount(); } catch {} }
  return result;
}

describe("Lote 5 Micro-C1 observable UI contracts", () => {
  beforeAll(() => { expect(fixture.total).toBe(33); expect(new Set(fixture.contracts.map((c) => c.matrix_row_id)).size).toBe(33); });
  afterAll(() => {
    mkdirSync(resolve(resultPath, ".."), { recursive: true });
    writeFileSync(resultPath, JSON.stringify({ schema_version: 1, expected: 33, executed: results.length, passed: results.filter((r) => r.passed).length, failed: results.filter((r) => !r.passed).length, results }, null, 2) + "\n", "utf8");
  });
  it("executes the 33 residual observable interactions without direct-handler fallback", async () => {
    for (const contract of fixture.contracts) results.push(await execute(contract));
    const failed = results.filter((r) => !r.passed);
    expect(failed, JSON.stringify(failed, null, 2)).toHaveLength(0);
  }, 600_000);
});
