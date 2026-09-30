// @vitest-environment jsdom
import { createPinia, setActivePinia } from "pinia";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

const api = vi.hoisted(() => ({
  getAccess: vi.fn(),
  getOnboarding: vi.fn(),
  startOnboarding: vi.fn(),
  refreshOnboarding: vi.fn(),
  requestAccess: vi.fn(),
  addProducts: vi.fn(),
  getAdmin: vi.fn(),
  markEligible: vi.fn(),
  transition: vi.fn(),
  searchCandidates: vi.fn(),
  getProvider: vi.fn(),
  syncProvider: vi.fn(),
  simulateProvider: vi.fn(),
  simulateSandboxApproval: vi.fn(),
}));
vi.mock("@/helper", () => ({
  helperStore: () => ({ showNotify: vi.fn(), http: vi.fn() }),
  getUserAuth: vi.fn(),
}));

vi.mock("@/services/internationalAccountsApi", () => ({
  getInternationalAccountAccess: api.getAccess,
  getInternationalAccountOnboarding: api.getOnboarding,
  startInternationalAccountOnboarding: api.startOnboarding,
  refreshInternationalAccountOnboarding: api.refreshOnboarding,
  requestInternationalAccountAccess: api.requestAccess,
  addInternationalAccountProducts: api.addProducts,
  getAdminInternationalAccounts: api.getAdmin,
  markInternationalAccountEligible: api.markEligible,
  transitionInternationalAccount: api.transition,
  searchInternationalAccountCandidates: api.searchCandidates,
  getInternationalAccountProvider: api.getProvider,
  syncInternationalAccountProvider: api.syncProvider,
  simulateInternationalAccountProvider: api.simulateProvider,
  simulateSandboxKycApproval: api.simulateSandboxApproval,
}));

import InternationalAccountsView from "@/views/user/InternationalAccounts/InternationalAccountsView.vue";
import InternationalAccountsAdminView from "@/views/admin/international-accounts/InternationalAccountsAdminView.vue";
import adminRoutes from "@/router/admin";
import userRoutes from "@/router/user";
import { UserStore } from "@/stores/UserStore";
import {
  internationalAccountActionLabel,
  internationalAccountKycLabel,
  internationalAccountStatusLabel,
} from "@/utils/internationalAccountsLabels";

const SlotStub = defineComponent({
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  },
});
const ButtonStub = defineComponent({
  inheritAttrs: false,
  emits: ["click"],
  setup(_, { attrs, slots, emit }) {
    return () =>
      h(
        "button",
        { disabled: attrs.disabled as boolean, onClick: () => emit("click") },
        slots.default?.(),
      );
  },
});
const stubs = {
  VCard: SlotStub,
  VCardTitle: SlotStub,
  VCardSubtitle: SlotStub,
  VCardText: SlotStub,
  VAlert: SlotStub,
  VRow: SlotStub,
  VCol: SlotStub,
  VDivider: SlotStub,
  VTable: SlotStub,
  VDialog: SlotStub,
  VCardActions: SlotStub,
  VSpacer: SlotStub,
  VChip: SlotStub,
  VProgressLinear: SlotStub,
  VCheckbox: SlotStub,
  VTextarea: SlotStub,
  VTextField: SlotStub,
  VSelect: SlotStub,
  VPagination: SlotStub,
  VBtn: ButtonStub,
};

const clientState = (status: string, canRequest = false) => ({
  data: {
    data: {
      feature_enabled: true,
      status,
      can_request: canRequest,
      available_products: ["usd", "eur"],
      requested_products: [],
      missing_products: [],
      can_add_products: false,
      access:
        status === "not_eligible"
          ? null
          : { id: 1, status, requested_products: [] },
    },
  },
});

describe("International Accounts Lote 1 UI", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    UserStore().setAuth("test-token", {
      id: 1,
      email: "superadmin@example.test",
      roles: [
        {
          name: "Superadmin",
          permissions: [
            { name: "international-accounts.eligibility", guard_name: "web" },
            { name: "international-accounts.review", guard_name: "web" },
            { name: "international-accounts.approve", guard_name: "web" },
            { name: "international-accounts.reject", guard_name: "web" },
            { name: "international-accounts.suspend", guard_name: "web" },
          ],
        },
      ],
    } as never);
    vi.clearAllMocks();
    api.getOnboarding.mockResolvedValue({
      data: {
        data: {
          access_status: "approved",
          can_start: true,
          polling_enabled: false,
          onboarding: null,
        },
      },
    });
  });

  it.each([
    ["not_eligible", "Este servicio está disponible para clientes elegibles"],
    ["requested", "Tu solicitud está en revisión"],
    ["approved", "Tu solicitud fue aprobada por Xeler"],
  ])("renders the safe client state %s", async (status, expected) => {
    api.getAccess.mockResolvedValue(clientState(status));
    const wrapper = shallowMount(InternationalAccountsView, {
      global: { stubs },
    });
    await flushPromises();

    expect(wrapper.text()).toContain(expected);
    if (status === "requested")
      expect(wrapper.text()).not.toContain("Solicitar acceso");
    if (status === "approved") {
      expect(wrapper.text()).not.toContain("routing");
      expect(wrapper.text()).not.toContain("IBAN");
      expect(wrapper.text()).not.toContain("balance");
    }
  });

  it.each([409, 422])(
    "shows the request form only for eligible users and handles a controlled %s",
    async (status) => {
      api.getAccess.mockResolvedValue(clientState("eligible", true));
      api.requestAccess.mockRejectedValue({
        message: "Solicitud controlada",
        status,
      });
      const wrapper = shallowMount(InternationalAccountsView, {
        global: { stubs },
      });
      await flushPromises();

      expect(wrapper.text()).toContain("Solicitar acceso");
      const vm = wrapper.vm as unknown as {
        form: {
          requested_products: string[];
          use_case: string;
          expected_monthly_volume: string;
        };
        submit: () => Promise<void>;
      };
      vm.form.requested_products = ["usd"];
      vm.form.use_case = "Pagos a proveedores";
      vm.form.expected_monthly_volume = "1000.25";
      await vm.submit();

      expect(api.requestAccess).toHaveBeenCalledTimes(1);
      expect(api.getAccess).toHaveBeenCalledTimes(1);
    },
  );

  it("protects client and admin routes with the existing permission middleware", () => {
    const userRoute = userRoutes.find(
      (route) => route.name === "user-international-accounts",
    );
    const adminRoute = adminRoutes.find(
      (route) => route.name === "admin-international-accounts",
    );

    expect(userRoute?.meta?.permissions).toEqual([
      "international-accounts.view-own",
    ]);
    expect(adminRoute?.meta?.permissions).toEqual([
      "international-accounts.view",
    ]);
    expect(userRoute?.beforeEnter).toBeTruthy();
    expect(adminRoute?.beforeEnter).toBeTruthy();
  });

  it("renders only valid administrative actions for each state", async () => {
    api.getAdmin.mockResolvedValue({
      data: {
        data: {
          summary: {
            eligible: 0,
            requested: 1,
            under_review: 1,
            approved: 1,
            rejected: 0,
            suspended: 0,
          },
          items: [
            {
              id: 1,
              status: "requested",
              requested_products: ["usd"],
              user: {
                id: 1,
                name: "A",
                email: "a@example.test",
                kyc_status: "approved",
              },
            },
            {
              id: 2,
              status: "under_review",
              requested_products: ["eur"],
              user: {
                id: 2,
                name: "B",
                email: "b@example.test",
                kyc_status: "approved",
              },
            },
            {
              id: 3,
              status: "approved",
              requested_products: [],
              user: {
                id: 3,
                name: "C",
                email: "c@example.test",
                kyc_status: "approved",
              },
            },
          ],
        },
        meta: { last_page: 1 },
      },
    });
    const wrapper = shallowMount(InternationalAccountsAdminView, {
      global: { stubs },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Tomar revisi\u00f3n");
    expect(wrapper.text()).toContain("Aprobar");
    expect(wrapper.text()).toContain("Rechazar");
    expect(wrapper.text()).toContain("Suspender");
  });

  it("maps internal states and actions to Spanish labels", () => {
    expect(internationalAccountStatusLabel("under_review")).toBe(
      "En revisi\u00f3n",
    );
    expect(internationalAccountKycLabel("approved")).toBe("Aprobado");
    expect(internationalAccountActionLabel("take-review")).toBe(
      "Tomar revisi\u00f3n",
    );
  });

  it("adds EUR to an approved USD-only access and refreshes access and onboarding", async () => {
    const usdOnly = {
      data: { data: {
          feature_enabled: true,
          status: "approved",
          can_request: false,
          available_products: ["usd", "eur"],
          requested_products: ["usd"],
          missing_products: ["eur"],
          can_add_products: true,
          access: { id: 1, status: "approved", requested_products: ["usd"] },
      } },
    };
    const expanded = {
      data: { data: {
        ...usdOnly.data.data,
        requested_products: ["eur", "usd"],
        missing_products: [],
        can_add_products: false,
        access: { id: 1, status: "approved", requested_products: ["eur", "usd"] },
      } },
    };
    api.getAccess.mockResolvedValueOnce(usdOnly).mockResolvedValueOnce(expanded);
    api.getOnboarding
      .mockResolvedValueOnce({ data: { data: {
        access_status: "approved", can_start: true, polling_enabled: false,
        onboarding: { provider: "Simulado", provider_status: "active", kyc_status: "approved", tos_status: "approved", is_terminal: true,
          endorsements: [{ product: "usd", status: "approved", requirement_codes: [], future_requirement_codes: [] }] },
      } } })
      .mockResolvedValueOnce({ data: { data: {
        access_status: "approved", can_start: true, polling_enabled: false,
        onboarding: { provider: "Simulado", provider_status: "active", kyc_status: "approved", tos_status: "approved", is_terminal: false,
          endorsements: [
            { product: "usd", status: "approved", requirement_codes: [], future_requirement_codes: [] },
            { product: "eur", status: "pending", requirement_codes: [], future_requirement_codes: [] },
          ] },
      } } });
    api.addProducts.mockResolvedValue({
      data: { data: { id: 1, status: "approved", requested_products: ["eur", "usd"] } },
    });
    const wrapper = shallowMount(InternationalAccountsView, {
      global: { stubs },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("Solicitar Cuenta EUR");
    await (wrapper.vm as unknown as { addProduct: (product: "eur") => Promise<void> })
      .addProduct("eur");

    expect(api.addProducts).toHaveBeenCalledWith(["eur"]);
    expect(api.getAccess).toHaveBeenCalledTimes(2);
    expect(api.getOnboarding).toHaveBeenCalledTimes(2);
    expect((wrapper.vm as unknown as { onboarding: { endorsements: Array<{ product: string; status: string }> } }).onboarding.endorsements)
      .toContainEqual({ product: "eur", status: "pending", requirement_codes: [], future_requirement_codes: [] });
  });

  it.each([
    [["eur", "usd"], ["usd", "eur"], [], false, "Solicitar Cuenta"],
    [["eur"], ["usd", "eur"], ["usd"], true, "Solicitar Cuenta USD"],
    [["usd"], ["usd"], [], false, "Solicitar Cuenta EUR"],
  ])("renders only products that can still be added", async (requested, available, missing, canAdd, label) => {
    api.getAccess.mockResolvedValue({
      data: {
        data: {
          feature_enabled: true,
          status: "approved",
          can_request: false,
          available_products: available,
          requested_products: requested,
          missing_products: missing,
          can_add_products: canAdd,
          access: { id: 1, status: "approved", requested_products: requested },
        },
      },
    });
    const wrapper = shallowMount(InternationalAccountsView, { global: { stubs } });
    await flushPromises();

    if (canAdd) expect(wrapper.text()).toContain(label);
    else expect(wrapper.text()).not.toContain(label);
  });

  it("hides the activation CTA when terminal and restores it for a pending added product", async () => {
    api.getAccess.mockResolvedValue({
      data: {
        data: {
          feature_enabled: true,
          status: "approved",
          can_request: false,
          available_products: ["usd", "eur"],
          requested_products: ["usd", "eur"],
          missing_products: [],
          can_add_products: false,
          access: { id: 1, status: "approved", requested_products: ["usd", "eur"] },
        },
      },
    });
    api.getOnboarding
      .mockResolvedValueOnce({
        data: { data: { access_status: "approved", can_start: true, polling_enabled: false, onboarding: {
          provider: "Simulado", provider_status: "active", kyc_status: "approved", tos_status: "approved",
          is_terminal: true, endorsements: [{ product: "usd", status: "approved", requirement_codes: [], future_requirement_codes: [] }],
        } } },
      })
      .mockResolvedValueOnce({
        data: { data: { access_status: "approved", can_start: true, polling_enabled: false, onboarding: {
          provider: "Simulado", provider_status: "active", kyc_status: "approved", tos_status: "approved",
          is_terminal: false, endorsements: [
            { product: "usd", status: "approved", requirement_codes: [], future_requirement_codes: [] },
            { product: "eur", status: "pending", requirement_codes: [], future_requirement_codes: [] },
          ],
        } } },
      });
    const terminal = shallowMount(InternationalAccountsView, { global: { stubs } });
    await flushPromises();
    expect(terminal.text()).not.toContain("Continuar activaci\u00f3n");
    terminal.unmount();

    const pending = shallowMount(InternationalAccountsView, { global: { stubs } });
    await flushPromises();
    expect(pending.text()).toContain("Continuar activaci\u00f3n de Cuenta EUR");
  });
});
