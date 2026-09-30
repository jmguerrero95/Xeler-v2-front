<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { helperStore } from "@/helper";
import { listAdminAuditLogs, type AdminAuditListParams, type AdminAuditLog } from "@/services/adminAuditApi";
import { getCurrentPage, getItems, getLastPage, getMeta, getPerPage, getTotal, type PaginationMeta } from "@/utils/pagination";

const router = useRouter();
const helper = helperStore();
const rows = ref<AdminAuditLog[]>([]);
const meta = ref<PaginationMeta>({});
const defaultFilters = (): AdminAuditListParams => ({ timezone: "America/Bogota" });
const filters = ref<AdminAuditListParams>(defaultFilters());
const loading = ref(false);
const currentPage = computed(() => getCurrentPage(meta.value));
const lastPage = computed(() => getLastPage(meta.value));
const total = computed(() => getTotal(meta.value));
const perPage = computed(() => getPerPage(meta.value));

const clean = (params: AdminAuditListParams) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : "-";

const load = async (page = currentPage.value || 1) => {
  try {
    loading.value = true;
    const res = await listAdminAuditLogs(clean({ ...filters.value, page, per_page: perPage.value || 15 }));
    rows.value = getItems<AdminAuditLog>(res);
    meta.value = getMeta(res);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar audit logs", "error");
  } finally {
    loading.value = false;
  }
};

onMounted(() => load(1));
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 font-weight-bold mb-0">Admin Audit Logs</h1>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="load()">Refrescar</VBtn>
    </div>
    <VCard rounded="lg" class="mb-4">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="4"><VTextField v-model="filters.action" label="Action" clearable /></VCol>
          <VCol cols="12" sm="4"><VTextField v-model="filters.user_id" label="User ID" clearable /></VCol>
          <VCol cols="12" sm="4"><VTextField v-model="filters.entity_type" label="Entity type" clearable /></VCol>
          <VCol cols="12" sm="4"><VTextField v-model="filters.request_id" label="Request ID" clearable /></VCol>
          <VCol cols="12" sm="4"><VTextField v-model="filters.date_from" label="Desde" type="date" clearable /></VCol>
          <VCol cols="12" sm="4"><VTextField v-model="filters.date_to" label="Hasta" type="date" clearable /></VCol>
        </VRow>
        <div class="d-flex justify-end ga-2">
          <VBtn variant="text" @click="filters = defaultFilters(); load(1)">Limpiar</VBtn>
          <VBtn :loading="loading" @click="load(1)">Aplicar</VBtn>
        </div>
      </VCardText>
    </VCard>
    <VCard rounded="lg">
      <VTable>
        <thead><tr><th>User</th><th>Action</th><th>Entity</th><th>Request ID</th><th>IP</th><th>Created</th><th class="text-right">Acciones</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="text-center py-8"><VProgressCircular indeterminate /></td></tr>
          <tr v-else-if="rows.length === 0"><td colspan="7" class="text-center py-8 text-medium-emphasis">Sin logs.</td></tr>
          <tr v-for="row in rows" v-else :key="row.id">
            <td>{{ row.user?.name || row.user_id || "-" }}</td>
            <td>{{ row.action || "-" }}</td>
            <td>{{ row.entity_type || "-" }} #{{ row.entity_id || "-" }}</td>
            <td class="text-truncate" style="max-width: 180px">{{ row.request_id || "-" }}</td>
            <td>{{ row.ip || "-" }}</td>
            <td>{{ formatDate(row.created_at) }}</td>
            <td class="text-right"><VBtn icon="mdi-eye" size="small" variant="text" @click="router.push({ name: 'admin-audit-log-show', params: { id: row.id } })" /></td>
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
