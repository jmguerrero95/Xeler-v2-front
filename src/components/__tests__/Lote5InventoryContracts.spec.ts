import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ButtonComponent from "@/components/ButtonComponent.vue";
import DialogGlobal from "@/components/global/DialogGlobal.vue";

const repositoryRoot = resolve(__dirname, "../../../..");
const frontSource = resolve(repositoryRoot, "front/src");
const evidence = resolve(repositoryRoot, "qa-harness/evidence/lote5");

const parseCsv = (input: string): Record<string, string>[] => {
  const records: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      row.push(value);
      value = "";
      if (row.some(Boolean)) records.push(row);
      row = [];
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    records.push(row);
  }

  const [headers = [], ...data] = records;
  return data.map((values) => Object.fromEntries(
    headers.map((header, index) => [header, values[index] ?? ""]),
  ));
};

const readCsv = (name: string) => parseCsv(readFileSync(resolve(evidence, name), "utf8"));

describe("Lote 5 inventory contracts", () => {
  it("traces every scoped matrix row to one exact source or economic member", () => {
    const scope = readCsv("QA_LOTE5_SCOPE_MATRIX.csv");
    const identifiers = new Set(scope.map((row) => row.matrix_row_id));

    expect(scope).toHaveLength(1377);
    expect(identifiers.size).toBe(1377);
    expect(scope.filter((row) => row.source_module === "views")).toHaveLength(436);
    expect(scope.filter((row) => row.source_module === "components")).toHaveLength(31);
    expect(scope.filter((row) => row.source_module === "layouts")).toHaveLength(7);
    expect(scope.filter((row) => row.source_module === "Compra")).toHaveLength(364);
    expect(scope.filter((row) => row.source_module === "Venta")).toHaveLength(539);

    for (const contract of scope.filter((row) => ["views", "components", "layouts"].includes(row.source_module))) {
      const path = resolve(frontSource, contract.component);
      expect(existsSync(path), `${contract.matrix_row_id}: ${contract.component}`).toBe(true);
      const marker = contract.equivalence_basis.split("|").at(-1)?.split("@")[0]?.replace(/#\d+$/, "");
      expect(readFileSync(path, "utf8"), contract.matrix_row_id).toContain(marker);
    }
  });

  it("keeps the complete active route inventory resolvable", () => {
    const routes = readCsv("QA_LOTE5_ROUTE_INVENTORY.csv");
    expect(routes).toHaveLength(87);
    expect(new Set(routes.map((route) => `${route.path}|${route.component}`)).size).toBe(87);

    for (const route of routes) {
      expect(existsSync(resolve(frontSource, route.component)), `${route.path}: ${route.component}`).toBe(true);
      expect(route.lazy_loading).toBe("true");
      expect(basename(route.component)).toBeTruthy();
    }
  });

  it("emits a shared button action once and blocks it while disabled", async () => {
    const VBtn = {
      props: ["disabled"],
      emits: ["click"],
      template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    };
    const wrapper = mount(ButtonComponent, {
      props: { disabled: false },
      slots: { default: "Continuar" },
      global: { stubs: { VBtn } },
    });

    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("click:append-icon")).toHaveLength(1);
    await wrapper.setProps({ disabled: true });
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("click:append-icon")).toHaveLength(1);
  });

  it("gives the icon-only dialog close action a name and emits one close", async () => {
    const wrapper = mount(DialogGlobal, {
      props: { dialog: true },
      global: {
        stubs: {
          VDialog: { template: '<div role="dialog"><slot /></div>' },
          VBtn: {
            inheritAttrs: false,
            emits: ["click"],
            template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
          },
          VCard: { template: "<section><slot /></section>" },
          VCardTitle: { template: "<header><slot /></header>" },
          VCardSubtitle: { template: "<div><slot /></div>" },
          VCardText: { template: "<main><slot /></main>" },
          VCardActions: { template: "<footer><slot /></footer>" },
        },
      },
    });

    const close = wrapper.get("button");
    expect(close.attributes("aria-label")).toBe("Cerrar dialogo");
    await close.trigger("click");
    expect(wrapper.emitted("closeDialog")).toHaveLength(1);
  });

  it("does not ship the orphan legacy Google browser-key bundle", () => {
    expect(existsSync(resolve(repositoryRoot, "back/public/images/app.js"))).toBe(false);
  });

  it("guards the administrative profile route while preserving shared own activity", () => {
    const router = readFileSync(resolve(frontSource, "router/admin.ts"), "utf8");
    const profileBlock = router.match(/name:\s*"admin-profile"[\s\S]*?(?=name:\s*"activities")/)?.[0] ?? "";
    const activityBlock = router.match(/name:\s*"activities"[\s\S]*?\n\s*},/)?.[0] ?? "";

    expect(profileBlock).toContain("beforeEnter: checkedRole");
    expect(profileBlock).toContain('"Superadmin"');
    expect(profileBlock).toContain('"Soporte"');
    expect(activityBlock).not.toContain("beforeEnter");
  });

  it("names both desktop and mobile profile menu controls", () => {
    const header = readFileSync(resolve(frontSource, "layouts/full/header/Header.vue"), "utf8");
    expect(header.match(/aria-label="Abrir menu de perfil"/g)).toHaveLength(2);
  });

  it("renders admin self-service safely without user detail and resolves configuration permissions", () => {
    const profile = readFileSync(resolve(frontSource, "views/admin/profile/PersonalData.vue"), "utf8");
    const router = readFileSync(resolve(frontSource, "router/admin.ts"), "utf8");

    expect(profile).not.toMatch(/userDetail\.attributes/);
    expect(router).toContain("const configurationLanding = async () =>");
    expect(router).toContain("await userStore.loadCurrentUser()");
  });
});
