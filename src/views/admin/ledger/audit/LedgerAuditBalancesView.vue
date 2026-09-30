<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { helperStore } from "@/helper";
import { getLedgerAuditBalances, type LedgerAuditBalancesReport, type OperabilityListParams } from "@/services/operabilityApi";
import { getCurrentPage, getLastPage, getMeta, getPayload, getPerPage, getTotal, type PaginationMeta } from "@/utils/pagination";
import JsonViewer from "@/views/admin/operability/components/JsonViewer.vue";
import MetricCard from "@/views/admin/operability/components/MetricCard.vue";
import SeverityChip from "@/views/admin/operability/components/SeverityChip.vue";
import StatusChip from "@/views/admin/operability/components/StatusChip.vue";

const helper = helperStore();
const report = ref<LedgerAuditBalancesReport | null>(null);
const meta = ref<PaginationMeta>({});
const filters = ref<OperabilityListParams>({});
const loading = ref(false);
const currentPage = computed(() => getCurrentPage(meta.value));
const lastPage = computed(() => getLastPage(meta.value));
const total = computed(() => getTotal(meta.value));
const perPage = computed(() => getPerPage(meta.value));
const rows = computed(() => report.value?.items ?? []);
const clean = (params: OperabilityListParams) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));

const severityOf = (row: Record<string, unknown>) =>
  String(row.severity ?? row.reconciliation_severity ?? row.drift_severity ?? "unknown");

const stringValue = (value: unknown, fallback = "-") =>
  value === null || value === undefined || value === "" ? fallback : String(value);

const load = async (page = currentPage.value || 1) => {
  try {
    loading.value = true;
    const res = await getLedgerAuditBalances(clean({ ...filters.value, page, per_page: perPage.value || 15 }));
    report.value = getPayload<LedgerAuditBalancesReport>(res);
    meta.value = getMeta(res);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar auditoria de balances", "error");
  } finally {
    loading.value = false;
  }
};
onMounted(() => load(1));
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 font-weight-bold mb-0">Ledger Audit Balances</h1>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="load()">Refrescar</VBtn>
    </div>
    <VRow class="mb-2">
      <VCol cols="12" sm="6" md="3"><MetricCard title="Entities checked" :value="report?.total_entities_checked" :loading="loading" /></VCol>
      <VCol cols="12" sm="6" md="3"><MetricCard title="Matches" :value="report?.total_matches" :loading="loading" /></VCol>
      <VCol cols="12" sm="6" md="3"><MetricCard title="Mismatches" :value="report?.total_mismatches" color="warning" :loading="loading" /></VCol>
      <VCol cols="12" sm="6" md="3"><MetricCard title="Ready" :value="report?.ready_for_source_of_truth ? 'READY' : 'NOT_READY'" :loading="loading" /></VCol>
    </VRow>
    <VCard rounded="lg" class="mb-4"><VCardText>
      <VRow>
        <VCol cols="12" sm="3"><VCheckbox v-model="filters.only_mismatches" label="Solo mismatches" /></VCol>
        <VCol cols="12" sm="3"><VCheckbox v-model="filters.critical_only" label="Solo critical" /></VCol>
        <VCol cols="12" sm="3"><VTextField v-model="filters.entity_type" label="Entity type" clearable /></VCol>
        <VCol cols="12" sm="3"><VTextField v-model="filters.user_id" label="User ID" clearable /></VCol>
      </VRow>
      <div class="d-flex justify-end ga-2"><VBtn variant="text" @click="filters = {}; load(1)">Limpiar</VBtn><VBtn :loading="loading" @click="load(1)">Aplicar</VBtn></div>
    </VCardText></VCard>
    <VCard rounded="lg">
      <VTable>
        <thead><tr><th>Severity</th><th>Entity</th><th>Account</th><th>Legacy</th><th>Ledger</th><th>Diff</th><th>Status</th><th>Detalle</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="8" class="text-center py-8"><VProgressCircular indeterminate /></td></tr>
          <tr v-else-if="rows.length === 0"><td colspan="8" class="text-center py-8 text-medium-emphasis">Sin resultados.</td></tr>
          <tr v-for="(row, index) in rows" v-else :key="index">
            <td><SeverityChip :severity="severityOf(row)" /></td>
            <td>{{ stringValue(row.entity_type) }} #{{ stringValue(row.entity_id) }}</td>
            <td>{{ stringValue(row.account_id ?? row.balance_type) }}</td>
            <td>{{ stringValue(row.legacy_balance) }}</td>
            <td>{{ stringValue(row.ledger_balance) }}</td>
            <td>{{ stringValue(row.difference ?? row.diff) }}</td>
            <td><StatusChip :value="stringValue(row.status ?? row.result)" /></td>
            <td style="min-width:240px"><JsonViewer :value="row" collapsed max-height="220px" /></td>
          </tr>
        </tbody>
      </VTable>
      <VDivider />
      <div class="d-flex align-center justify-space-between pa-4"><span class="text-body-2 text-medium-emphasis">Total: {{ total }}</span><div class="d-flex align-center ga-2"><VBtn size="small" variant="text" :disabled="currentPage <= 1 || loading" @click="load(currentPage - 1)">Anterior</VBtn><span class="text-body-2">{{ currentPage }} / {{ lastPage }}</span><VBtn size="small" variant="text" :disabled="currentPage >= lastPage || loading" @click="load(currentPage + 1)">Siguiente</VBtn></div></div>
    </VCard>
  </div>
</template>
