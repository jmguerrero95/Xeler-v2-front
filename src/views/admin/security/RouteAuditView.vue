<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { helperStore } from "@/helper";
import { getRouteAudit, type OperabilityListParams, type RouteAuditFinding, type RouteAuditReport } from "@/services/operabilityApi";
import { getCurrentPage, getLastPage, getMeta, getPayload, getPerPage, getTotal, type PaginationMeta } from "@/utils/pagination";
import SeverityChip from "@/views/admin/operability/components/SeverityChip.vue";

const helper = helperStore();
const report = ref<RouteAuditReport | null>(null);
const meta = ref<PaginationMeta>({});
const loading = ref(false);
const filters = ref<OperabilityListParams>({});

const currentPage = computed(() => getCurrentPage(meta.value));
const lastPage = computed(() => getLastPage(meta.value));
const total = computed(() => getTotal(meta.value));
const perPage = computed(() => getPerPage(meta.value));
const rows = computed<RouteAuditFinding[]>(() => report.value?.findings ?? []);

const cleanParams = (params: OperabilityListParams) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));

const load = async (page = currentPage.value || 1) => {
  try {
    loading.value = true;
    const res = await getRouteAudit(cleanParams({ ...filters.value, page, per_page: perPage.value || 15 }));
    report.value = getPayload<RouteAuditReport>(res);
    meta.value = getMeta(res);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar route audit", "error");
  } finally {
    loading.value = false;
  }
};

onMounted(() => load(1));
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 font-weight-bold mb-0">Route Audit</h1>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="load()">Refrescar</VBtn>
    </div>

    <VCard rounded="lg" class="mb-4">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="3"><VSelect v-model="filters.severity" label="Severity" clearable :items="['critical','high','medium','low']" /></VCol>
          <VCol cols="12" sm="3"><VSelect v-model="filters.method" label="Method" clearable :items="['GET','POST','PUT','PATCH','DELETE']" /></VCol>
          <VCol cols="12" sm="3"><VTextField v-model="filters.type" label="Type" clearable /></VCol>
          <VCol cols="12" sm="3"><VTextField v-model="filters.path" label="Path" clearable /></VCol>
        </VRow>
        <div class="d-flex justify-end ga-2">
          <VBtn variant="text" @click="filters = {}; load(1)">Limpiar</VBtn>
          <VBtn :loading="loading" @click="load(1)">Aplicar</VBtn>
        </div>
      </VCardText>
    </VCard>

    <VCard rounded="lg">
      <VCardTitle class="d-flex flex-wrap ga-2">
        <VChip color="error" variant="tonal">Critical {{ report?.summary?.critical ?? 0 }}</VChip>
        <VChip color="deep-orange" variant="tonal">High {{ report?.summary?.high ?? 0 }}</VChip>
        <VChip color="warning" variant="tonal">Medium {{ report?.summary?.medium ?? 0 }}</VChip>
        <VChip color="info" variant="tonal">Low {{ report?.summary?.low ?? 0 }}</VChip>
      </VCardTitle>
      <VTable>
        <thead><tr><th>Severity</th><th>Method</th><th>Path</th><th>Type</th><th>Recommendation</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="5" class="text-center py-8"><VProgressCircular indeterminate /></td></tr>
          <tr v-else-if="rows.length === 0"><td colspan="5" class="text-center py-8 text-medium-emphasis">Sin hallazgos.</td></tr>
          <tr v-for="(row, index) in rows" v-else :key="index">
            <td><SeverityChip :severity="row.severity" /></td>
            <td>{{ row.method || "-" }}</td>
            <td>{{ row.path || row.uri || "-" }}</td>
            <td>{{ row.type || "-" }}</td>
            <td>{{ row.recommendation || row.message || "-" }}</td>
          </tr>
        </tbody>
      </VTable>
      <VDivider />
      <div class="d-flex align-center justify-space-between pa-4">
        <span class="text-body-2 text-medium-emphasis">Total: {{ total }}</span>
        <div class="d-flex align-center ga-2">
          <VBtn size="small" variant="text" :disabled="currentPage <= 1 || loading" @click="load(currentPage - 1)">Anterior</VBtn>
          <span class="text-body-2">{{ currentPage }} / {{ lastPage }}</span>
          <VBtn size="small" variant="text" :disabled="currentPage >= lastPage || loading" @click="load(currentPage + 1)">Siguiente</VBtn>
        </div>
      </div>
    </VCard>
  </div>
</template>

