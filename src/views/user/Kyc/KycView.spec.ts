import { flushPromises, shallowMount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import KycView from "./KycView.vue";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  saveDraft: vi.fn(),
  uploadDocument: vi.fn(),
  submit: vi.fn(),
  downloadDocument: vi.fn(),
  getTypeDocuments: vi.fn(),
  updateUserAuth: vi.fn(),
  fetchCountries: vi.fn(),
}));

vi.mock("@/services/kycApi", () => ({
  useKycApi: () => ({
    me: mocks.me,
    saveDraft: mocks.saveDraft,
    uploadDocument: mocks.uploadDocument,
    submit: mocks.submit,
    downloadDocument: mocks.downloadDocument,
  }),
}));

vi.mock("@/stores/UserStore", async () => {
  const { defineStore } = await import("pinia");
  const { ref } = await import("vue");
  return { UserStore: defineStore("kyc-test-user", () => {
    const typeDocuments = ref([]);
    const userAuth = ref(null);
    return {
      typeDocuments,
      userAuth,
      getTypeDocuments: mocks.getTypeDocuments,
      updateUserAuth: mocks.updateUserAuth,
    };
  }) };
});

vi.mock("@/stores/LocationStore", async () => {
  const { defineStore } = await import("pinia");
  const { ref } = await import("vue");
  return { useLocationStore: defineStore("kyc-test-location", () => {
    const countries = ref([]);
    return { countries, fetchCountries: mocks.fetchCountries };
  }) };
});

const draft = {
  id: 41,
  workflow_status: "draft",
  personal_data: {},
  declaration_accepted: false,
  documents: [],
};

const mountView = async (kyc: Record<string, unknown> | null) => {
  mocks.me.mockResolvedValue({ kyc, level: 0 });
  const wrapper = shallowMount(KycView, {
    global: {
      plugins: [createPinia()],
      stubs: {
        VFileInput: { name: "VFileInput", template: "<div />" },
        VBtnPrimary: { name: "VBtnPrimary", template: "<button><slot /></button>" },
      },
    },
  });
  await flushPromises();
  return wrapper;
};

describe("KycView document lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTypeDocuments.mockResolvedValue(true);
    mocks.fetchCountries.mockResolvedValue(undefined);
    mocks.updateUserAuth.mockResolvedValue(undefined);
    mocks.saveDraft.mockResolvedValue(draft);
    mocks.uploadDocument.mockResolvedValue({ data: { code: "KYC_DOCUMENT_UPLOADED" } });
  });

  it("creates the editable draft before the first document upload", async () => {
    const wrapper = await mountView(null);
    const file = new File(["documento"], "identidad.png", { type: "image/png" });

    await (wrapper.vm as unknown as { upload(type: string, file: File): Promise<void> })
      .upload("identity_front", file);

    expect(mocks.saveDraft).toHaveBeenCalledOnce();
    expect(mocks.uploadDocument).toHaveBeenCalledWith("identity_front", file);
    expect(mocks.saveDraft.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.uploadDocument.mock.invocationCallOrder[0],
    );
  });

  it("does not create another draft when the expediente already exists", async () => {
    const wrapper = await mountView(draft);
    const file = new File(["documento"], "identidad.png", { type: "image/png" });

    await (wrapper.vm as unknown as { upload(type: string, file: File): Promise<void> })
      .upload("identity_back", file);

    expect(mocks.saveDraft).not.toHaveBeenCalled();
    expect(mocks.uploadDocument).toHaveBeenCalledWith("identity_back", file);
  });

  it("does not render upload controls after submit", async () => {
    const wrapper = await mountView({ ...draft, workflow_status: "submitted" });

    expect(wrapper.findAll("v-file-input-stub")).toHaveLength(0);
    expect(mocks.uploadDocument).not.toHaveBeenCalled();
  });
});
