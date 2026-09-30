<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { helperStore } from "@/helper";
import { listCryptoTransactions, type CryptoTransactionListParams } from "@/services/cryptoTransactionsApi";
import type { CryptoTransaction } from "@/interfaces/Crypto/Crypto.model";
import { getCurrentPage, getItems, getLastPage, getMeta, getPerPage, getTotal, type PaginationMeta } from "@/utils/pagination";
import StatusChip from "@/views/admin/operability/components/StatusChip.vue";
import CopyComponent from "@/components/CopyComponent.vue";

const helper = helperStore();
const router = useRouter();
const rows = ref<CryptoTransaction[]>([]);
const meta = ref<PaginationMeta>({});
const filters = ref<CryptoTransactionListParams>({});
const loading = ref(false);
const currentPage = computed(() => getCurrentPage(meta.value));
const lastPage = computed(() => getLastPage(meta.value));
const total = computed(() => getTotal(meta.value));
const perPage = computed(() => getPerPage(meta.value));
const clean = (params: CryptoTransactionListParams) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : "-";

const load = async (page = currentPage.value || 1) => {
  try {
    loading.value = true;
    const res = await listCryptoTransactions(clean({ ...filters.value, page, per_page: perPage.value || 15 }));
    rows.value = getItems<CryptoTransaction>(res);
    meta.value = getMeta(res);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar transacciones crypto", { type: "error" });
  } finally {
    loading.value = false;
  }
};

onMounted(() => load(1));
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 font-weight-bold mb-0">Crypto Transactions</h1>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="load()">Refrescar</VBtn>
    </div>
    <VCard rounded="lg" class="mb-4">
      <VCardText>
        <VRow>
          <VCol cols="12" sm="2"><VTextField v-model="filters.provider" label="Provider" clearable /></VCol>
          <VCol cols="12" sm="2"><VTextField v-model="filters.currency" label="Currency" clearable /></VCol>
          <VCol cols="12" sm="2"><VTextField v-model="filters.network" label="Network" clearable /></VCol>
          <VCol cols="12" sm="2"><VTextField v-model="filters.status" label="Status" clearable /></VCol>
          <VCol cols="12" sm="2"><VSelect v-model="filters.direction" label="Direction" clearable :items="['incoming', 'outgoing']" /></VCol>
          <VCol cols="12" sm="2"><VTextField v-model="filters.txid" label="TxID" clearable /></VCol>
          <VCol cols="12" sm="3"><VTextField v-model="filters.address" label="Address" clearable /></VCol>
          <VCol cols="12" sm="3"><VTextField v-model="filters.order_id" label="Order ID" clearable /></VCol>
          <VCol cols="12" sm="3"><VTextField v-model="filters.user_id" label="User ID" clearable /></VCol>
          <VCol cols="12" sm="3"><VTextField v-model="filters.date_from" type="date" label="From" clearable /></VCol>
        </VRow>
        <div class="d-flex justify-end ga-2"><VBtn variant="text" @click="filters = {}; load(1)">Limpiar</VBtn><VBtn :loading="loading" @click="load(1)">Aplicar</VBtn></div>
      </VCardText>
    </VCard>
    <VCard rounded="lg">
      <VTable>
        <thead><tr><th>TxID</th><th>Amount</th><th>Conf.</th><th>Status</th><th>Provider</th><th>Network</th><th>Direction</th><th>Order</th><th>Detected</th><th class="text-right">Acciones</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="10" class="text-center py-8"><VProgressCircular indeterminate /></td></tr>
          <tr v-else-if="rows.length === 0"><td colspan="10" class="text-center py-8 text-medium-emphasis">Sin transacciones crypto.</td></tr>
          <tr v-for="(row, index) in rows" v-else :key="String(row.id ?? row.operation_key ?? row.txid ?? `row-${index}`)">
            <td><div class="d-flex align-center ga-2"><span class="text-truncate" style="max-width: 220px">{{ row.txid || "-" }}</span><CopyComponent v-if="row.txid" :value="row.txid" /></div></td>
            <td>{{ row.amount || "-" }} {{ row.currency || "" }}</td>
            <td>{{ row.confirmations ?? 0 }} / {{ row.required_confirmations ?? "-" }}</td>
            <td><StatusChip :value="row.status" /></td><td>{{ row.provider || "-" }}</td><td>{{ row.network || "-" }}</td>
            <td><StatusChip :value="row.direction" /></td><td>{{ row.order_id ?? "-" }}</td><td>{{ formatDate(row.detected_at ?? row.created_at) }}</td>
            <td class="text-right"><VBtn v-if="row.id" icon="mdi-eye" size="small" variant="text" @click="router.push({ name: 'admin-crypto-transaction-show', params: { id: row.id } })" /></td>
          </tr>
        </tbody>
      </VTable>
      <VDivider />
      <div class="d-flex align-center justify-space-between pa-4"><span class="text-body-2 text-medium-emphasis">Total: {{ total }}</span><div class="d-flex align-center ga-2"><VBtn size="small" variant="text" :disabled="currentPage <= 1 || loading" @click="load(currentPage - 1)">Anterior</VBtn><span class="text-body-2">{{ currentPage }} / {{ lastPage }}</span><VBtn size="small" variant="text" :disabled="currentPage >= lastPage || loading" @click="load(currentPage + 1)">Siguiente</VBtn></div></div>
    </VCard>
  </div>
</template>
