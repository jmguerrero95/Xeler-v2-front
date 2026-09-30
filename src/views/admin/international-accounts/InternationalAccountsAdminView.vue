<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { computed, onMounted, reactive, ref } from "vue";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import { INTERNATIONAL_ACCOUNTS } from "@/enums/Permissions.enum";
import type {
  InternationalAccountAccess,
  InternationalAccountCandidate,
  InternationalAccountFakeScenario,
  InternationalAccountFakeTarget,
  InternationalAccountProviderState,
} from "@/interfaces/InternationalAccounts/InternationalAccounts.model";
import type { NormalizedApiError } from "@/services/apiErrors";
import {
  internationalAccountActionLabel,
  internationalAccountKycLabel,
  internationalAccountSourceLabel,
  internationalAccountStatusLabel,
  internationalProductStatusLabel,
  internationalProviderStatusLabel,
  internationalTosStatusLabel,
} from "@/utils/internationalAccountsLabels";
import {
  getAdminInternationalAccounts,
  getInternationalAccountProvider,
  markInternationalAccountEligible,
  simulateInternationalAccountProvider,
  simulateSandboxKycApproval,
  syncInternationalAccountProvider,
  transitionInternationalAccount,
  searchInternationalAccountCandidates,
  type InternationalAccountAdminAction,
} from "@/services/internationalAccountsApi";
import InternationalAccountsOperationsPanel from "./components/InternationalAccountsOperationsPanel.vue";
import InternationalOutboundOperationsPanel from "./components/InternationalOutboundOperationsPanel.vue";

const helper = helperStore();
const userStore = UserStore();
const loading = ref(false);
const rows = ref<InternationalAccountAccess[]>([]);
const summary = ref<Record<string, number>>({});
const meta = ref<Record<string, number>>({});
const filters = reactive({ search: "", status: "", product: "", page: 1 });
const eligibility = reactive({ user_id: null as number | null, reason: "" });
const candidateSearch = ref("");
const candidates = ref<InternationalAccountCandidate[]>([]);
const searchingCandidates = ref(false);
const dialog = reactive({
  open: false,
  access: null as InternationalAccountAccess | null,
  action: "take-review" as InternationalAccountAdminAction,
  reason: "",
});
const detail = reactive({
  open: false,
  access: null as InternationalAccountAccess | null,
});
const providerState = ref<InternationalAccountProviderState | null>(null);
const providerLoading = ref(false);
const providerAction = reactive({
  reason: "",
  scenario: "pending" as InternationalAccountFakeScenario,
  product: null as InternationalAccountFakeTarget,
});

const statusItems = [
  "eligible",
  "requested",
  "under_review",
  "approved",
  "rejected",
  "suspended",
];
const actionLabel = computed(() =>
  internationalAccountActionLabel(dialog.action),
);
const canEnableEligibility = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.ELIGIBILITY),
);
const canViewProvider = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.PROVIDER_VIEW),
);
const canSyncProvider = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.PROVIDER_SYNC),
);
const canSimulateProvider = computed(
  () =>
    providerState.value?.driver === "fake" &&
    userStore.hasPermission(INTERNATIONAL_ACCOUNTS.PROVIDER_SIMULATE),
);
const canSimulateSandbox = computed(
  () =>
    providerState.value?.driver === "bridge_sandbox" &&
    userStore.hasPermission(INTERNATIONAL_ACCOUNTS.PROVIDER_SIMULATE),
);
const fakeScenarios: Array<{
  title: string;
  value: InternationalAccountFakeScenario;
}> = [
  { title: "Pendiente", value: "pending" },
  { title: "Términos aceptados", value: "terms_accepted" },
  { title: "En revisión", value: "under_review" },
  { title: "Aprobado", value: "approved" },
  { title: "Rechazado", value: "rejected" },
  { title: "Pausado", value: "paused" },
  { title: "Servicio cerrado", value: "offboarded" },
];
const fakeTargets = computed(() => [
  { title: "Onboarding general", value: null },
  ...(detail.access?.requested_products ?? []).map((product) => ({
    title: product === "usd" ? "Cuenta USD" : "Cuenta EUR",
    value: product,
  })),
]);
const actionPermission: Record<InternationalAccountAdminAction, string> = {
  "take-review": INTERNATIONAL_ACCOUNTS.REVIEW,
  approve: INTERNATIONAL_ACCOUNTS.APPROVE,
  reject: INTERNATIONAL_ACCOUNTS.REJECT,
  suspend: INTERNATIONAL_ACCOUNTS.SUSPEND,
};

const actionsByStatus: Record<string, InternationalAccountAdminAction[]> = {
  requested: ["take-review"],
  under_review: ["approve", "reject"],
  approved: ["suspend"],
};
const actionsFor = (status: string): InternationalAccountAdminAction[] =>
  (actionsByStatus[status] ?? []).filter((action) =>
    userStore.hasPermission(actionPermission[action]),
  );

const searchCandidates = async () => {
  if (candidateSearch.value.trim().length < 2) return;
  try {
    searchingCandidates.value = true;
    const response = await searchInternationalAccountCandidates(
      candidateSearch.value.trim(),
    );
    candidates.value = response.data.data;
  } finally {
    searchingCandidates.value = false;
  }
};

const load = async () => {
  try {
    loading.value = true;
    const response = await getAdminInternationalAccounts({
      search: filters.search || undefined,
      status: filters.status || undefined,
      product: filters.product || undefined,
      page: filters.page,
      per_page: 20,
    });
    rows.value = response.data.data.items;
    summary.value = response.data.data.summary;
    meta.value = response.data.meta;
  } catch (caught: unknown) {
    const error = caught as NormalizedApiError;
    helper.showNotify(
      error?.message ?? "No fue posible cargar Cuentas Internacionales.",
      { type: "error" },
    );
  } finally {
    loading.value = false;
  }
};

const enableEligibility = async () => {
  const userId = Number(eligibility.user_id);
  if (
    !Number.isInteger(userId) ||
    userId <= 0 ||
    eligibility.reason.trim().length < 3
  )
    return;
  try {
    await authorizeWithTwoFactor(markInternationalAccountEligible.bind(undefined, userId, eligibility.reason.trim()), "finance.international_accounts");
    eligibility.user_id = null;
    eligibility.reason = "";
    helper.showNotify("Usuario habilitado para Cuentas Internacionales.");
    await load();
  } catch (caught: unknown) {
    const error = caught as NormalizedApiError;
    helper.showNotify(
      error?.message ?? "No fue posible habilitar al usuario.",
      { type: "error" },
    );
  }
};

const openAction = (
  access: InternationalAccountAccess,
  action: InternationalAccountAdminAction,
) => {
  dialog.access = access;
  dialog.action = action;
  dialog.reason = "";
  dialog.open = true;
};

const loadProviderState = async () => {
  if (!detail.access || !canViewProvider.value) return;
  try {
    providerLoading.value = true;
    const response = await getInternationalAccountProvider(detail.access.id);
    providerState.value = response.data.data;
  } catch (caught: unknown) {
    const error = caught as NormalizedApiError;
    helper.showNotify(
      error?.message ?? "No fue posible consultar el estado del proveedor.",
      { type: "error" },
    );
  } finally {
    providerLoading.value = false;
  }
};

const openDetail = (access: InternationalAccountAccess) => {
  detail.access = access;
  providerState.value = null;
  providerAction.reason = "";
  providerAction.scenario = "pending";
  providerAction.product = null;
  detail.open = true;
  void loadProviderState();
};

const syncProvider = async () => {
  if (!detail.access || providerAction.reason.trim().length < 3) return;
  try {
    providerLoading.value = true;
    const response = await authorizeWithTwoFactor(syncInternationalAccountProvider.bind(undefined, detail.access.id, providerAction.reason.trim()), "finance.international_accounts");
    providerState.value = response.data.data;
    providerAction.reason = "";
    helper.showNotify("Estado del proveedor sincronizado.");
  } catch (caught: unknown) {
    const error = caught as NormalizedApiError;
    helper.showNotify(
      error?.message ?? "No fue posible sincronizar el estado.",
      {
        type: "error",
      },
    );
  } finally {
    providerLoading.value = false;
  }
};

const simulateProvider = async () => {
  if (!detail.access || providerAction.reason.trim().length < 3) return;
  try {
    providerLoading.value = true;
    const response = await authorizeWithTwoFactor(simulateInternationalAccountProvider.bind(undefined, detail.access.id, providerAction.scenario, providerAction.reason.trim(), providerAction.product), "finance.international_accounts");
    providerState.value = response.data.data;
    providerAction.reason = "";
    helper.showNotify("Respuesta de demostración aplicada.");
  } catch (caught: unknown) {
    const error = caught as NormalizedApiError;
    helper.showNotify(
      error?.message ?? "No fue posible aplicar la simulación.",
      { type: "error" },
    );
  } finally {
    providerLoading.value = false;
  }
};

const simulateSandboxApproval = async () => {
  if (!detail.access || providerAction.reason.trim().length < 3) return;
  try {
    providerLoading.value = true;
    const response = await authorizeWithTwoFactor(simulateSandboxKycApproval.bind(undefined, detail.access.id, providerAction.reason.trim()), "finance.international_accounts");
    providerState.value = response.data.data;
    providerAction.reason = "";
    helper.showNotify(
      "Aprobación KYC de Bridge simulada en el entorno de pruebas.",
    );
  } catch (caught: unknown) {
    const error = caught as NormalizedApiError;
    helper.showNotify(
      error?.message ?? "No fue posible simular la aprobación KYC de Bridge.",
      { type: "error" },
    );
  } finally {
    providerLoading.value = false;
  }
};

const technicalCodes = (value: unknown): string => {
  const codes = new Set<string>();
  const collect = (item: unknown): void => {
    if (typeof item === "string") {
      codes.add(item);
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(collect);
      return;
    }
    if (item && typeof item === "object") {
      const code = (item as Record<string, unknown>).code;
      if (typeof code === "string") {
        codes.add(code);
        return;
      }
      Object.values(item).forEach(collect);
    }
  };
  collect(value);
  return [...codes].join(", ") || "Sin requisitos pendientes";
};

const formatProviderDate = (value?: string | null): string =>
  value ? new Date(value).toLocaleString() : "Sin información";

const environmentLabel = (value: string): string =>
  ({ fake: "Demostración", sandbox: "Pruebas", production: "Producción" })[
    value
  ] ?? "No identificado";

const executeAction = async () => {
  if (!dialog.access || dialog.reason.trim().length < 3) return;
  try {
    await authorizeWithTwoFactor(transitionInternationalAccount.bind(undefined, dialog.access.id, dialog.action, dialog.reason.trim()), "finance.international_accounts");
    dialog.open = false;
    helper.showNotify("Estado actualizado.");
    await load();
  } catch (caught: unknown) {
    const error = caught as NormalizedApiError;
    helper.showNotify(
      error?.message ?? "No fue posible actualizar la solicitud.",
      { type: "error" },
    );
  }
};

onMounted(load);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">Cuentas Internacionales</h1>
        <div class="text-body-2 text-medium-emphasis">
          Elegibilidad y revisión comercial Xeler.
        </div>
      </div>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="load"
        >Refrescar</VBtn
      >
    </div>

    <InternationalAccountsOperationsPanel />
    <InternationalOutboundOperationsPanel />

    <h2 class="text-h6 font-weight-bold mb-3">Solicitudes y clientes</h2>
    <VRow class="mb-2">
      <VCol v-for="status in statusItems" :key="status" cols="6" md="2"
        ><VCard rounded="lg"
          ><VCardText
            ><div class="text-caption text-medium-emphasis">
              {{ internationalAccountStatusLabel(status) }}
            </div>
            <div class="text-h5">{{ summary[status] ?? 0 }}</div></VCardText
          ></VCard
        ></VCol
      >
    </VRow>

    <VCard v-if="canEnableEligibility" rounded="lg" class="mb-4">
      <VCardTitle>Habilitar elegibilidad</VCardTitle>
      <VCardText
        ><VRow
          ><VCol cols="12" md="4"
            ><VAutocomplete
              v-model="eligibility.user_id"
              v-model:search="candidateSearch"
              label="Buscar usuario o correo"
              :items="candidates"
              item-value="id"
              :item-title="
                (item: InternationalAccountCandidate) =>
                  `${item.name} - ${item.email}`
              "
              :loading="searchingCandidates"
              no-filter
              @update:search="searchCandidates" /></VCol
          ><VCol cols="12" md="6"
            ><VTextField
              v-model="eligibility.reason"
              label="Motivo"
              maxlength="1000" /></VCol
          ><VCol cols="12" md="2"
            ><VBtn
              block
              color="primary"
              :disabled="
                !eligibility.user_id || eligibility.reason.trim().length < 3
              "
              @click="enableEligibility"
              >Habilitar</VBtn
            ></VCol
          ></VRow
        ></VCardText
      >
    </VCard>

    <VCard rounded="lg">
      <VCardText>
        <VRow
          ><VCol cols="12" md="6"
            ><VTextField
              v-model="filters.search"
              label="Buscar usuario, correo o ID"
              clearable
              @keyup.enter="load" /></VCol
          ><VCol cols="12" md="3"
            ><VSelect
              v-model="filters.status"
              label="Estado"
              :items="
                statusItems.map((value) => ({
                  title: internationalAccountStatusLabel(value),
                  value,
                }))
              "
              clearable /></VCol
          ><VCol cols="12" md="2"
            ><VSelect
              v-model="filters.product"
              label="Producto"
              :items="['usd', 'eur']"
              clearable /></VCol
          ><VCol cols="12" md="1"
            ><VBtn icon="mdi-magnify" @click="load" /></VCol
        ></VRow>
        <VTable>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>KYC Xeler</th>
              <th>Estado</th>
              <th>Productos</th>
              <th>Volumen</th>
              <th>Origen</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>
                {{ row.user?.name }}
                <div class="text-caption">{{ row.user?.email }}</div>
              </td>
              <td>{{ internationalAccountKycLabel(row.user?.kyc_status) }}</td>
              <td>
                <VChip size="small" variant="tonal">{{
                  internationalAccountStatusLabel(row.status)
                }}</VChip>
              </td>
              <td>
                {{ row.requested_products.join(", ").toUpperCase() || "-" }}
              </td>
              <td>
                {{ row.expected_monthly_volume || "-" }}
                {{ row.expected_monthly_volume_currency?.toUpperCase() }}
              </td>
              <td>{{ internationalAccountSourceLabel(row.source) }}</td>
              <td>
                {{
                  row.updated_at
                    ? new Date(row.updated_at).toLocaleString()
                    : "-"
                }}
              </td>
              <td>
                <div class="d-flex ga-1">
                  <VBtn size="small" variant="text" @click="openDetail(row)"
                    >Detalle</VBtn
                  ><VBtn
                    v-for="action in actionsFor(row.status)"
                    :key="action"
                    size="small"
                    variant="tonal"
                    @click="openAction(row, action)"
                    >{{ internationalAccountActionLabel(action) }}</VBtn
                  >
                </div>
              </td>
            </tr>
            <tr v-if="!loading && rows.length === 0">
              <td colspan="8" class="text-center py-8 text-medium-emphasis">
                No hay solicitudes con estos filtros.
              </td>
            </tr>
          </tbody>
        </VTable>
        <VPagination
          v-if="(meta.last_page ?? 1) > 1"
          v-model="filters.page"
          :length="meta.last_page"
          class="mt-4"
          @update:model-value="load"
        />
      </VCardText>
    </VCard>

    <VDialog v-model="dialog.open" max-width="520"
      ><VCard
        ><VCardTitle>{{ actionLabel }}</VCardTitle
        ><VCardText
          ><VTextarea
            v-model="dialog.reason"
            label="Motivo administrativo"
            maxlength="1000"
            counter /></VCardText
        ><VCardActions
          ><VSpacer /><VBtn variant="text" @click="dialog.open = false"
            >Cancelar</VBtn
          ><VBtn
            color="primary"
            :disabled="dialog.reason.trim().length < 3"
            @click="executeAction"
            >Confirmar</VBtn
          ></VCardActions
        ></VCard
      ></VDialog
    >
    <VDialog v-model="detail.open" max-width="920"
      ><VCard
        ><VCardTitle>Detalle de solicitud</VCardTitle
        ><VCardText v-if="detail.access"
          ><VList
            ><VListItem
              title="Usuario"
              :subtitle="`${detail.access.user?.name} · ${detail.access.user?.email}`" /><VListItem
              title="KYC Xeler"
              :subtitle="
                internationalAccountKycLabel(detail.access.user?.kyc_status)
              " /><VListItem
              title="Estado"
              :subtitle="
                internationalAccountStatusLabel(detail.access.status)
              " /><VListItem
              title="Origen"
              :subtitle="
                internationalAccountSourceLabel(detail.access.source)
              " /><VListItem
              title="Productos"
              :subtitle="
                detail.access.requested_products.join(', ').toUpperCase() || '-'
              " /><VListItem
              title="Uso previsto"
              :subtitle="detail.access.use_case || '-'" /><VListItem
              title="Volumen esperado"
              :subtitle="`${detail.access.expected_monthly_volume || '-'} ${detail.access.expected_monthly_volume_currency?.toUpperCase() || ''}`" /><VListItem
              title="Revisado por"
              :subtitle="detail.access.reviewer?.name || '-'"
          /></VList>

          <template v-if="canViewProvider">
            <VDivider class="my-4" />
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-h6">Estado del proveedor</div>
              <VBtn
                size="small"
                variant="text"
                prepend-icon="mdi-refresh"
                :loading="providerLoading"
                @click="loadProviderState"
              >
                Actualizar vista
              </VBtn>
            </div>
            <VProgressLinear
              v-if="providerLoading"
              indeterminate
              class="mb-3"
            />
            <VAlert
              v-if="!providerLoading && !providerState"
              type="info"
              variant="tonal"
            >
              La activación con el proveedor todavía no ha sido iniciada.
            </VAlert>

            <template v-if="providerState">
              <VAlert
                v-if="providerState.driver === 'fake'"
                type="warning"
                variant="tonal"
                class="mb-3"
              >
                ENTORNO DE DEMOSTRACIÓN
              </VAlert>
              <VAlert
                v-else-if="providerState.driver === 'bridge_sandbox'"
                type="warning"
                variant="tonal"
                class="mb-3"
              >
                Entorno de pruebas de Bridge
              </VAlert>
              <VRow dense>
                <VCol cols="12" md="6">
                  <VList density="compact">
                    <VListItem
                      title="Proveedor"
                      :subtitle="
                        providerState.provider === 'fake'
                          ? 'Simulado'
                          : 'Bridge'
                      "
                    />
                    <VListItem
                      title="Entorno"
                      :subtitle="environmentLabel(providerState.environment)"
                    />
                    <VListItem
                      title="ID de cliente Bridge"
                      :subtitle="
                        providerState.provider_customer_id || 'Pendiente'
                      "
                    />
                    <VListItem
                      title="ID de activación Bridge"
                      :subtitle="
                        providerState.provider_onboarding_id || 'Pendiente'
                      "
                    />
                  </VList>
                </VCol>
                <VCol cols="12" md="6">
                  <VList density="compact">
                    <VListItem
                      title="Estado general"
                      :subtitle="
                        internationalProviderStatusLabel(
                          providerState.provider_status,
                        )
                      "
                    />
                    <VListItem
                      title="KYC Bridge"
                      :subtitle="
                        internationalProviderStatusLabel(
                          providerState.kyc_status,
                        )
                      "
                    />
                    <VListItem
                      title="Términos"
                      :subtitle="
                        internationalTosStatusLabel(providerState.tos_status)
                      "
                    />
                    <VListItem
                      title="Última sincronización"
                      :subtitle="
                        formatProviderDate(providerState.last_synced_at)
                      "
                    />
                  </VList>
                </VCol>
              </VRow>

              <VRow class="mt-1">
                <VCol
                  v-for="endorsement in providerState.endorsements"
                  :key="endorsement.type"
                  cols="12"
                  md="6"
                >
                  <VCard variant="outlined" height="100%">
                    <VCardTitle>
                      {{
                        endorsement.type === "base"
                          ? "Cuenta USD"
                          : "Cuenta EUR"
                      }}
                    </VCardTitle>
                    <VCardSubtitle>
                      Referencia técnica Bridge: {{ endorsement.type }}
                    </VCardSubtitle>
                    <VCardText>
                      <div class="mb-2">
                        Estado:
                        {{
                          internationalProductStatusLabel(endorsement.status)
                        }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        Requisitos actuales
                      </div>
                      <div class="text-body-2 mb-2">
                        {{ technicalCodes(endorsement.requirements) }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        Requisitos futuros
                      </div>
                      <div class="text-body-2">
                        {{ technicalCodes(endorsement.future_requirements) }}
                      </div>
                      <div
                        v-if="endorsement.future_requirements_effective_at"
                        class="text-body-2 mt-2"
                      >
                        Fecha de entrada en vigor:
                        {{
                          formatProviderDate(
                            endorsement.future_requirements_effective_at,
                          )
                        }}
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>

              <VTextarea
                v-if="
                  canSyncProvider || canSimulateProvider || canSimulateSandbox
                "
                v-model="providerAction.reason"
                label="Motivo administrativo"
                rows="2"
                maxlength="1000"
                class="mt-4"
              />
              <div class="d-flex flex-wrap ga-3">
                <VBtn
                  v-if="canSyncProvider"
                  variant="tonal"
                  :loading="providerLoading"
                  :disabled="providerAction.reason.trim().length < 3"
                  @click="syncProvider"
                >
                  Sincronizar estado
                </VBtn>
                <VSelect
                  v-if="canSimulateProvider"
                  v-model="providerAction.scenario"
                  label="Simular respuesta del proveedor"
                  :items="fakeScenarios"
                  density="compact"
                  max-width="300"
                  hide-details
                />
                <VSelect
                  v-if="canSimulateProvider"
                  v-model="providerAction.product"
                  label="Aplicar simulación a"
                  :items="fakeTargets"
                  density="compact"
                  max-width="260"
                  hide-details
                />
                <VBtn
                  v-if="canSimulateProvider"
                  color="warning"
                  variant="tonal"
                  :loading="providerLoading"
                  :disabled="providerAction.reason.trim().length < 3"
                  @click="simulateProvider"
                >
                  Aplicar simulación
                </VBtn>
                <VBtn
                  v-if="canSimulateSandbox"
                  color="warning"
                  variant="tonal"
                  :loading="providerLoading"
                  :disabled="providerAction.reason.trim().length < 3"
                  @click="simulateSandboxApproval"
                >
                  Simular aprobación KYC de Bridge
                </VBtn>
              </div>
            </template>
          </template> </VCardText
        ><VCardActions
          ><VSpacer /><VBtn @click="detail.open = false"
            >Cerrar</VBtn
          ></VCardActions
        ></VCard
      ></VDialog
    >
  </div>
</template>
