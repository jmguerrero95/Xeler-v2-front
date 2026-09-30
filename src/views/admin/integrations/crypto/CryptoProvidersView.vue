<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { computed, onMounted, ref } from "vue";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import { CRYPTO } from "@/enums/Permissions.enum";
import { cryptoMissingFieldLabels } from "@/utils/cryptoProviderLabels";
import {
  listCryptoProviderAccounts,
  listCryptoProviders,
  testCryptoProviderConnection,
  updateCryptoProvider,
  updateCryptoProviderAccount,
} from "@/services/cryptoProvidersApi";
import type {
  CryptoProviderAccount,
  CryptoProviderAccountPayload,
  CryptoProviderConfig,
  CryptoProviderConfigPayload,
  CryptoProviderFieldSchema,
} from "@/interfaces/Crypto/Crypto.model";

const helper = helperStore();
const userStore = UserStore();

const accounts = ref<CryptoProviderAccount[]>([]);
const configs = ref<CryptoProviderConfig[]>([]);
const loading = ref(false);
const testingProvider = ref<number | null>(null);
const savingAccount = ref<Record<string, boolean>>({});
const savingConfig = ref<Record<number, boolean>>({});
const accountForms = ref<Record<string, Record<string, any>>>({});
const configForms = ref<Record<number, Record<string, any>>>({});

const canUpdate = computed(() => userStore.hasPermission(CRYPTO.PROVIDER_UPDATE));
const canTestConnection = computed(() => userStore.hasPermission(CRYPTO.PROVIDER_TEST));

const groupedConfigs = computed<Record<string, CryptoProviderConfig[]>>(() =>
  configs.value.reduce((acc, item) => {
    (acc[item.provider] ||= []).push(item);
    return acc;
  }, {} as Record<string, CryptoProviderConfig[]>)
);

const providers = computed(() =>
  accounts.value.map((account) => ({
    account,
    configs: groupedConfigs.value[account.provider] ?? [],
  }))
);

const sourceLabel = (source?: string) =>
  source === "db" ? "Usando DB" : source === "fallback" ? "Usando .env" : "No configurado";

const secretSummary = (state?: { has_value?: boolean; preview?: string | null; source?: string }) => {
  return state?.has_value ? "Configurada" : "No configurada";
};

const fieldSections = (fields: CryptoProviderFieldSchema[], section: CryptoProviderFieldSchema["section"]) =>
  fields.filter((field) => field.section === section);

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : "-");

const buildAccountForm = (account: CryptoProviderAccount) => {
  const form: Record<string, any> = {
    enabled: account.enabled,
    external_calls_enabled: account.external_calls_enabled,
    base_url: account.base_url ?? "",
    express_base_url: account.express_base_url ?? "",
    express_host: account.express_host ?? "",
    express_port: account.express_port ?? "",
    timeout_seconds: account.timeout_seconds ?? "",
    metadata: account.metadata ?? {},
    api_key: "",
    access_token: "",
    webhook_secret: "",
    clear_api_key: false,
    clear_access_token: false,
    clear_webhook_secret: false,
  };

  accountForms.value[account.provider] = form;
};

const buildConfigForm = (config: CryptoProviderConfig) => {
  configForms.value[config.id] = {
    enabled: config.enabled,
    external_calls_enabled: config.external_calls_enabled ?? true,
    confirmations_required: config.confirmations_required ?? "",
    min_amount: config.min_amount ?? "",
    max_amount: config.max_amount ?? "",
    auto_payout_limit_usd: config.auto_payout_limit_usd ?? "",
    wallet_id: "",
    wallet_passphrase: "",
    clear_wallet_id: false,
    clear_wallet_passphrase: false,
    metadata: config.metadata ?? {},
  };
};

const hydrateForms = () => {
  accountForms.value = {};
  configForms.value = {};
  accounts.value.forEach(buildAccountForm);
  configs.value.forEach(buildConfigForm);
};

const load = async () => {
  try {
    loading.value = true;
    const [accountRes, configRes] = await Promise.all([
      listCryptoProviderAccounts(),
      listCryptoProviders({ per_page: 100 }),
    ]);

    accounts.value = accountRes.data.data ?? [];
    configs.value = configRes.data.data ?? [];
    hydrateForms();
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar la configuración cripto.", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const buildAccountPayload = (account: CryptoProviderAccount): CryptoProviderAccountPayload => {
  const form = accountForms.value[account.provider] ?? {};
  const payload: Record<string, any> = {};

  for (const field of account.schema.provider_fields) {
    const value = form[field.key];

    if (field.type === "secret") {
      const clearKey = field.clear_key as keyof CryptoProviderAccountPayload | undefined;
      if (clearKey && form[clearKey]) {
        payload[clearKey] = true;
      } else if (typeof value === "string" && value.trim() !== "") {
        payload[field.key] = value.trim();
      }
      continue;
    }

    if (field.key === "network") {
      continue;
    }

    if (field.type === "integer") {
      payload[field.key] = value === "" ? null : Number(value);
      continue;
    }

    if (field.type === "boolean") {
      payload[field.key] = Boolean(value);
      continue;
    }

    payload[field.key] = value === "" ? null : value;
  }

  return payload as CryptoProviderAccountPayload;
};

const buildConfigPayload = (config: CryptoProviderConfig): CryptoProviderConfigPayload => {
  const form = configForms.value[config.id] ?? {};
  const payload: Record<string, any> = {};

  for (const field of config.schema?.currency_fields ?? []) {
    const value = form[field.key];

    if (field.type === "secret") {
      const clearKey = field.clear_key as keyof CryptoProviderConfigPayload | undefined;
      if (clearKey && form[clearKey]) {
        payload[clearKey] = true;
      } else if (typeof value === "string" && value.trim() !== "") {
        payload[field.key] = value.trim();
      }
      continue;
    }

    if (field.type === "integer") {
      payload[field.key] = value === "" ? null : Number(value);
      continue;
    }

    if (field.type === "decimal") {
      payload[field.key] = value === "" ? null : String(value);
      continue;
    }

    if (field.type === "boolean") {
      payload[field.key] = Boolean(value);
      continue;
    }

    payload[field.key] = value === "" ? null : value;
  }

  return payload as CryptoProviderConfigPayload;
};

const visibleMissingFieldLabels = (missingFields: unknown[], config: CryptoProviderConfig): string[] => {
  const account = accounts.value.find((item) => item.provider === config.provider);
  const fields = [
    ...(account?.schema.provider_fields ?? []),
    ...(config.schema?.currency_fields ?? []),
  ];

  return cryptoMissingFieldLabels(missingFields, fields);
};

const describeTestConnection = (payload: Record<string, any>, config: CryptoProviderConfig): { message: string; type: "success" | "warning" | "error" } => {
  const disabledReason = payload?.disabled_reason;
  const missingFields = Array.isArray(payload?.missing_fields) ? payload.missing_fields.filter(Boolean) : [];

  if (disabledReason === "missing_required_fields") {
    return {
      type: "warning",
      message: `Faltan campos requeridos: ${visibleMissingFieldLabels(missingFields, config).join(", ") || "sin detalle"}.`,
    };
  }

  if (disabledReason === "provider_disabled") {
    return {
      type: "warning",
      message: payload?.message || "El proveedor está deshabilitado.",
    };
  }

  if (disabledReason === "external_calls_disabled") {
    return {
      type: "warning",
      message: payload?.message || "Las llamadas externas están deshabilitadas para esta moneda.",
    };
  }

  if (disabledReason === "global_external_calls_disabled") {
    return {
      type: "warning",
      message: "Las llamadas externas globales están deshabilitadas.",
    };
  }

  return {
    type: payload?.healthy === false ? "warning" : "success",
    message: payload?.message || (payload?.healthy === false ? "El proveedor respondió con una alerta." : "Prueba de conexión ejecutada."),
  };
};

const saveAccount = async (account: CryptoProviderAccount) => {
  try {
    savingAccount.value[account.provider] = true;
    await authorizeWithTwoFactor(updateCryptoProviderAccount.bind(undefined, account.provider, buildAccountPayload(account)), "finance.financial_configuration");
    helper.showNotify(`Configuración de ${account.label} guardada.`);
    await load();
  } catch (error: any) {
    helper.showNotify(error?.message ?? `No fue posible guardar ${account.label}.`, { type: "error" });
  } finally {
    savingAccount.value[account.provider] = false;
  }
};

const saveConfig = async (config: CryptoProviderConfig) => {
  try {
    savingConfig.value[config.id] = true;
    await authorizeWithTwoFactor(updateCryptoProvider.bind(undefined, config.id, buildConfigPayload(config)), "finance.financial_configuration");
    helper.showNotify(`Configuración ${config.currency}/${config.network} guardada.`);
    await load();
  } catch (error: any) {
    helper.showNotify(error?.message ?? `No fue posible guardar ${config.currency}/${config.network}.`, { type: "error" });
  } finally {
    savingConfig.value[config.id] = false;
  }
};

const testConnection = async (config: CryptoProviderConfig) => {
  if (!canTestConnection.value) return;

  try {
    testingProvider.value = config.id;
    const res = await authorizeWithTwoFactor(testCryptoProviderConnection.bind(undefined, config.id), "finance.financial_configuration");
    const payload = res.data.data as any;
    const feedback = describeTestConnection(payload ?? {}, config);
    helper.showNotify(feedback.message, { type: feedback.type });
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible probar el proveedor.", { type: "error" });
  } finally {
    testingProvider.value = null;
  }
};

onMounted(load);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <div>
        <h1 class="text-h5 font-weight-bold mb-1">Proveedores cripto</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Credenciales globales por proveedor y configuración operativa por moneda/red.
        </p>
      </div>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="load">Refrescar</VBtn>
    </div>

    <VAlert
      type="info"
      variant="tonal"
      class="mb-4"
      text="Los secretos nunca se muestran completos. Si dejas el campo vacío, el valor actual se conserva."
    />

    <div v-if="loading" class="d-flex justify-center py-16">
      <VProgressCircular indeterminate />
    </div>

    <div v-else class="d-flex flex-column ga-4">
      <VCard v-for="providerBlock in providers" :key="providerBlock.account.provider" rounded="lg">
        <VCardTitle class="d-flex justify-space-between align-center flex-wrap ga-2">
          <div>
            <div class="text-h6">{{ providerBlock.account.label }}</div>
            <div class="text-caption text-medium-emphasis">Proveedor: {{ providerBlock.account.label }}</div>
          </div>
          <div class="d-flex ga-2">
            <VChip size="small" :color="providerBlock.account.enabled ? 'success' : 'grey'" variant="tonal">
              {{ providerBlock.account.enabled ? "Habilitado" : "Deshabilitado" }}
            </VChip>
            <VChip size="small" :color="providerBlock.account.external_calls_enabled ? 'primary' : 'grey'" variant="tonal">
              {{ providerBlock.account.external_calls_enabled ? "Llamadas reales" : "Sin llamadas reales" }}
            </VChip>
          </div>
        </VCardTitle>
        <VCardText>
          <div class="text-subtitle-2 mb-2">1. Estado del proveedor</div>
          <VAlert
            v-if="providerBlock.account.provider === 'bitgo'"
            type="success"
            variant="tonal"
            class="mb-3"
            text="Entorno de ejecución: Producción"
          />
          <VRow class="mb-2">
            <VCol
              v-for="field in fieldSections(providerBlock.account.schema.provider_fields, 'status')"
              :key="field.key"
              cols="12"
              md="4"
            >
              <VSwitch
                v-model="accountForms[providerBlock.account.provider][field.key]"
                :label="field.label"
                color="primary"
                :disabled="!canUpdate"
              />
            </VCol>
          </VRow>

          <div class="text-subtitle-2 mb-2">2. Credenciales globales</div>
          <VRow class="mb-2">
            <VCol
              v-for="field in fieldSections(providerBlock.account.schema.provider_fields, 'credentials')"
              :key="field.key"
              cols="12"
              md="6"
            >
              <VTextField
                v-model="accountForms[providerBlock.account.provider][field.key]"
                :label="field.label"
                :placeholder="field.placeholder"
                type="password"
                autocomplete="new-password"
                :disabled="!canUpdate"
              />
              <div class="text-caption text-medium-emphasis mb-1">
                {{ secretSummary(providerBlock.account.secret_fields?.[field.key]) }}
              </div>
              <div class="d-flex align-center justify-space-between">
                <VChip size="x-small" variant="tonal">
                  {{ secretSummary(providerBlock.account.secret_fields?.[field.key]) }}
                </VChip>
                <VCheckbox
                  v-if="field.clear_key"
                  v-model="accountForms[providerBlock.account.provider][field.clear_key]"
                  density="compact"
                  hide-details
                  label="Borrar valor guardado"
                  :disabled="!canUpdate"
                />
              </div>
            </VCol>
          </VRow>

          <div class="text-subtitle-2 mb-2">3. Configuración global</div>
          <VRow class="mb-4">
            <VCol
              v-for="field in fieldSections(providerBlock.account.schema.provider_fields, 'configuration')"
              :key="field.key"
              cols="12"
              md="4"
            >
              <VTextField
                v-model="accountForms[providerBlock.account.provider][field.key]"
                :label="field.label"
                :type="field.type === 'integer' ? 'number' : 'text'"
                :disabled="!canUpdate"
              />
              <div class="text-caption text-medium-emphasis">
                {{ sourceLabel(providerBlock.account.field_sources?.[field.key]) }}
              </div>
            </VCol>
          </VRow>

          <div class="d-flex justify-end mb-4">
            <VBtn
              color="primary"
              :loading="Boolean(savingAccount[providerBlock.account.provider])"
              :disabled="!canUpdate"
              @click="saveAccount(providerBlock.account)"
            >
              Guardar proveedor
            </VBtn>
          </div>

          <VDivider class="mb-4" />

          <div class="text-subtitle-2 mb-3">4. Configuración por moneda</div>
          <VRow>
            <VCol v-for="config in providerBlock.configs" :key="config.id" cols="12" md="6">
                <VCard variant="outlined" rounded="lg">
                <VCardTitle class="d-flex justify-space-between align-center">
                  <div>{{ config.currency }} / {{ config.network }}</div>
                  <div class="d-flex ga-2">
                    <VChip size="x-small" :color="config.enabled ? 'success' : 'grey'" variant="tonal">
                      {{ config.enabled ? "Activa" : "Inactiva" }}
                    </VChip>
                    <VChip size="x-small" :color="config.external_calls_enabled ? 'primary' : 'grey'" variant="tonal">
                      {{ config.external_calls_enabled ? "Llamadas moneda activas" : "Llamadas moneda pausadas" }}
                    </VChip>
                  </div>
                </VCardTitle>
                <VCardText>
                  <VAlert
                    v-if="!providerBlock.account.external_calls_enabled"
                    type="warning"
                    variant="tonal"
                    class="mb-3"
                    text="El proveedor tiene las llamadas externas globales deshabilitadas. Aunque esta moneda quede activa, la ejecución efectiva seguirá bloqueada hasta reactivar el proveedor."
                  />
                  <div
                    v-if="fieldSections(config.schema?.currency_fields ?? [], 'status').length"
                    class="text-subtitle-2 mb-2"
                  >
                    Estado de la moneda
                  </div>
                  <VRow v-if="fieldSections(config.schema?.currency_fields ?? [], 'status').length" class="mb-1">
                    <VCol
                      v-for="field in fieldSections(config.schema?.currency_fields ?? [], 'status')"
                      :key="field.key"
                      cols="12"
                      sm="6"
                    >
                      <VSwitch
                        v-model="configForms[config.id][field.key]"
                        :label="field.label"
                        color="primary"
                        :disabled="!canUpdate"
                      />
                      <div class="text-caption text-medium-emphasis">
                        {{ sourceLabel(config.field_sources?.[field.key]) }}
                      </div>
                    </VCol>
                  </VRow>
                  <VRow>
                    <VCol
                      v-for="field in fieldSections(config.schema?.currency_fields ?? [], 'configuration').filter((item) => item.key !== 'network')"
                      :key="field.key"
                      cols="12"
                      sm="6"
                    >
                      <VSwitch
                        v-if="field.type === 'boolean'"
                        v-model="configForms[config.id][field.key]"
                        :label="field.label"
                        color="primary"
                        :disabled="!canUpdate"
                      />
                      <template v-else>
                        <VTextField
                          v-model="configForms[config.id][field.key]"
                          :label="field.label"
                          :type="field.type === 'integer' ? 'number' : 'text'"
                          :disabled="!canUpdate"
                        />
                        <div class="text-caption text-medium-emphasis">
                          {{ sourceLabel(config.field_sources?.[field.key]) }}
                        </div>
                      </template>
                    </VCol>

                    <VCol
                      v-for="field in fieldSections(config.schema?.currency_fields ?? [], 'credentials')"
                      :key="field.key"
                      cols="12"
                    >
                      <VTextField
                        v-model="configForms[config.id][field.key]"
                        :label="field.label"
                        :placeholder="field.placeholder"
                        type="password"
                        autocomplete="new-password"
                        :disabled="!canUpdate"
                      />
                      <div class="text-caption text-medium-emphasis mb-1">
                        {{ secretSummary(config.secret_fields?.[field.key]) }}
                      </div>
                      <div class="d-flex align-center justify-space-between">
                        <VChip size="x-small" variant="tonal">
                          {{ secretSummary(config.secret_fields?.[field.key]) }}
                        </VChip>
                        <VCheckbox
                          v-if="field.clear_key"
                          v-model="configForms[config.id][field.clear_key]"
                          density="compact"
                          hide-details
                          label="Borrar valor guardado"
                          :disabled="!canUpdate"
                        />
                      </div>
                    </VCol>
                  </VRow>
                </VCardText>
                <VCardActions class="justify-space-between">
                  <div class="text-caption text-medium-emphasis">
                    Actualizado: {{ formatDate(config.updated_at) }}
                  </div>
                  <div class="d-flex ga-2">
                    <VBtn
                      v-if="canTestConnection"
                      variant="text"
                      :loading="testingProvider === config.id"
                      @click="testConnection(config)"
                    >
                      Probar conexión
                    </VBtn>
                    <VBtn
                      color="primary"
                      :loading="Boolean(savingConfig[config.id])"
                      :disabled="!canUpdate"
                      @click="saveConfig(config)"
                    >
                      Guardar
                    </VBtn>
                  </div>
                </VCardActions>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>
