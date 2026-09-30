<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { helperStore } from "@/helper";
import { listCryptoAddresses, type CryptoAddressListParams } from "@/services/cryptoAddressesApi";
import type { CryptoAddress } from "@/interfaces/Crypto/Crypto.model";
import { getCurrentPage, getItems, getLastPage, getMeta, getPerPage, getTotal, type PaginationMeta } from "@/utils/pagination";
import StatusChip from "@/views/admin/operability/components/StatusChip.vue";
import CopyComponent from "@/components/CopyComponent.vue";

const helper = helperStore();
const router = useRouter();
const rows = ref<CryptoAddress[]>([]);
const meta = ref<PaginationMeta>({});
const filters = ref<CryptoAddressListParams>({});
const loading = ref(false);
const currentPage = computed(() => getCurrentPage(meta.value));
const lastPage = computed(() => getLastPage(meta.value));
const total = computed(() => getTotal(meta.value));
const perPage = computed(() => getPerPage(meta.value));
const clean = (params: CryptoAddressListParams) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : "-";

const load = async (page = currentPage.value || 1) => {
  try {
    loading.value = true;
    const res = await listCryptoAddresses(clean({ ...filters.value, page, per_page: perPage.value || 15 }));
    rows.value = getItems<CryptoAddress>(res);
    meta.value = getMeta(res);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar direcciones crypto", { type: "error" });
  } finally {
    loading.value = false;
  }
};

onMounted(() => load(1));
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 font-weight-bold mb-0">Crypto Addresses</h1>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="load()">Refrescar</VBtn>
    </div>
    <VCard rounded="lg" class="mb-4">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="3"><VTextField v-model="filters.provider" label="Provider" clearable /></VCol>
          <VCol cols="12" sm="2"><VTextField v-model="filters.currency" label="Currency" clearable /></VCol>
          <VCol cols="12" sm="2"><VTextField v-model="filters.network" label="Network" clearable /></VCol>
          <VCol cols="12" sm="2"><VTextField v-model="filters.status" label="Status" clearable /></VCol>
          <VCol cols="12" sm="3"><VTextField v-model="filters.address" label="Address" clearable /></VCol>
          <VCol cols="12" sm="3"><VTextField v-model="filters.order_id" label="Order ID" clearable /></VCol>
          <VCol cols="12" sm="3"><VTextField v-model="filters.user_id" label="User ID" clearable /></VCol>
          <VCol cols="12" sm="3"><VTextField v-model="filters.date_from" type="date" label="From" clearable /></VCol>
          <VCol cols="12" sm="3"><VTextField v-model="filters.date_to" type="date" label="To" clearable /></VCol>
        </VRow>
        <div class="d-flex justify-end ga-2"><VBtn variant="text" @click="filters = {}; load(1)">Limpiar</VBtn><VBtn :loading="loading" @click="load(1)">Aplicar</VBtn></div>
      </VCardText>
    </VCard>
    <VCard rounded="lg">
      <VTable>
        <thead><tr><th>Provider</th><th>Currency</th><th>Network</th><th>Address</th><th>Status</th><th>Order</th><th>User</th><th>Assigned</th><th>Used</th><th class="text-right">Acciones</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="10" class="text-center py-8"><VProgressCircular indeterminate /></td></tr>
          <tr v-else-if="rows.length === 0"><td colspan="10" class="text-center py-8 text-medium-emphasis">Sin direcciones crypto.</td></tr>
          <tr v-for="row in rows" v-else :key="row.id">
            <td>{{ row.provider || "-" }}</td><td>{{ row.currency || "-" }}</td><td>{{ row.network || "-" }}</td>
            <td><div class="d-flex align-center ga-2"><span class="text-truncate" style="max-width: 240px">{{ row.address || "-" }}</span><CopyComponent v-if="row.address" :value="row.address" /></div></td>
            <td><StatusChip :value="row.status" /></td><td>{{ row.order_id ?? "-" }}</td><td>{{ row.user_id ?? "-" }}</td>
            <td>{{ formatDate(row.assigned_at) }}</td><td>{{ formatDate(row.used_at) }}</td>
            <td class="text-right"><VBtn icon="mdi-eye" size="small" variant="text" @click="router.push({ name: 'admin-crypto-address-show', params: { id: row.id } })" /></td>
          </tr>
        </tbody>
      </VTable>
      <VDivider />
      <div class="d-flex align-center justify-space-between pa-4"><span class="text-body-2 text-medium-emphasis">Total: {{ total }}</span><div class="d-flex align-center ga-2"><VBtn size="small" variant="text" :disabled="currentPage <= 1 || loading" @click="load(currentPage - 1)">Anterior</VBtn><span class="text-body-2">{{ currentPage }} / {{ lastPage }}</span><VBtn size="small" variant="text" :disabled="currentPage >= lastPage || loading" @click="load(currentPage + 1)">Siguiente</VBtn></div></div>
    </VCard>
  </div>
</template>
