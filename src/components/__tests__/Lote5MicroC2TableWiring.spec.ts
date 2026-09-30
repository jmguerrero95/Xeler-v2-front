import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPinia, setActivePinia } from "pinia";
import { mount, type VueWrapper } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import { defineComponent, nextTick } from "vue";
import { afterAll, describe, expect, it, vi } from "vitest";
import TableComponent from "@/components/global/TableComponent.vue";
import { helperStore } from "@/helper";
import fixture from "./fixtures/lote5_micro_c2_table_wiring_contracts.json";

const permissionState = vi.hoisted(() => ({ allowed: true }));

vi.mock("@/stores/UserStore", () => ({
  UserStore: () => ({
    hasPermission: () => permissionState.allowed,
  }),
}));

vi.mock("@/composables/useTwoFactorGuard", () => ({
  useTwoFactorGuard: () => ({
    runWithTwoFactor: async (callback: () => Promise<void> | void) => callback(),
  }),
}));

type Contract = (typeof fixture.contracts)[number];

type Result = {
  matrix_row_id: string;
  screen: string;
  component: string;
  mode: string;
  source_tag_found: boolean;
  source_wiring_verified: boolean;
  handler_declared: boolean;
  handler_effect_verified: boolean;
  shared_component_contract: string;
  passed: boolean;
  error: string | null;
};

const results: Result[] = [];
const shared = {
  update: false,
  show: false,
  read_only: false,
  permission_denied: false,
};

const repositoryRoot = resolve(__dirname, "../../../..");
const resultPath = resolve(
  repositoryRoot,
  "qa-harness/evidence/lote5-micro-c2/table-wiring-results.json",
);

const i18n = () =>
  createI18n({
    legacy: false,
    locale: "es",
    messages: { es: {} },
    missingWarn: false,
    fallbackWarn: false,
  });

const VMenuStub = defineComponent({
  name: "VMenu",
  template: "<div data-qa='menu'><slot name='activator' :props='{}' /><slot /></div>",
});

const VBtnStub = defineComponent({
  name: "VBtn",
  inheritAttrs: false,
  emits: ["click"],
  template:
    "<button type='button' v-bind='$attrs' @click=\"$emit('click')\"><slot /></button>",
});

const VListItemTitleStub = defineComponent({
  name: "VListItemTitle",
  inheritAttrs: false,
  emits: ["click"],
  template:
    "<div role='button' tabindex='0' data-qa='list-action' v-bind='$attrs' @click=\"$emit('click')\"><slot /></div>",
});

const passthrough = (name: string, tag = "div") =>
  defineComponent({
    name,
    template: `<${tag}><slot /></${tag}>`,
  });

const tableStubs = {
  VRow: passthrough("VRow"),
  VCol: passthrough("VCol"),
  VTable: passthrough("VTable", "table"),
  VChip: passthrough("VChip", "span"),
  VList: passthrough("VList"),
  VListItem: passthrough("VListItem"),
  VListItemTitle: VListItemTitleStub,
  VMenu: VMenuStub,
  VBtn: VBtnStub,
  VIcon: passthrough("VIcon", "span"),
  VPagination: passthrough("VPagination"),
  VSelect: passthrough("VSelect"),
  DialogConfirm: passthrough("DialogConfirm"),
};

const mountTable = (props: Record<string, unknown>): VueWrapper => {
  const pinia = createPinia();
  setActivePinia(pinia);
  return mount(TableComponent, {
    props: {
      optionsHabilit: true,
      headers: [
        { name: "Name", value: "attributes.name" },
        { name: "Actions", value: "actions" },
      ],
      items: [
        {
          id: 1,
          attributes: {
            name: "QA item",
            deleted_at: null,
            deletedAt: null,
          },
        },
      ],
      permissionReference: "qa-table",
      ...props,
    },
    global: {
      plugins: [pinia, i18n()],
      mocks: { $t: (key: string) => key, $vuetify: { display: { xs: false } } },
      stubs: tableStubs,
    },
  });
};

const actionByText = (wrapper: VueWrapper, text: string) =>
  wrapper
    .findAll("[data-qa='list-action']")
    .find((candidate) => candidate.text().includes(text));

describe.sequential("Lote 5 Micro-C2 shared table and exact view wiring", () => {
  it("executes the real shared update and show contracts", async () => {
    permissionState.allowed = true;

    const update = mountTable({ iconUpdate: true });
    const updateAction = actionByText(update, "general-views.edit");
    expect(updateAction, "Update action was not rendered").toBeTruthy();
    await updateAction!.trigger("click");
    await nextTick();
    expect(update.emitted("update")).toHaveLength(1);
    expect(helperStore().clickIn).toBe("Edit");
    shared.update = true;
    update.unmount();

    const show = mountTable({ iconShow: true });
    const showAction = actionByText(show, "general-views.show");
    expect(showAction, "Show action was not rendered").toBeTruthy();
    await showAction!.trigger("click");
    await nextTick();
    expect(show.emitted("show")).toHaveLength(1);
    expect(helperStore().clickIn).toBe("Show");
    shared.show = true;
    show.unmount();
  });

  it("keeps read-only tables actionless and blocks unauthorized actions", () => {
    permissionState.allowed = true;
    const readOnly = mountTable({
      optionsHabilit: false,
      iconUpdate: true,
      iconShow: true,
      iconDelete: true,
    });
    expect(readOnly.findAll("[data-qa='list-action']")).toHaveLength(0);
    shared.read_only = true;
    readOnly.unmount();

    permissionState.allowed = false;
    const denied = mountTable({ iconUpdate: true, iconShow: true, iconDelete: true });
    expect(denied.findAll("[data-qa='list-action']")).toHaveLength(0);
    shared.permission_denied = true;
    denied.unmount();
    permissionState.allowed = true;
  });

  it.each(fixture.contracts)(
    "$matrix_row_id verifies $screen table wiring",
    (contract: Contract) => {
      const result: Result = {
        matrix_row_id: contract.matrix_row_id,
        screen: contract.screen,
        component: contract.component,
        mode: contract.mode,
        source_tag_found: false,
        source_wiring_verified: false,
        handler_declared: contract.mode === "read_only",
        handler_effect_verified: contract.mode === "read_only",
        shared_component_contract: contract.mode,
        passed: false,
        error: null,
      };

      try {
        const sourcePath = resolve(repositoryRoot, "front/src", contract.component);
        const source = readFileSync(sourcePath, "utf8");
        const tag = source.match(/<TableComponent(?:Vue)?\b[\s\S]*?>/)?.[0] ?? "";
        expect(tag, `${contract.matrix_row_id}: TableComponent tag`).not.toBe("");
        result.source_tag_found = true;

        expect(tag).toContain(':headers="headers"');
        expect(tag).toMatch(/:items\s*=\s*"[^"]+"/);

        if (contract.mode === "read_only") {
          expect(tag).toMatch(/:optionsHabilit\s*=\s*"false"/);
          expect(shared.read_only).toBe(true);
          expect(shared.permission_denied).toBe(true);
          result.source_wiring_verified = true;
          result.shared_component_contract = "read_only+permission_denied";
        } else {
          expect(tag).not.toMatch(/:optionsHabilit\s*=\s*"false"/);
          expect(tag).toMatch(/\boptionsHabilit\b/);

          if (contract.mode === "update") {
            expect(tag).toMatch(/\bicon-update\b/);
            expect(tag).toContain(`@update="${contract.handler}"`);
            expect(shared.update).toBe(true);
          } else {
            expect(tag).toMatch(/\bicon-show\b/);
            expect(tag).toContain(`@show="${contract.handler}"`);
            expect(shared.show).toBe(true);
          }

          const declaration = new RegExp(
            `(?:const\\s+${contract.handler}\\b|function\\s+${contract.handler}\\b)`,
          );
          expect(source).toMatch(declaration);
          result.handler_declared = true;

          const handlerIndex = source.search(declaration);
          const handlerWindow = source.slice(handlerIndex, handlerIndex + 2400);
          const hasObservableEffect =
            /(openModalCrud|clickIn|itemH|itemHelper|formCrud|router\.(?:push|replace)|selected|dialog)/.test(
              handlerWindow,
            );
          expect(
            hasObservableEffect,
            `${contract.matrix_row_id}: handler ${contract.handler} has no observable effect marker`,
          ).toBe(true);
          result.handler_effect_verified = true;
          result.source_wiring_verified = true;
        }

        result.passed =
          result.source_tag_found &&
          result.source_wiring_verified &&
          result.handler_declared &&
          result.handler_effect_verified;
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
      }

      results.push(result);
      expect(result.passed, result.error ?? contract.matrix_row_id).toBe(true);
    },
  );
});

afterAll(() => {
  mkdirSync(resolve(resultPath, ".."), { recursive: true });
  const payload = {
    schema_version: 1,
    expected: fixture.total,
    executed: results.length,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    shared_component_contracts: shared,
    modes: fixture.modes,
    results,
  };
  writeFileSync(resultPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
});
