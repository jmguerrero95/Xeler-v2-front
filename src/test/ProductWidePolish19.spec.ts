import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import OperationSubjectSelect from "@/components/OperationSubjectSelect.vue";
import DialogGlobal from "@/components/global/DialogGlobal.vue";

vi.mock("@/services/companiesApi", () => ({
  useCompaniesApi: () => ({ approved: vi.fn().mockResolvedValue([]) }),
}));

describe("autoridades visuales compartidas del lote 19", () => {
  it("muestra texto compacto cuando sólo existe persona natural", async () => {
    const wrapper = mount(OperationSubjectSelect, { props: { modelValue: null }, global: { stubs: { VSelect: true } } });
    await new Promise((resolve) => setTimeout(resolve));
    expect(wrapper.get('[data-test="single-operation-subject"]').text()).toContain("Operas como");
    expect(wrapper.find("v-select-stub").exists()).toBe(false);
  });

  it("el cierre compartido es accesible y emite cierre", async () => {
    const wrapper = mount(DialogGlobal, { props: { dialog: true }, global: { stubs: { VDialog: { template: '<div><slot /></div>' }, VBtn: { emits: ['click'], template: '<button :aria-label="$attrs[\'aria-label\']" @click="$emit(\'click\')"><slot /></button>' }, VCard: { template: '<div><slot /></div>' }, VCardTitle: { template: '<div><slot /></div>' }, VCardSubtitle: { template: '<div><slot /></div>' }, VCardText: { template: '<div><slot /></div>' }, VCardActions: { template: '<div><slot /></div>' } } } });
    await wrapper.get('button[aria-label="Cerrar"]').trigger("click");
    expect(wrapper.emitted("closeDialog")).toHaveLength(1);
  });
});
