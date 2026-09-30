import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPinia, setActivePinia } from "pinia";
import { flushPromises, shallowMount, type VueWrapper } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h, isRef, nextTick, type Component } from "vue";
import { createVuetify } from "vuetify";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as permissionEnums from "@/enums/Permissions.enum";
import { helperStore } from "@/helper";
import fixture from "./fixtures/lote5_micro_c1b_observable_contracts.json";

const { requestMock, downloadMock } = vi.hoisted(() => ({
  requestMock: vi.fn(async (...args: unknown[]) => {
    const methods = new Set(["get", "post", "put", "patch", "delete"]);
    const url = args.find((v) => typeof v === "string" && !methods.has(v.toLowerCase())) as string | undefined;
    const item = {
      id: 1,
      uuid: "qa-outbox-1",
      name: "QA contract",
      status: "failed",
      event_type: "qa.event",
      attempts: 1,
      max_attempts: 3,
      attributes: { id: 1, name: "QA contract", status: true, deleted_at: null, deletedAt: null },
      relationships: {
        country: { id: 1, attributes: { name: "Colombia" } },
        images: [],
        currency: { id: 1, attributes: { name: "Bitcoin", abbreviation: "BTC" } },
      },
    };
    const collection = Object.assign([item], { data: [item], current_page: 1, last_page: 2, to: 1 });
    if (url === "public/ticker") {
      return { status: 200, data: { data: [{ symbol: "BTC", oficial: "4000", buy: "4000", sell: "4000" }] } };
    }
    if (url?.includes("order/moves/currencys/totals")) {
      return { status: 200, data: { response: [{ BTC: "10" }, { ETH: "5" }] } };
    }
    return {
      status: 200,
      data: {
        response: collection,
        data: collection,
        meta: { current_page: 1, last_page: 2, total: 1, per_page: 15 },
      },
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

const modules = {
  ...import.meta.glob("../**/*.vue"),
  ...import.meta.glob("../../views/**/*.vue"),
  ...import.meta.glob("../../layouts/**/*.vue"),
} as Record<string, () => Promise<{ default: Component }>>;

type Contract = (typeof fixture.contracts)[number];
type Result = {
  matrix_row_id: string;
  screen: string;
  family: string;
  component: string;
  target_found: boolean;
  action_executed: boolean;
  effect_kind: string;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  emitted: Record<string, unknown[]>;
  requests: unknown[][];
  passed: boolean;
  error: string | null;
};

const results: Result[] = [];
const repositoryRoot = resolve(__dirname, "../../../..");
const resultPath = resolve(
  repositoryRoot,
  "qa-harness/evidence/lote5-micro-c1b/ui-observable-correction-results.json",
);

const i18n = () =>
  createI18n({
    legacy: false,
    locale: "es",
    messages: { es: {} },
    missingWarn: false,
    fallbackWarn: false,
  });

const router = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: { template: "<div />" } }],
  });

const NativeTextFieldStub = defineComponent({
  name: "VTextField",
  props: {
    modelValue: { default: "" },
    disabled: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
  template:
    '<input data-qa="native-input" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
});

const NativeTextareaStub = defineComponent({
  name: "VTextarea",
  props: {
    modelValue: { default: "" },
    disabled: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
  template:
    '<textarea data-qa="native-textarea" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
});

const SlotSelectStub = defineComponent({
  name: "VSelect",
  props: {
    items: { type: Array, default: () => [] },
    itemValue: { type: String, default: "id" },
  },
  setup(props, { slots }) {
    return () => {
      const list = props.items as Array<Record<string, unknown>>;
      const selected = list.find((item) => item?.id !== "") ?? list[0] ?? { id: 1 };
      const value = selected?.[props.itemValue] ?? selected?.id ?? 1;
      return h("div", { "data-qa": "slot-select" }, slots.item?.({ props: { value } }));
    };
  },
});

const NativeListItemStub = defineComponent({
  name: "VListItem",
  inheritAttrs: true,
  template: '<button type="button" data-qa="select-option"><slot /></button>',
});

const NativeSelectStub = defineComponent({
  name: "VSelect",
  props: {
    modelValue: { default: "" },
    items: { type: Array, default: () => [] },
    itemTitle: { type: String, default: "title" },
    itemValue: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const valueOf = (item: unknown): string | number => {
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return String(
          (props.itemValue ? record[props.itemValue] : undefined) ??
            record.title ??
            record.value ??
            record.id ??
            "",
        );
      }
      return String(item ?? "");
    };
    const labelOf = (item: unknown): string => {
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return String(record[props.itemTitle] ?? record.title ?? record.name ?? valueOf(item));
      }
      return String(item ?? "");
    };
    return () =>
      h(
        "select",
        {
          "data-qa": "native-select",
          value: String(props.modelValue ?? ""),
          disabled: props.disabled,
          onChange: (event: Event) =>
            emit("update:modelValue", (event.target as HTMLSelectElement).value),
        },
        (props.items as unknown[]).map((item, index) =>
          h("option", { key: index, value: valueOf(item) }, labelOf(item)),
        ),
      );
  },
});

const componentFor = async (path: string): Promise<Component> => {
  const suffix = `/${path}`.replaceAll("\\", "/");
  const componentSuffix = path.startsWith("components/")
    ? `/${path.slice("components/".length)}`
    : suffix;
  const entry = Object.entries(modules).find(([key]) => {
    const normalized = key.replaceAll("\\", "/");
    return (
      normalized.endsWith(suffix) ||
      (path.startsWith("components/") && normalized.endsWith(componentSuffix))
    );
  });
  if (!entry) throw new Error(`Component module not found: ${path}`);
  return (await entry[1]()).default;
};

const allPermissions = (() => {
  const raw: string[] = [];
  const visit = (value: unknown): void => {
    if (typeof value === "string") raw.push(value);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  };
  Object.values(permissionEnums).forEach(visit);
  const result = new Set(raw.filter((value) => value.includes(".")));
  const actions = ["index", "get", "show", "store", "updated", "delete", "restore", "accept", "reject"];
  raw
    .filter((value) => !value.includes(".") && !actions.includes(value))
    .forEach((reference) => actions.forEach((action) => result.add(`${reference}.${action}`)));
  return [...result];
})();

const installUser = () =>
  sessionStorage.setItem(
    "user",
    JSON.stringify({
      id: 1,
      name: "QA Admin",
      level_user: 1,
      roles: [
        {
          name: "Admin",
          permissions: allPermissions.map((name) => ({ name, guard_name: "web" })),
        },
      ],
    }),
  );

const defaultProps = (component: Component, contract: Contract): Record<string, unknown> => {
  const defs = (
    component as {
      props?: Record<string, { type?: unknown; default?: unknown }> | string[];
    }
  ).props;
  const props: Record<string, unknown> = {};
  if (Array.isArray(defs)) {
    defs.forEach((name) => {
      props[name] = "";
    });
  } else if (defs) {
    for (const [name, definition] of Object.entries(defs)) {
      if (definition && typeof definition === "object" && "default" in definition) continue;
      const types = Array.isArray(definition?.type) ? definition.type : [definition?.type];
      props[name] = types.includes(Boolean)
        ? false
        : types.includes(Array)
          ? []
          : types.includes(Object)
            ? {}
            : types.includes(Number)
              ? 1
              : "";
    }
  }

  Object.assign(props, {
    modelValue: contract.screen === "ReconciliationActionDialog" ? true : "",
    dialog: contract.screen === "DialogGlobal",
    name: "qa-field",
    placeholder: "QA",
    items: [{ id: 1, attributes: { name: "QA option" } }],
    itemTitle: "attributes.name",
    itemValue: "id",
    action: "resolve",
    permission: "",
    loading: false,
  });

  if (!defs) return {};
  return Object.fromEntries(
    Object.entries(props).filter(([key]) =>
      Array.isArray(defs) ? defs.includes(key) : defs[key] !== undefined,
    ),
  );
};

const setupStateOf = (wrapper: VueWrapper): Record<string, unknown> =>
  ((wrapper.vm as unknown as { $?: { setupState?: Record<string, unknown> } })?.$?.setupState ??
    {});

const setRawState = (state: Record<string, unknown>, key: string, value: unknown): void => {
  const current = state[key];
  if (isRef(current)) current.value = value;
  else state[key] = value;
};

const readRawState = (state: Record<string, unknown>, key: string): unknown => {
  const current = state[key];
  return isRef(current) ? current.value : current;
};

const findButtonByText = (wrapper: VueWrapper, text: string) =>
  wrapper
    .findAll("v-btn-stub")
    .find((button) => button.text().toLowerCase().includes(text.toLowerCase()));

const baseStubs = {
  CrudComponent: { template: "<div data-qa='crud'><slot /></div>" },
  TableComponentVue: { template: "<div data-qa='table'><slot /></div>" },
  TableComponent: { template: "<div data-qa='table'><slot /></div>" },
  SearchInputComponentVue: { template: "<input data-qa='search' />" },
  DialogGlobalVue: {
    template: "<div data-qa='dialog'><slot /><slot name='content' /></div>",
  },
  DialogGlobal: {
    template: "<div data-qa='dialog'><slot /><slot name='content' /></div>",
  },
  VMenu: {
    template: "<div><slot name='activator' :props='{}' /><slot /></div>",
  },
};

async function execute(contract: Contract): Promise<Result> {
  const result: Result = {
    matrix_row_id: contract.matrix_row_id,
    screen: contract.screen,
    family: contract.family,
    component: contract.component,
    target_found: false,
    action_executed: false,
    effect_kind: "none",
    before_state: {},
    after_state: {},
    emitted: {},
    requests: [],
    passed: false,
    error: null,
  };

  let wrapper: VueWrapper | null = null;

  try {
    installUser();
    const pinia = createPinia();
    setActivePinia(pinia);
    requestMock.mockClear();
    downloadMock.mockClear();

    const appRouter = router();
    await appRouter.push("/");
    await appRouter.isReady();

    const component = await componentFor(contract.component);
    const stubs: Record<string, Component | boolean> = { ...baseStubs };
    if (contract.screen === "InputComponent") stubs.VTextField = NativeTextFieldStub;
    if (["TextTareaComponent", "ReconciliationActionDialog"].includes(contract.screen)) {
      stubs.VTextarea = NativeTextareaStub;
    }
    if (contract.screen === "SelectComponent") {
      stubs.VSelect = SlotSelectStub;
      stubs.VListItem = NativeListItemStub;
    }
    if (contract.screen === "GraficoTorta") stubs.VSelect = NativeSelectStub;

    wrapper = shallowMount(component, {
      props: defaultProps(component, contract),
      global: {
        plugins: [pinia, i18n(), appRouter, createVuetify()],
        renderStubDefaultSlot: true,
        mocks: { $t: (key: string) => key },
        config: {
          errorHandler: (error) => {
            throw error;
          },
        },
        stubs,
      },
    });

    await flushPromises();
    await nextTick();

    const helper = helperStore();

    if (contract.screen === "InputComponent" || contract.screen === "TextTareaComponent") {
      const selector =
        contract.screen === "InputComponent"
          ? '[data-qa="native-input"]'
          : '[data-qa="native-textarea"]';
      const target = wrapper.find(selector);
      if (!target.exists()) throw new Error(`${selector} no renderizado`);
      result.target_found = true;
      await target.setValue("qa-value");
      await nextTick();
      result.action_executed = true;
      result.emitted = wrapper.emitted() as Record<string, unknown[]>;
      const values = [
        ...(wrapper.emitted("update:model-value") ?? []),
        ...(wrapper.emitted("update:modelValue") ?? []),
      ].flat();
      if (!values.includes("qa-value")) {
        throw new Error("El componente no propagó update:model-value con qa-value");
      }
      await wrapper.setProps({ disabled: true });
      await nextTick();
      if (wrapper.find(selector).attributes("disabled") === undefined) {
        throw new Error("El estado disabled no fue propagado al control real");
      }
      result.effect_kind = "event:update:model-value+disabled";
    } else if (contract.screen === "SelectComponent") {
      const option = wrapper.find('[data-qa="select-option"]');
      if (!option.exists()) throw new Error("La opción seleccionable no fue renderizada");
      result.target_found = true;
      await option.trigger("click");
      await nextTick();
      result.action_executed = true;
      result.emitted = wrapper.emitted() as Record<string, unknown[]>;
      const beforeDisabled = [
        ...(wrapper.emitted("update:model-value") ?? []),
        ...(wrapper.emitted("update:modelValue") ?? []),
      ];
      const values = beforeDisabled.flat();
      if (!values.some((value) => String(value) === "1")) {
        throw new Error("SelectComponent no emitió la opción real seleccionada");
      }
      await wrapper.setProps({ disabled: true });
      await nextTick();
      await wrapper.find('[data-qa="select-option"]').trigger("click");
      await nextTick();
      const afterDisabled = [
        ...(wrapper.emitted("update:model-value") ?? []),
        ...(wrapper.emitted("update:modelValue") ?? []),
      ];
      if (afterDisabled.length !== beforeDisabled.length) {
        throw new Error("SelectComponent emitió una selección estando disabled");
      }
      result.effect_kind = "event:selected-value+disabled-guard";
    } else if (contract.screen === "ReconciliationActionDialog") {
      const textarea = wrapper.find('[data-qa="native-textarea"]');
      const confirmButton = findButtonByText(wrapper, "Confirmar");
      const cancelButton = findButtonByText(wrapper, "Cancelar");
      if (!textarea.exists() || !confirmButton || !cancelButton) {
        throw new Error("Controles del diálogo no renderizados");
      }
      result.target_found = true;
      await textarea.setValue(" Nota QA ");
      await confirmButton.trigger("click");
      await cancelButton.trigger("click");
      await nextTick();
      result.action_executed = true;
      result.emitted = wrapper.emitted() as Record<string, unknown[]>;
      const confirmations = (wrapper.emitted("confirm") ?? []).flat();
      const closing = (wrapper.emitted("update:modelValue") ?? []).flat();
      if (!confirmations.includes("Nota QA")) {
        throw new Error("El diálogo no emitió confirm con la nota recortada");
      }
      if (!closing.includes(false)) {
        throw new Error("Cancelar no emitió update:modelValue=false");
      }
      result.effect_kind = "events:confirm-trimmed+cancel-close";
    } else if (contract.screen === "OutboxView") {
      const state = setupStateOf(wrapper);
      if (!("selectedAction" in state)) {
        throw new Error("OutboxView no expuso selectedAction en setupState");
      }
      setRawState(state, "selectedAction", {
        action: "retry",
        event: {
          id: 1,
          uuid: "qa-outbox-1",
          status: "failed",
          event_type: "qa.event",
          attempts: 1,
          max_attempts: 3,
        },
      });
      await nextTick();
      const cancelButton = findButtonByText(wrapper, "Cancelar");
      if (!cancelButton) throw new Error("Botón Cancelar de Outbox no renderizado");
      result.target_found = true;
      result.before_state = { selectedAction: "retry:qa-outbox-1" };
      await cancelButton.trigger("click");
      await nextTick();
      result.action_executed = true;
      const selectedAfter = readRawState(state, "selectedAction");
      result.after_state = { selectedAction: selectedAfter ?? null };
      if (selectedAfter !== null) {
        throw new Error("Cancelar no limpió selectedAction");
      }
      result.effect_kind = "state:selectedAction=null";
    } else if (contract.screen === "GraficoTorta") {
      await flushPromises();
      requestMock.mockClear();
      const target = wrapper.find('[data-qa="native-select"]');
      if (!target.exists()) throw new Error("Selector de periodo no renderizado");
      result.target_found = true;
      await target.setValue("4 months");
      await flushPromises();
      await nextTick();
      result.action_executed = true;
      result.requests = requestMock.mock.calls;
      const exact = requestMock.mock.calls.find((call) => {
        const endpoint = call.find(
          (value) =>
            typeof value === "string" &&
            value.includes("order/moves/currencys/totals"),
        );
        const options = call.find(
          (value) =>
            Boolean(value) &&
            typeof value === "object" &&
            "params" in (value as Record<string, unknown>),
        ) as { params?: { fec_ini?: string; fec_end?: string } } | undefined;
        return (
          Boolean(endpoint) &&
          Boolean(options?.params?.fec_ini) &&
          Boolean(options?.params?.fec_end)
        );
      });
      if (!exact) {
        throw new Error("El periodo no ejecutó el endpoint exacto con fec_ini/fec_end");
      }
      result.effect_kind = "request:order/moves/currencys/totals";
    } else {
      const target =
        wrapper.findAll("v-btn-stub")[contract.ordinal - 1] ?? wrapper.find("v-btn-stub");
      if (!target?.exists()) {
        throw new Error(`VBtn ordinal ${contract.ordinal} no renderizado`);
      }
      result.target_found = true;
      result.before_state = {
        openModalCrud: helper.openModalCrud,
        clickIn: helper.clickIn,
      };
      await target.trigger("click");
      await flushPromises();
      await nextTick();
      result.action_executed = true;
      result.after_state = {
        openModalCrud: helper.openModalCrud,
        clickIn: helper.clickIn,
      };
      if (helper.openModalCrud !== true || helper.clickIn !== "Create") {
        throw new Error(
          `openModal no actualizó el store: open=${String(helper.openModalCrud)} clickIn=${String(helper.clickIn)}`,
        );
      }
      result.effect_kind = "store:openModalCrud=true+clickIn=Create";
    }

    if (!result.requests.length) result.requests = requestMock.mock.calls;
    result.passed =
      result.target_found && result.action_executed && result.effect_kind !== "none";
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  } finally {
    try {
      wrapper?.unmount();
    } catch {}
    vi.restoreAllMocks();
  }

  return result;
}

describe("Lote 5 Micro-C1b observable UI corrections", () => {
  beforeAll(() => {
    expect(fixture.total).toBe(11);
    expect(new Set(fixture.contracts.map((contract) => contract.matrix_row_id)).size).toBe(11);
  });

  afterAll(() => {
    mkdirSync(resolve(resultPath, ".."), { recursive: true });
    writeFileSync(
      resultPath,
      `${JSON.stringify(
        {
          schema_version: 2,
          expected: 11,
          executed: results.length,
          passed: results.filter((result) => result.passed).length,
          failed: results.filter((result) => !result.passed).length,
          results,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  });

  it("executes only the 11 failed C1 contracts with real observable effects", async () => {
    for (const contract of fixture.contracts) results.push(await execute(contract));
    const failed = results.filter((result) => !result.passed);
    expect(failed, JSON.stringify(failed, null, 2)).toHaveLength(0);
  }, 300_000);
});
