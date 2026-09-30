<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import {
  ignoreReconciliation,
  listReconciliations,
  reopenReconciliation,
  resolveReconciliation,
  type LedgerReconciliation,
  type ReconciliationListParams,
} from "@/services/reconciliationsApi";
import {
  getCurrentPage,
  getItems,
  getLastPage,
  getMeta,
  getPerPage,
  getTotal,
  type PaginationMeta,
} from "@/utils/pagination";
import ReconciliationActionDialog from "./components/ReconciliationActionDialog.vue";
import ReconciliationFilters from "./components/ReconciliationFilters.vue";
import ReconciliationSeverityBadge from "./components/ReconciliationSeverityBadge.vue";
import ReconciliationStatusBadge from "./components/ReconciliationStatusBadge.vue";

type ReconciliationAction = "resolve" | "ignore" | "reopen";

const router = useRouter();
const helper = helperStore();
const userStore = UserStore();

const rows = ref<LedgerReconciliation[]>([]);
const meta = ref<PaginationMeta>({});
const filters = ref<ReconciliationListParams>({});
const loading = ref(false);
const actionLoading = ref(false);
const selected = ref<LedgerReconciliation | null>(null);
const selectedAction = ref<ReconciliationAction | null>(null);
const actionDialog = ref(false);

const currentPage = computed(() => getCurrentPage(meta.value));
const lastPage = computed(() => getLastPage(meta.value));
const total = computed(() => getTotal(meta.value));
const perPage = computed(() => getPerPage(meta.value));

const cleanParams = (params: ReconciliationListParams): ReconciliationListParams =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  ) as ReconciliationListParams;

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const isBridge = (row: LedgerReconciliation): boolean =>
  row.metadata?.comparison_source === "bridge";

const loadRows = async (page = currentPage.value || 1) => {
  try {
    loading.value = true;
    const response = await listReconciliations(
      cleanParams({
        ...filters.value,
        page,
        per_page: perPage.value || 15,
      }),
    );
    rows.value = getItems<LedgerReconciliation>(response);
    meta.value = getMeta(response);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar reconciliaciones", "error");
  } finally {
    loading.value = false;
  }
};

const isClosed = (row: LedgerReconciliation): boolean =>
  ["resolved", "ignored"].includes(row.status ?? "") || Boolean(row.resolved_at);

const canResolve = (row: LedgerReconciliation): boolean =>
  userStore.hasPermission("ledger.reconciliation.resolve") && !isClosed(row);

const canIgnore = (row: LedgerReconciliation): boolean =>
  userStore.hasPermission("ledger.reconciliation.ignore") && !isClosed(row);

const canReopen = (row: LedgerReconciliation): boolean =>
  userStore.hasPermission("ledger.reconciliation.reopen") && isClosed(row);

const actionPermission = computed(() => {
  if (!selectedAction.value) return undefined;
  return `ledger.reconciliation.${selectedAction.value}`;
});

const openAction = (action: ReconciliationAction, row: LedgerReconciliation) => {
  selected.value = row;
  selectedAction.value = action;
  actionDialog.value = true;
};

const runAction = async (notes: string) => {
  if (!selected.value || !selectedAction.value) return;

  if ((selectedAction.value === "resolve" || selectedAction.value === "ignore") && !notes) {
    helper.showNotify("La nota es obligatoria para esta acción", "error");
    return;
  }

  try {
    actionLoading.value = true;
    if (selectedAction.value === "resolve") await authorizeWithTwoFactor(resolveReconciliation.bind(undefined, selected.value.id, notes), "finance.financial_configuration");
    if (selectedAction.value === "ignore") await authorizeWithTwoFactor(ignoreReconciliation.bind(undefined, selected.value.id, notes), "finance.financial_configuration");
    if (selectedAction.value === "reopen") await authorizeWithTwoFactor(reopenReconciliation.bind(undefined, selected.value.id, notes || undefined), "finance.financial_configuration");
    helper.showNotify("Acción ejecutada correctamente", "success");
    actionDialog.value = false;
    selected.value = null;
    selectedAction.value = null;
    await loadRows();
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible ejecutar la acción", "error");
  } finally {
    actionLoading.value = false;
  }
};

onMounted(() => loadRows(1));
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 font-weight-bold mb-0">Reconciliaciones Ledger</h1>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="loadRows()">Refrescar</VBtn>
    </div>

    <ReconciliationFilters v-model="filters" class="mb-4" :loading="loading" @apply="loadRows(1)" @reset="loadRows(1)" />

    <VCard rounded="lg">
      <VTable>
        <thead>
          <tr>
            <th>ID</th>
            <th>Severidad</th>
            <th>Estado</th>
            <th>Entidad</th>
            <th>Balance</th>
            <th>Saldo observado</th>
            <th>Ledger</th>
            <th>Diferencia</th>
            <th>Moneda</th>
            <th>Detectado por</th>
            <th>Clave de operaci&oacute;n</th>
            <th>Creado</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="13" class="text-center py-8">
              <VProgressCircular indeterminate />
            </td>
          </tr>
          <tr v-else-if="rows.length === 0">
            <td colspan="13" class="text-center py-8 text-medium-emphasis">No hay reconciliaciones.</td>
          </tr>
          <tr v-for="row in rows" v-else :key="row.id">
            <td>{{ row.uuid || row.id }}</td>
            <td><ReconciliationSeverityBadge :severity="row.severity" /></td>
            <td><ReconciliationStatusBadge :status="row.status" /></td>
            <td>{{ row.entity_type || "-" }} #{{ row.entity_id || "-" }}</td>
            <td>{{ row.balance_type || "-" }}</td>
            <td>
              {{ row.legacy_balance || "-" }}
              <div class="text-caption text-medium-emphasis">
                {{ isBridge(row) ? "Saldo Bridge" : "Saldo legacy" }}
              </div>
            </td>
            <td>{{ row.ledger_balance || "-" }}</td>
            <td>{{ row.difference || "-" }}</td>
            <td>{{ row.currency || "-" }}</td>
            <td>{{ row.detected_by || "-" }}</td>
            <td class="text-truncate" style="max-width: 180px">{{ row.operation_key || "-" }}</td>
            <td>{{ formatDate(row.created_at) }}</td>
            <td class="text-right">
              <VBtn icon="mdi-eye" size="small" variant="text" @click="router.push({ name: 'admin-ledger-reconciliation-show', params: { id: row.id } })" />
              <VBtn v-if="canResolve(row)" icon="mdi-check-circle" color="success" size="small" variant="text" @click="openAction('resolve', row)" />
              <VBtn v-if="canIgnore(row)" icon="mdi-cancel" color="grey" size="small" variant="text" @click="openAction('ignore', row)" />
              <VBtn v-if="canReopen(row)" icon="mdi-lock-open-variant" color="warning" size="small" variant="text" @click="openAction('reopen', row)" />
            </td>
          </tr>
        </tbody>
      </VTable>
      <VDivider />
      <div class="d-flex align-center justify-space-between pa-4">
        <span class="text-body-2 text-medium-emphasis">Total: {{ total }}</span>
        <div class="d-flex align-center ga-2">
          <VBtn size="small" variant="text" :disabled="currentPage <= 1 || loading" @click="loadRows(currentPage - 1)">Anterior</VBtn>
          <span class="text-body-2">{{ currentPage }} / {{ lastPage }}</span>
          <VBtn size="small" variant="text" :disabled="currentPage >= lastPage || loading" @click="loadRows(currentPage + 1)">Siguiente</VBtn>
        </div>
      </div>
    </VCard>

    <ReconciliationActionDialog
      v-model="actionDialog"
      :action="selectedAction"
      :loading="actionLoading"
      :permission="actionPermission"
      @confirm="runAction"
    />
  </div>
</template>
