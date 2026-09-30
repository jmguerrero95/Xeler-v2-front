// @vitest-environment jsdom
import { createPinia, setActivePinia } from "pinia";
import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";

const controls = vi.hoisted(() => ({
  status: vi.fn(),
  currencies: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/helper", () => ({
  helperStore: () => ({ showNotify: vi.fn(), http: vi.fn() }),
  getUserAuth: vi.fn(),
}));
vi.mock("@/services/controlCenterApi", () => ({
  getControlCenterStatus: controls.status,
  getCurrencyOperationControls: controls.currencies,
  activateEmergencyStop: vi.fn(),
  confirmEmergencyUnlock: vi.fn(),
  requestEmergencyUnlock: vi.fn(),
  syncCryptoProvidersFromConfig: vi.fn(),
  updateCurrencyOperationControl: vi.fn(),
  updateInternationalAccountControl: vi.fn(),
  updateManualMode: vi.fn(),
  updateSystemControl: controls.update,
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
import { UserStore } from "@/stores/UserStore";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";

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

describe("Centro de control de proveedores cripto", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    UserStore().setAuth("test-token", {
      id: 1,
      email: "admin@example.test",
      roles: [
        {
          name: "Superadmin",
          permissions: [
            {
              name: "control-center.crypto.view",
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
          integrations: [],
          history: [],
          crypto_providers: [
            {
              provider: "cryptocurrencyapi",
              currency: "USDC",
              network: "TRC20",
              status: "disabled",
              disabled_reason: "issuer_network_deprecated",
              missing_fields: ["access_token", "webhook_secret"],
            },
            {
              provider: "bitgo",
              currency: "BTC",
              network: "BTC",
              status: "manual_review",
              disabled_reason: "missing_required_fields",
              missing_fields: ["wallet_passphrase"],
            },
          ],
          international_accounts: {
            enabled: false,
            external_calls_enabled: false,
            external_calls_effective: false,
          },
        },
      },
    });
  });

  it("renderiza nombres y explicaciones seguras sin identificadores internos", async () => {
    const wrapper = shallowMount(ControlCenterView, { global: { stubs } });
    await flushPromises();
    const visible = wrapper.text();

    expect(visible).toContain("CryptocurrencyAPI");
    expect(visible).toContain("BitGo");
    expect(visible).toContain("La red configurada para este activo");
    expect(visible).toContain("Faltan datos obligatorios de configuraci");
    expect(visible).toContain("Token de acceso");
    expect(visible).toContain("Frase secreta de la billetera");
    expect(visible).toContain("Secreto del webhook");
    expect(visible).not.toContain("cryptocurrencyapi");
    expect(visible).not.toContain("issuer_network_deprecated");
    expect(visible).not.toContain("missing_required_fields");
    expect(visible).not.toContain("access_token");
    expect(visible).not.toContain("wallet_passphrase");
    expect(visible).not.toContain("webhook_secret");
    expect(visible).not.toContain("CRYPTO_EXTERNAL_CALLS_ENABLED");
    expect(visible).not.toContain("CRYPTO_PAYOUTS_ENABLED");
  });

  it("permanece fail-closed antes de cargar y ante error", async () => {
    controls.status.mockRejectedValueOnce(new Error("offline"));
    const wrapper = shallowMount(ControlCenterView, { global: { stubs } });
    const vm = wrapper.vm as any;
    expect(vm.statusLoaded).toBe(false);
    expect(vm.systemForm.buy_enabled).toBe(false);
    expect(vm.systemForm.auto_payout_enabled).toBe(false);
    await vm.saveSystem();
    expect(controls.update).not.toHaveBeenCalled();
    await flushPromises();
    expect(vm.loadError).toBe(true);
    expect(vm.canSaveSystem).toBe(false);
  });

  it("habilita edición sólo después de hidratar exactamente el backend", async () => {
    const wrapper = shallowMount(ControlCenterView, { global: { stubs } });
    await flushPromises();
    const vm = wrapper.vm as any;
    expect(vm.statusLoaded).toBe(true);
    expect(vm.systemForm.buy_enabled).toBe(true);
    expect(vm.systemForm.auto_payout_enabled).toBe(true);
    vm.systemForm.auto_payout_enabled=false;
    const saving = vm.saveSystem();
    expect(controls.update).not.toHaveBeenCalled();
    expect(TwoFactorAuthStore().requestedScope).toBe("finance.financial_configuration");
    expect(TwoFactorAuthStore().modal).toBe(true);
    await TwoFactorAuthStore().callback.fn();
    await saving;
    expect(controls.update).toHaveBeenCalledWith(expect.objectContaining({buy_enabled:true,auto_payout_enabled:false}));
  });
});
