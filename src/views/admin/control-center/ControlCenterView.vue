<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { statusLabel } from "@/utils/statusLabels";
import {
  cryptoDisabledReasonLabel,
  cryptoMissingFieldLabels,
  cryptoProviderLabel,
} from "@/utils/cryptoProviderLabels";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import { CONTROL_CENTER } from "@/enums/Permissions.enum";
import type {
  ControlCenterStatus,
  CryptoOperationControl,
  SystemOperationControl,
  InternationalAccountOperationControl,
} from "@/interfaces/ControlCenter/ControlCenter.model";
import type {
  IntegrationSettingItem,
  IntegrationSettingsGroup,
} from "@/interfaces/Integrations/IntegrationSettings.model";
import {
  activateEmergencyStop,
  confirmEmergencyUnlock,
  getControlCenterStatus,
  getCurrencyOperationControls,
  requestEmergencyUnlock,
  syncCryptoProvidersFromConfig,
  updateCurrencyOperationControl,
  updateManualMode,
  updateSystemControl,
  updateInternationalAccountControl,
} from "@/services/controlCenterApi";
import {
  getIntegrationSettings,
  getIntegrationSettingsGroup,
  testIntegrationSettingsGroup,
  updateIntegrationSettingsGroup,
} from "@/services/integrationSettingsApi";

const helper = helperStore();
const userStore = UserStore();

type ApiErrorEnvelope = {
  message?: unknown;
  response?: { data?: unknown };
  original?: { response?: { data?: unknown } };
};

type EmergencyUnlockErrorData = {
  data?: {
    reason?: unknown;
    meta?: { remaining_seconds?: unknown };
  };
};

const errorEnvelope = (error: unknown): ApiErrorEnvelope =>
  typeof error === "object" && error !== null
    ? (error as ApiErrorEnvelope)
    : {};

const errorMessage = (error: unknown): string | undefined => {
  const message = errorEnvelope(error).message;
  return typeof message === "string" ? message : undefined;
};

const errorResponseData = (
  error: unknown,
): EmergencyUnlockErrorData | undefined => {
  const envelope = errorEnvelope(error);
  const data = envelope.original?.response?.data ?? envelope.response?.data;
  return typeof data === "object" && data !== null
    ? (data as EmergencyUnlockErrorData)
    : undefined;
};

const loading = ref(false);
const statusLoaded = ref(false);
const loadError = ref(false);
const savingSystem = ref(false);
const savingIntegration = ref(false);
const syncingProviders = ref(false);
const savingInternational = ref(false);
const status = ref<ControlCenterStatus | null>(null);
const currencyControls = ref<CryptoOperationControl[]>([]);
const integrations = ref<IntegrationSettingsGroup>({});
const selectedGroup = ref<string>("telegram");
const integrationForm = reactive<
  Record<
    string,
    {
      type: string;
      is_secret: boolean;
      label?: string | null;
      description?: string | null;
      enabled: boolean;
      value: unknown;
      clear: boolean;
    }
  >
>({});
const integrationTest = ref<Record<string, unknown> | null>(null);

const systemForm = reactive<Partial<SystemOperationControl>>({
  buy_enabled: false,
  sell_enabled: false,
  new_orders_enabled: false,
  auto_deposit_detection_enabled: false,
  auto_payout_enabled: false,
  webhook_processing_enabled: false,
  polling_enabled: false,
  public_message: "",
  reason: "",
});

const internationalForm = reactive<
  Partial<InternationalAccountOperationControl> & { reason: string }
>({
  enabled: false,
  external_calls_enabled: false,
  new_requests_enabled: false,
  onboarding_enabled: false,
  wallet_creation_enabled: false,
  account_creation_enabled: false,
  beneficiary_creation_enabled: false,
  external_account_creation_enabled: false,
  outbound_transfers_enabled: false,
  transfer_webhook_processing_enabled: false,
  transfer_sync_enabled: false,
  fee_charging_enabled: false,
  deposit_processing_enabled: false,
  balance_sync_enabled: false,
  reconciliation_enabled: false,
  usd_enabled: false,
  eur_enabled: false,
  webhook_processing_enabled: false,
  polling_enabled: false,
  manual_mode: false,
  public_message: "",
  reason: "",
});

const emergencyActivate = reactive({
  reason: "",
  public_message: "",
});

const emergencyUnlockRequest = reactive({
  email: "",
  phone: "",
});

const emergencyUnlockConfirm = reactive({
  email_code: "",
  sms_code: "",
});

const canUpdateSystem = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.UPDATE),
);
const canViewOperations = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.OPERATIONS_VIEW),
);
const canUpdateOperations = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.OPERATIONS_UPDATE),
);
const canViewIntegrations = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.INTEGRATIONS_VIEW),
);
const canUpdateIntegrations = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.INTEGRATIONS_UPDATE),
);
const canTestIntegrations = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.INTEGRATIONS_TEST),
);
const canViewCrypto = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.CRYPTO_VIEW),
);
const canSyncCrypto = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.CRYPTO_UPDATE),
);
const canEmergencyActivate = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.EMERGENCY_ACTIVATE),
);
const canEmergencyUnlock = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.EMERGENCY_UNLOCK),
);
const canEmergencyUnlockOverride = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.EMERGENCY_UNLOCK_OVERRIDE_DESTINATION),
);
const canUpdateManualMode = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.MANUAL_MODE_UPDATE),
);
const canViewInternational = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.INTERNATIONAL_ACCOUNTS_VIEW),
);
const canUpdateInternational = computed(() =>
  userStore.hasPermission(CONTROL_CENTER.INTERNATIONAL_ACCOUNTS_UPDATE),
);
const isEmergencyStopped = computed(
  () => status.value?.system.status === "emergency_stopped",
);
const emergencyDefaultEmail = computed(() => userStore.authUser?.email ?? "");
const emergencyDefaultPhone = computed(() => {
  const code = userStore.authUser?.code_phone ?? "";
  const phone = userStore.authUser?.phone ?? "";
  return code || phone ? `${code}${phone}` : "";
});

const integrationGroups = computed(() => Object.keys(integrations.value));
const selectedIntegrationItems = computed(
  () => integrations.value[selectedGroup.value] ?? [],
);
const selectedRenderableIntegrationItems = computed(() =>
  selectedIntegrationItems.value.filter((item) =>
    Boolean(integrationForm[item.key]),
  ),
);
const canEditSystemToggles = computed(
  () => statusLoaded.value && canUpdateSystem.value && !isEmergencyStopped.value,
);
const canSaveSystem = computed(() => {
  if (!statusLoaded.value || !canUpdateSystem.value) {
    return false;
  }

  if (!isEmergencyStopped.value) {
    return true;
  }

  return (
    (systemForm.reason ?? "") !== (status.value?.system.reason ?? "") ||
    (systemForm.public_message ?? "") !==
      (status.value?.system.public_message ?? "")
  );
});
const canToggleManualMode = computed(
  () => canUpdateManualMode.value && !isEmergencyStopped.value,
);
const canActivateEmergencyAction = computed(
  () => canEmergencyActivate.value && !isEmergencyStopped.value,
);

const hydrateIntegrationForm = (items: IntegrationSettingItem[]) => {
  Object.keys(integrationForm).forEach((key) => delete integrationForm[key]);
  for (const item of items) {
    integrationForm[item.key] = {
      type: item.type,
      is_secret: item.is_secret,
      label: item.label,
      description: item.description,
      enabled: item.enabled,
      value: item.is_secret ? "" : (item.value ?? ""),
      clear: false,
    };
  }
};

const loadStatus = async () => {
  const res = await getControlCenterStatus();
  status.value = res.data.data;
  Object.assign(systemForm, {
    buy_enabled: status.value.system.buy_enabled,
    sell_enabled: status.value.system.sell_enabled,
    new_orders_enabled: status.value.system.new_orders_enabled,
    auto_deposit_detection_enabled:
      status.value.system.auto_deposit_detection_enabled,
    auto_payout_enabled: status.value.system.auto_payout_enabled,
    webhook_processing_enabled: status.value.system.webhook_processing_enabled,
    polling_enabled: status.value.system.polling_enabled,
    public_message: status.value.system.public_message ?? "",
    reason: status.value.system.reason ?? "",
  });
  Object.assign(internationalForm, {
    enabled: status.value.international_accounts.enabled,
    external_calls_enabled:
      status.value.international_accounts.external_calls_enabled,
    new_requests_enabled:
      status.value.international_accounts.new_requests_enabled,
    onboarding_enabled: status.value.international_accounts.onboarding_enabled,
    wallet_creation_enabled:
      status.value.international_accounts.wallet_creation_enabled,
    account_creation_enabled:
      status.value.international_accounts.account_creation_enabled,
    beneficiary_creation_enabled:
      status.value.international_accounts.beneficiary_creation_enabled,
    external_account_creation_enabled:
      status.value.international_accounts.external_account_creation_enabled,
    outbound_transfers_enabled:
      status.value.international_accounts.outbound_transfers_enabled,
    transfer_webhook_processing_enabled:
      status.value.international_accounts.transfer_webhook_processing_enabled,
    transfer_sync_enabled:
      status.value.international_accounts.transfer_sync_enabled,
    fee_charging_enabled:
      status.value.international_accounts.fee_charging_enabled,
    deposit_processing_enabled:
      status.value.international_accounts.deposit_processing_enabled,
    balance_sync_enabled:
      status.value.international_accounts.balance_sync_enabled,
    reconciliation_enabled:
      status.value.international_accounts.reconciliation_enabled,
    usd_enabled: status.value.international_accounts.usd_enabled,
    eur_enabled: status.value.international_accounts.eur_enabled,
    webhook_processing_enabled:
      status.value.international_accounts.webhook_processing_enabled,
    polling_enabled: status.value.international_accounts.polling_enabled,
    manual_mode: status.value.international_accounts.manual_mode,
    public_message: status.value.international_accounts.public_message ?? "",
    reason: "",
  });
};

const loadCurrencyControls = async () => {
  const res = await getCurrencyOperationControls();
  currencyControls.value = res.data.data;
};

const loadIntegrations = async () => {
  const res = await getIntegrationSettings();
  integrations.value = res.data.data;
  if (
    !integrations.value[selectedGroup.value] &&
    integrationGroups.value.length > 0
  ) {
    selectedGroup.value = integrationGroups.value[0];
  }
};

const loadIntegrationGroup = async (group: string) => {
  const res = await getIntegrationSettingsGroup(group);
  integrations.value[group] = res.data.data;
  hydrateIntegrationForm(res.data.data);
};

const loadAll = async () => {
  try {
    loading.value = true;
    statusLoaded.value = false;
    loadError.value = false;
    await Promise.all([
      loadStatus(),
      loadCurrencyControls(),
      loadIntegrations(),
    ]);
    if (!emergencyUnlockRequest.email && emergencyDefaultEmail.value) {
      emergencyUnlockRequest.email = emergencyDefaultEmail.value;
    }
    if (!emergencyUnlockRequest.phone && emergencyDefaultPhone.value) {
      emergencyUnlockRequest.phone = emergencyDefaultPhone.value;
    }
    if (selectedGroup.value) {
      await loadIntegrationGroup(selectedGroup.value);
    }
    statusLoaded.value = true;
  } catch (error: unknown) {
    status.value = null;
    statusLoaded.value = false;
    loadError.value = true;
    Object.assign(systemForm, { buy_enabled:false, sell_enabled:false, new_orders_enabled:false, auto_deposit_detection_enabled:false, auto_payout_enabled:false, webhook_processing_enabled:false, polling_enabled:false, public_message:"", reason:"" });
    helper.showNotify(
      errorMessage(error) ?? "No fue posible cargar el centro de control.",
      { type: "error" },
    );
  } finally {
    loading.value = false;
  }
};

watch(selectedGroup, async (group) => {
  if (!group) return;
  try {
    await loadIntegrationGroup(group);
  } catch (error: unknown) {
    helper.showNotify(
      errorMessage(error) ?? "No fue posible cargar la integracion.",
      { type: "error" },
    );
  }
});

const saveSystem = async () => {
  if (!statusLoaded.value) return;
  try {
    savingSystem.value = true;
    await authorizeWithTwoFactor(updateSystemControl.bind(undefined, buildSystemPayload()), "finance.financial_configuration");
    helper.showNotify("Control general actualizado.");
    await loadStatus();
  } catch (error: unknown) {
    helper.showNotify(
      errorMessage(error) ?? "No fue posible actualizar el control general.",
      { type: "error" },
    );
  } finally {
    savingSystem.value = false;
  }
};

const buildSystemPayload = (): Partial<SystemOperationControl> => {
  if (isEmergencyStopped.value) {
    return {
      public_message: systemForm.public_message || null,
      reason: systemForm.reason || null,
    };
  }

  return {
    buy_enabled: systemForm.buy_enabled,
    sell_enabled: systemForm.sell_enabled,
    new_orders_enabled: systemForm.new_orders_enabled,
    auto_deposit_detection_enabled: systemForm.auto_deposit_detection_enabled,
    auto_payout_enabled: systemForm.auto_payout_enabled,
    webhook_processing_enabled: systemForm.webhook_processing_enabled,
    polling_enabled: systemForm.polling_enabled,
    public_message: systemForm.public_message || null,
    reason: systemForm.reason || null,
  };
};

const toggleManualMode = async (enabled: boolean) => {
  try {
    savingSystem.value = true;
    await authorizeWithTwoFactor(updateManualMode.bind(undefined, {
      enabled,
      reason: systemForm.reason || null,
      public_message: systemForm.public_message || null,
    }), "finance.financial_configuration");
    helper.showNotify(
      enabled ? "Modo manual activado." : "Modo manual desactivado.",
    );
    await loadStatus();
  } catch (error: unknown) {
    helper.showNotify(
      errorMessage(error) ?? "No fue posible cambiar el modo manual.",
      { type: "error" },
    );
  } finally {
    savingSystem.value = false;
  }
};

const saveCurrencyControl = async (row: CryptoOperationControl) => {
  try {
    await authorizeWithTwoFactor(updateCurrencyOperationControl.bind(undefined, row.id, buildCurrencyControlPayload(row)), "finance.financial_configuration");
    helper.showNotify(`Operacion actualizada para ${row.currency}.`);
    await loadCurrencyControls();
    await loadStatus();
  } catch (error: unknown) {
    helper.showNotify(
      errorMessage(error) ?? "No fue posible actualizar la moneda.",
      { type: "error" },
    );
  }
};

const saveInternationalControl = async () => {
  if (
    !canUpdateInternational.value ||
    internationalForm.reason.trim().length < 3
  )
    return;
  try {
    savingInternational.value = true;
    await authorizeWithTwoFactor(updateInternationalAccountControl.bind(undefined, {
      enabled: internationalForm.enabled,
      external_calls_enabled: internationalForm.external_calls_enabled,
      new_requests_enabled: internationalForm.new_requests_enabled,
      onboarding_enabled: internationalForm.onboarding_enabled,
      wallet_creation_enabled: internationalForm.wallet_creation_enabled,
      account_creation_enabled: internationalForm.account_creation_enabled,
      beneficiary_creation_enabled:
        internationalForm.beneficiary_creation_enabled,
      external_account_creation_enabled:
        internationalForm.external_account_creation_enabled,
      outbound_transfers_enabled: internationalForm.outbound_transfers_enabled,
      transfer_webhook_processing_enabled:
        internationalForm.transfer_webhook_processing_enabled,
      transfer_sync_enabled: internationalForm.transfer_sync_enabled,
      fee_charging_enabled: internationalForm.fee_charging_enabled,
      deposit_processing_enabled:
        internationalForm.deposit_processing_enabled,
      balance_sync_enabled: internationalForm.balance_sync_enabled,
      reconciliation_enabled: internationalForm.reconciliation_enabled,
      usd_enabled: internationalForm.usd_enabled,
      eur_enabled: internationalForm.eur_enabled,
      webhook_processing_enabled: internationalForm.webhook_processing_enabled,
      polling_enabled: internationalForm.polling_enabled,
      manual_mode: internationalForm.manual_mode,
      public_message: internationalForm.public_message || null,
      reason: internationalForm.reason.trim(),
    }), "finance.financial_configuration");
    helper.showNotify("Control de Cuentas Internacionales actualizado.");
    await loadStatus();
  } catch (error: unknown) {
    helper.showNotify(
      errorMessage(error) ??
        "No fue posible actualizar Cuentas Internacionales.",
      { type: "error" },
    );
  } finally {
    savingInternational.value = false;
  }
};

const buildCurrencyControlPayload = (
  row: CryptoOperationControl,
): Partial<CryptoOperationControl> => ({
  enabled: row.enabled,
  buy_enabled: row.buy_enabled,
  sell_enabled: row.sell_enabled,
  manual_mode: row.manual_mode,
  auto_deposit_detection_enabled: row.auto_deposit_detection_enabled,
  auto_payout_enabled: row.auto_payout_enabled,
  webhook_processing_enabled: row.webhook_processing_enabled,
  polling_enabled: row.polling_enabled,
  reason: row.reason || null,
  public_message: row.public_message || null,
});

const saveIntegrationGroup = async () => {
  try {
    savingIntegration.value = true;
    const payload = Object.fromEntries(
      Object.entries(integrationForm).map(([key, item]) => [
        key,
        {
          clear: item.clear,
          value: item.is_secret ? item.value || undefined : item.value,
        },
      ]),
    );
    await authorizeWithTwoFactor(updateIntegrationSettingsGroup.bind(undefined, selectedGroup.value, payload), "finance.financial_configuration");
    helper.showNotify("Configuracion guardada.");
    await loadIntegrations();
    await loadIntegrationGroup(selectedGroup.value);
    await loadStatus();
  } catch (error: unknown) {
    helper.showNotify(
      errorMessage(error) ?? "No fue posible guardar la integracion.",
      { type: "error" },
    );
  } finally {
    savingIntegration.value = false;
  }
};

const testIntegration = async () => {
  try {
    integrationTest.value = null;
    const res = await testIntegrationSettingsGroup(selectedGroup.value);
    integrationTest.value = res.data.data;
    helper.showNotify("Prueba de integracion ejecutada.");
  } catch (error: unknown) {
    helper.showNotify(
      errorMessage(error) ?? "No fue posible probar la integracion.",
      { type: "error" },
    );
  }
};

const syncProviders = async () => {
  try {
    syncingProviders.value = true;
    await authorizeWithTwoFactor(syncCryptoProvidersFromConfig.bind(undefined), "finance.financial_configuration");
    helper.showNotify("Sincronizacion ejecutada.");
    await loadStatus();
  } catch (error: unknown) {
    helper.showNotify(
      errorMessage(error) ?? "No fue posible sincronizar proveedores.",
      { type: "error" },
    );
  } finally {
    syncingProviders.value = false;
  }
};

const activateEmergency = async () => {
  try {
    if (
      !window.confirm(
        "Esta accion detendra compras, ventas y automatizaciones. ¿Deseas activar la parada de emergencia?",
      )
    ) {
      return;
    }

    await authorizeWithTwoFactor(activateEmergencyStop.bind(undefined, {
      reason: emergencyActivate.reason,
      public_message: emergencyActivate.public_message || null,
    }), "finance.financial_configuration");
    helper.showNotify("Parada de emergencia activada.");
    emergencyActivate.reason = "";
    emergencyActivate.public_message = "";
    await loadStatus();
  } catch (error: unknown) {
    helper.showNotify(
      errorMessage(error) ?? "No fue posible activar la parada de emergencia.",
      { type: "error" },
    );
  }
};

const requestUnlock = async () => {
  try {
    await authorizeWithTwoFactor(requestEmergencyUnlock.bind(undefined, {
      email: canEmergencyUnlockOverride.value
        ? emergencyUnlockRequest.email
        : null,
      phone: canEmergencyUnlockOverride.value
        ? emergencyUnlockRequest.phone
        : null,
    }), "finance.financial_configuration");
    helper.showNotify("Codigos enviados para desbloqueo.");
    await loadStatus();
  } catch (error: unknown) {
    const errorData = errorResponseData(error);
    const remainingSeconds = errorData?.data?.meta?.remaining_seconds;
    if (
      errorData?.data?.reason === "emergency_unlock_cooldown" &&
      typeof remainingSeconds === "number"
    ) {
      helper.showNotify(
        `Debes esperar ${remainingSeconds} segundos antes de solicitar nuevos codigos.`,
        { type: "error" },
      );
      return;
    }

    helper.showNotify(
      errorMessage(error) ?? "No fue posible solicitar el desbloqueo.",
      { type: "error" },
    );
  }
};

const confirmUnlock = async () => {
  try {
    await authorizeWithTwoFactor(confirmEmergencyUnlock.bind(undefined, {
      email_code: emergencyUnlockConfirm.email_code,
      sms_code: emergencyUnlockConfirm.sms_code,
    }), "finance.financial_configuration");
    helper.showNotify("Sistema reactivado.");
    emergencyUnlockConfirm.email_code = "";
    emergencyUnlockConfirm.sms_code = "";
    await loadStatus();
  } catch (error: unknown) {
    helper.showNotify(
      errorMessage(error) ?? "No fue posible confirmar el desbloqueo.",
      { type: "error" },
    );
  }
};

onMounted(loadAll);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold mb-1">Centro de Control</h1>
        <div class="text-body-2 text-medium-emphasis">
          Estado operativo, monedas, providers, integraciones y emergencia.
        </div>
      </div>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="loadAll"
        >Refrescar</VBtn
      >
    </div>

    <VAlert v-if="loadError" type="error" variant="tonal" class="mb-4">
      No fue posible cargar el estado productivo. Los controles permanecen bloqueados.
      <template #append><VBtn variant="text" :loading="loading" @click="loadAll">Reintentar</VBtn></template>
    </VAlert>

    <VAlert
      v-if="status?.system.status === 'emergency_stopped'"
      type="error"
      variant="tonal"
      class="mb-4"
      title="Sistema detenido por emergencia"
      :text="
        status.system.public_message ||
        'El sistema esta en emergencia. Solo puedes desbloquearlo con doble codigo.'
      "
    />

    <VRow>
      <VCol cols="12" md="6">
        <VCard rounded="lg">
          <VCardTitle>Estado general</VCardTitle>
          <VCardText>
            <div class="d-flex flex-wrap ga-2 mb-4">
              <VChip color="primary" variant="tonal">{{
                statusLabel(status?.system.status || "processing")
              }}</VChip>
              <VChip
                :color="status?.system.buy_enabled ? 'success' : 'grey'"
                variant="tonal"
                >Compras
                {{
                  status?.system.buy_enabled ? "activas" : "inactivas"
                }}</VChip
              >
              <VChip
                :color="status?.system.sell_enabled ? 'success' : 'grey'"
                variant="tonal"
                >Ventas
                {{
                  status?.system.sell_enabled ? "activas" : "inactivas"
                }}</VChip
              >
            </div>
            <VRow>
              <VCol cols="12" sm="6"
                ><VSwitch
                  v-model="systemForm.buy_enabled"
                  label="Compras activas"
                  :disabled="!canEditSystemToggles"
              /></VCol>
              <VCol cols="12" sm="6"
                ><VSwitch
                  v-model="systemForm.sell_enabled"
                  label="Ventas activas"
                  :disabled="!canEditSystemToggles"
              /></VCol>
              <VCol cols="12" sm="6"
                ><VSwitch
                  v-model="systemForm.new_orders_enabled"
                  label="Nuevas ordenes"
                  :disabled="!canEditSystemToggles"
              /></VCol>
              <VCol cols="12" sm="6"
                ><VSwitch
                  v-model="systemForm.auto_deposit_detection_enabled"
                  label="Auto deteccion"
                  :disabled="!canEditSystemToggles"
              /></VCol>
              <VCol cols="12" sm="6"
                ><VSwitch
                  v-model="systemForm.auto_payout_enabled"
                  label="Auto payout"
                  :disabled="!canEditSystemToggles"
              /></VCol>
              <VCol cols="12" sm="6"
                ><VSwitch
                  v-model="systemForm.webhook_processing_enabled"
                  label="Webhooks"
                  :disabled="!canEditSystemToggles"
              /></VCol>
              <VCol cols="12" sm="6"
                ><VSwitch
                  v-model="systemForm.polling_enabled"
                  label="Polling"
                  :disabled="!canEditSystemToggles"
              /></VCol>
              <VCol cols="12" sm="6"
                ><VTextField
                  v-model="systemForm.reason"
                  label="Razon operativa"
                  :disabled="!canUpdateSystem"
              /></VCol>
              <VCol cols="12"
                ><VTextarea
                  v-model="systemForm.public_message"
                  label="Mensaje publico"
                  rows="2"
                  :disabled="!canUpdateSystem"
              /></VCol>
            </VRow>
            <div class="d-flex flex-wrap justify-end ga-2">
              <VBtn
                v-if="canUpdateManualMode"
                color="warning"
                variant="tonal"
                :loading="savingSystem"
                :disabled="!canToggleManualMode"
                @click="toggleManualMode(status?.system.status !== 'manual')"
              >
                {{
                  status?.system.status === "manual"
                    ? "Salir de modo manual"
                    : "Activar modo manual"
                }}
              </VBtn>
              <VBtn
                v-if="canUpdateSystem"
                color="primary"
                :loading="savingSystem"
                :disabled="!canSaveSystem"
                @click="saveSystem"
                >Guardar control</VBtn
              >
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="6">
        <VCard rounded="lg">
          <VCardTitle>Parada de emergencia</VCardTitle>
          <VCardText>
            <VTextField
              v-model="emergencyActivate.reason"
              label="Motivo"
              :disabled="!canActivateEmergencyAction"
            />
            <VTextarea
              v-model="emergencyActivate.public_message"
              label="Mensaje publico"
              rows="2"
              :disabled="!canActivateEmergencyAction"
            />
            <div class="d-flex justify-end mb-4">
              <VBtn
                color="error"
                :disabled="!canActivateEmergencyAction"
                @click="activateEmergency"
                >Activar emergencia</VBtn
              >
            </div>

            <VDivider class="my-4" />

            <div class="text-subtitle-2 mb-3">Desbloqueo</div>
            <VAlert
              type="info"
              variant="tonal"
              class="mb-4"
              text="El desbloqueo requiere validar un codigo por correo y otro por SMS."
            />
            <VTextField
              v-model="emergencyUnlockRequest.email"
              label="Correo destino"
              :disabled="!canEmergencyUnlock || !canEmergencyUnlockOverride"
              :hint="
                canEmergencyUnlockOverride
                  ? 'Puedes definir un destino alterno.'
                  : 'Se usara el correo del admin autenticado.'
              "
              persistent-hint
            />
            <VTextField
              v-model="emergencyUnlockRequest.phone"
              label="Telefono SMS"
              :disabled="!canEmergencyUnlock || !canEmergencyUnlockOverride"
              :hint="
                canEmergencyUnlockOverride
                  ? 'Puedes definir un telefono alterno.'
                  : 'Se usara el telefono verificado del admin autenticado.'
              "
              persistent-hint
            />
            <div class="d-flex justify-end mb-4">
              <VBtn
                color="warning"
                variant="tonal"
                :disabled="!canEmergencyUnlock"
                @click="requestUnlock"
                >Solicitar codigos</VBtn
              >
            </div>
            <VTextField
              v-model="emergencyUnlockConfirm.email_code"
              label="Codigo email"
              :disabled="!canEmergencyUnlock"
            />
            <VTextField
              v-model="emergencyUnlockConfirm.sms_code"
              label="Codigo SMS"
              :disabled="!canEmergencyUnlock"
            />
            <div class="d-flex justify-end">
              <VBtn
                color="success"
                :disabled="!canEmergencyUnlock"
                @click="confirmUnlock"
                >Confirmar desbloqueo</VBtn
              >
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol v-if="canViewInternational" cols="12">
        <VCard rounded="lg">
          <VCardTitle class="d-flex align-center justify-space-between">
            <span>Cuentas Internacionales</span>
            <VChip
              :color="
                status?.international_accounts.external_calls_effective
                  ? 'success'
                  : 'grey'
              "
              variant="tonal"
            >
              {{
                !status?.international_accounts.enabled
                  ? "M\u00f3dulo deshabilitado"
                  : status?.international_accounts.external_calls_effective
                    ? "Llamadas externas habilitadas"
                    : "Llamadas externas inactivas"
              }}
            </VChip>
          </VCardTitle>
          <VCardText>
            <VAlert type="info" variant="tonal" class="mb-4">
              Los controles son independientes de Compra, Venta y cripto. El
              interruptor de entorno domina las llamadas externas.
            </VAlert>
            <VRow>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.enabled"
                  label="Módulo habilitado"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.external_calls_enabled"
                  label="Llamadas externas Bridge"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.new_requests_enabled"
                  label="Nuevas solicitudes"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.onboarding_enabled"
                  label="Activaci&oacute;n de clientes"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.wallet_creation_enabled"
                  label="Aprovisionamiento de wallets"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.account_creation_enabled"
                  label="Activaci&oacute;n de cuentas"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.beneficiary_creation_enabled"
                  label="Creacion de beneficiarios"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.external_account_creation_enabled"
                  label="Registro de cuentas destino"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.outbound_transfers_enabled"
                  label="Transferencias salientes"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.transfer_webhook_processing_enabled"
                  label="Notificaciones de transferencias"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.transfer_sync_enabled"
                  label="Sincronizacion de transferencias"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.fee_charging_enabled"
                  label="Cobro de comisiones"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.deposit_processing_enabled"
                  label="Procesamiento de dep&oacute;sitos"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.balance_sync_enabled"
                  label="Sincronizaci&oacute;n de saldos"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.reconciliation_enabled"
                  label="Reconciliaci&oacute;n"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.usd_enabled"
                  label="Cuenta USD"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.eur_enabled"
                  label="Cuenta EUR"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.webhook_processing_enabled"
                  label="Procesamiento de notificaciones Bridge"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.polling_enabled"
                  label="Actualizaci&oacute;n peri&oacute;dica local"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" sm="6" md="3"
                ><VSwitch
                  v-model="internationalForm.manual_mode"
                  label="Modo manual"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" md="4"
                ><VTextField
                  v-model="internationalForm.reason"
                  label="Motivo administrativo"
                  maxlength="1000"
                  :disabled="!canUpdateInternational"
              /></VCol>
              <VCol cols="12" md="5"
                ><VTextField
                  v-model="internationalForm.public_message"
                  label="Mensaje público"
                  maxlength="500"
                  :disabled="!canUpdateInternational"
              /></VCol>
            </VRow>
            <div class="d-flex justify-end">
              <VBtn
                color="primary"
                :loading="savingInternational"
                :disabled="
                  !canUpdateInternational ||
                  internationalForm.reason.trim().length < 3
                "
                @click="saveInternationalControl"
                >Guardar Cuentas Internacionales</VBtn
              >
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" v-if="canViewOperations">
        <VCard rounded="lg">
          <VCardTitle>Monedas y operaciones</VCardTitle>
          <VCardText>
            <VAlert
              v-if="isEmergencyStopped"
              type="warning"
              variant="tonal"
              class="mb-4"
              text="Durante una parada de emergencia no se pueden modificar controles de monedas. Primero completa el desbloqueo."
            />
            <VTable>
              <thead>
                <tr>
                  <th>Moneda</th>
                  <th>Red</th>
                  <th>Proveedor</th>
                  <th>Activa</th>
                  <th>Compra</th>
                  <th>Venta</th>
                  <th>Manual</th>
                  <th>Webhook</th>
                  <th>Polling</th>
                  <th>Payout</th>
                  <th class="text-right">Acci&oacute;n</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in currencyControls" :key="row.id">
                  <td>{{ row.currency }}</td>
                  <td>{{ row.network || "-" }}</td>
                  <td>
                    {{ row.provider ? cryptoProviderLabel(row.provider) : "-" }}
                  </td>
                  <td>
                    <VSwitch
                      v-model="row.enabled"
                      density="compact"
                      hide-details
                      :disabled="!canUpdateOperations || isEmergencyStopped"
                    />
                  </td>
                  <td>
                    <VSwitch
                      v-model="row.buy_enabled"
                      density="compact"
                      hide-details
                      :disabled="!canUpdateOperations || isEmergencyStopped"
                    />
                  </td>
                  <td>
                    <VSwitch
                      v-model="row.sell_enabled"
                      density="compact"
                      hide-details
                      :disabled="!canUpdateOperations || isEmergencyStopped"
                    />
                  </td>
                  <td>
                    <VSwitch
                      v-model="row.manual_mode"
                      density="compact"
                      hide-details
                      :disabled="!canUpdateOperations || isEmergencyStopped"
                    />
                  </td>
                  <td>
                    <VSwitch
                      v-model="row.webhook_processing_enabled"
                      density="compact"
                      hide-details
                      :disabled="!canUpdateOperations || isEmergencyStopped"
                    />
                  </td>
                  <td>
                    <VSwitch
                      v-model="row.polling_enabled"
                      density="compact"
                      hide-details
                      :disabled="!canUpdateOperations || isEmergencyStopped"
                    />
                  </td>
                  <td>
                    <VSwitch
                      v-model="row.auto_payout_enabled"
                      density="compact"
                      hide-details
                      :disabled="!canUpdateOperations || isEmergencyStopped"
                    />
                  </td>
                  <td class="text-right">
                    <VBtn
                      size="small"
                      color="primary"
                      :disabled="!canUpdateOperations || isEmergencyStopped"
                      @click="saveCurrencyControl(row)"
                      >Guardar</VBtn
                    >
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="7" v-if="canViewIntegrations">
        <VCard rounded="lg">
          <VCardTitle>Integraciones externas</VCardTitle>
          <VCardText>
            <div class="d-flex flex-wrap ga-2 mb-4">
              <VChip
                v-for="group in integrationGroups"
                :key="group"
                :color="selectedGroup === group ? 'primary' : 'default'"
                :variant="selectedGroup === group ? 'flat' : 'tonal'"
                @click="selectedGroup = group"
              >
                {{ group }}
              </VChip>
            </div>

            <VRow v-if="selectedRenderableIntegrationItems.length > 0">
              <VCol
                v-for="item in selectedRenderableIntegrationItems"
                :key="item.key"
                cols="12"
                md="6"
              >
                <VSwitch
                  v-if="item.type === 'boolean'"
                  v-model="integrationForm[item.key].value"
                  :label="item.label || item.key"
                  :disabled="!canUpdateIntegrations"
                />
                <template v-else>
                  <VTextField
                    v-model="integrationForm[item.key].value"
                    :type="item.is_secret ? 'password' : 'text'"
                    :label="item.label || item.key"
                    :placeholder="
                      item.is_secret
                        ? String(item.display_value || '')
                        : undefined
                    "
                    :disabled="!canUpdateIntegrations"
                  />
                  <VCheckbox
                    v-if="item.is_secret"
                    v-model="integrationForm[item.key].clear"
                    label="Borrar valor guardado"
                    :disabled="!canUpdateIntegrations"
                  />
                </template>
                <div class="text-caption text-medium-emphasis">
                  {{ item.description }}
                </div>
                <div class="text-caption mt-1">
                  Fuente:
                  <strong>
                    {{
                      item.source === "db"
                        ? "DB"
                        : item.source === "fallback"
                          ? "Fallback .env/config"
                          : "Sin configurar"
                    }}
                  </strong>
                </div>
                <div
                  v-if="item.is_secret"
                  class="text-caption text-medium-emphasis"
                >
                  {{ item.masked_value }}
                </div>
              </VCol>
            </VRow>

            <div class="d-flex flex-wrap justify-end ga-2 mt-4">
              <VBtn
                v-if="canTestIntegrations"
                variant="tonal"
                @click="testIntegration"
                >Probar grupo</VBtn
              >
              <VBtn
                v-if="canUpdateIntegrations"
                color="primary"
                :loading="savingIntegration"
                @click="saveIntegrationGroup"
                >Guardar integracion</VBtn
              >
            </div>

            <VAlert
              v-if="integrationTest"
              type="info"
              variant="tonal"
              class="mt-4"
              :text="JSON.stringify(integrationTest)"
            />
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="5">
        <VCard rounded="lg">
          <VCardTitle class="d-flex justify-space-between align-center">
            <span>Proveedores cripto</span>
            <div class="d-flex ga-2">
              <VBtn
                v-if="canViewCrypto"
                size="small"
                variant="text"
                :to="{ name: 'admin-crypto-providers' }"
              >
                Editar proveedores
              </VBtn>
              <VBtn
                v-if="canSyncCrypto"
                size="small"
                variant="tonal"
                :loading="syncingProviders"
                @click="syncProviders"
                >Sincronizar configuraci&oacute;n</VBtn
              >
            </div>
          </VCardTitle>
          <VCardText>
            <div
              v-for="provider in status?.crypto_providers ?? []"
              :key="`${provider.provider}-${provider.currency}-${provider.network}`"
              class="mb-3 pa-3 rounded border"
            >
              <div class="font-weight-medium">
                {{ cryptoProviderLabel(provider.provider) }} - {{ provider.currency }} /
                {{ provider.network }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Estado: {{ statusLabel(provider.status) }}
                <span v-if="provider.disabled_reason"
                  >- {{ cryptoDisabledReasonLabel(provider.disabled_reason) }}</span
                >
              </div>
              <div class="text-caption text-medium-emphasis">
                Campos faltantes:
                {{
                  Array.isArray(provider.missing_fields) &&
                  provider.missing_fields.length
                    ? cryptoMissingFieldLabels(provider.missing_fields).join(", ")
                    : "ninguno"
                }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12">
        <VCard rounded="lg">
          <VCardTitle>Historial reciente</VCardTitle>
          <VCardText>
            <VTable>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Acci&oacute;n</th>
                  <th>Usuario</th>
                  <th>Entidad</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in status?.history ?? []" :key="`${item.id}`">
                  <td>
                    {{
                      item.created_at
                        ? new Date(String(item.created_at)).toLocaleString()
                        : "-"
                    }}
                  </td>
                  <td>{{ item.action }}</td>
                  <td>{{ item.user_id ?? "-" }}</td>
                  <td>
                    {{ item.entity_type ?? "-" }} #{{ item.entity_id ?? "-" }}
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
