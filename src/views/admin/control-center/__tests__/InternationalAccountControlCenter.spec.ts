// @vitest-environment jsdom
import { createPinia, setActivePinia } from "pinia";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

const controls = vi.hoisted(() => ({
  status: vi.fn(),
  currencies: vi.fn(),
  updateInternational: vi.fn(),
}));
vi.mock("@/helper", () => ({
  helperStore: () => ({ showNotify: vi.fn(), http: vi.fn() }),
  getUserAuth: vi.fn(),
}));
vi.mock("@/services/controlCenterApi", () => ({
  getControlCenterStatus: controls.status,
  getCurrencyOperationControls: controls.currencies,
  updateInternationalAccountControl: controls.updateInternational,
  activateEmergencyStop: vi.fn(),
  confirmEmergencyUnlock: vi.fn(),
  requestEmergencyUnlock: vi.fn(),
  syncCryptoProvidersFromConfig: vi.fn(),
  updateCurrencyOperationControl: vi.fn(),
  updateManualMode: vi.fn(),
  updateSystemControl: vi.fn(),
}));
vi.mock("@/services/integrationSettingsApi", () => ({
  getIntegrationSettings: vi.fn().mockResolvedValue({ data: { data: {} } }),
  getIntegrationSettingsGroup: vi
    .fn()
    .mockResolvedValue({ data: { data: [] } }),
  testIntegrationSettingsGroup: vi.fn(),
  updateIntegrationSettingsGroup: vi.fn(),
}));

import ControlCenterView from "@/views/admin/control-center/ControlCenterView.vue";
import controlCenterSource from "@/views/admin/control-center/ControlCenterView.vue?raw";
import { UserStore } from "@/stores/UserStore";

const SlotStub = defineComponent({
  setup(_, { slots }) {
    return () => h("div", slots.default?.());
  },
});
const stubs = {
  VAlert: SlotStub,
  VBtn: SlotStub,
  VCard: SlotStub,
  VCardActions: SlotStub,
  VCardText: SlotStub,
  VCardTitle: SlotStub,
  VCheckbox: SlotStub,
  VChip: SlotStub,
  VCol: SlotStub,
  VDivider: SlotStub,
  VRow: SlotStub,
  VSelect: SlotStub,
  VSwitch: SlotStub,
  VTable: SlotStub,
  VTextField: SlotStub,
  VTextarea: SlotStub,
};

describe("International Accounts Control Center", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const user = UserStore();
    user.setAuth("test-token", {
      id: 1,
      email: "admin@example.test",
      roles: [
        {
          name: "Superadmin",
          permissions: [
            {
              name: "control-center.international-accounts.view",
              guard_name: "web",
            },
            {
              name: "control-center.international-accounts.update",
              guard_name: "web",
            },
          ],
        },
      ],
    } as never);
    controls.currencies.mockResolvedValue({ data: { data: [] } });
    controls.status.mockResolvedValue({
      data: {
        data: {
          system: {
            status: "normal",
            buy_enabled: true,
            sell_enabled: true,
            new_orders_enabled: true,
            auto_deposit_detection_enabled: true,
            auto_payout_enabled: true,
            webhook_processing_enabled: true,
            polling_enabled: true,
          },
          currencies: [],
          crypto_providers: [],
          integrations: [],
          history: [],
          international_accounts: {
            enabled: true,
            external_calls_enabled: true,
            external_calls_effective: false,
            new_requests_enabled: true,
            onboarding_enabled: false,
            usd_enabled: true,
            eur_enabled: true,
            webhook_processing_enabled: false,
            polling_enabled: false,
            manual_mode: false,
          },
        },
      },
    });
  });

  it("shows the isolated international controls and effective external-call state", async () => {
    shallowMount(ControlCenterView, { global: { stubs } });
    await flushPromises();

    expect(controlCenterSource).toContain("Cuentas Internacionales");
    expect(controlCenterSource).toContain("external_calls_effective");
    expect(controlCenterSource).toContain(
      "independientes de Compra, Venta y cripto",
    );
    expect(controlCenterSource).toContain("M\\u00f3dulo deshabilitado");
    expect(controlCenterSource).toContain("Llamadas externas inactivas");
  });
});
