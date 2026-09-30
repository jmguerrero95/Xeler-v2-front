<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { helperStore } from "@/helper";
import { listWebhookEvents, reprocessWebhookEvent, type WebhookEvent, type WebhookEventListParams } from "@/services/webhooksApi";
import { getCurrentPage, getItems, getLastPage, getMeta, getPerPage, getTotal, type PaginationMeta } from "@/utils/pagination";
import StatusChip from "@/views/admin/operability/components/StatusChip.vue";

const router = useRouter();
const helper = helperStore();
const rows = ref<WebhookEvent[]>([]);
const meta = ref<PaginationMeta>({});
const filters = ref<WebhookEventListParams>({});
const loading = ref(false);
const currentPage = computed(() => getCurrentPage(meta.value));
const lastPage = computed(() => getLastPage(meta.value));
const total = computed(() => getTotal(meta.value));
const perPage = computed(() => getPerPage(meta.value));
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : "-";
const clean = (params: WebhookEventListParams) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));

const load = async (page = currentPage.value || 1) => {
  try {
    loading.value = true;
    const res = await listWebhookEvents(clean({ ...filters.value, page, per_page: perPage.value || 15 }));
    rows.value = getItems<WebhookEvent>(res);
    meta.value = getMeta(res);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar webhook events", "error");
  } finally {
    loading.value = false;
  }
};
onMounted(() => load(1));

const retryEvent = async (row: WebhookEvent) => {
  try {
    await authorizeWithTwoFactor(reprocessWebhookEvent.bind(undefined, row.id), "finance.financial_configuration");
    helper.showNotify("Webhook reprocesado");
    await load(currentPage.value || 1);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible reprocesar el webhook", "error");
  }
};
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 font-weight-bold mb-0">Webhook Events</h1>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="load()">Refrescar</VBtn>
    </div>
    <VCard rounded="lg" class="mb-4"><VCardText>
      <VRow>
        <VCol cols="12" sm="3"><VTextField v-model="filters.provider" label="Provider" clearable /></VCol>
        <VCol cols="12" sm="3"><VTextField v-model="filters.event_type" label="Event type" clearable /></VCol>
        <VCol cols="12" sm="3"><VTextField v-model="filters.status" label="Status" clearable /></VCol>
        <VCol cols="12" sm="3"><VSelect v-model="filters.signature_valid" label="Signature" clearable :items="[{title:'Valid',value:'true'},{title:'Invalid',value:'false'}]" /></VCol>
      </VRow>
      <div class="d-flex justify-end ga-2"><VBtn variant="text" @click="filters = {}; load(1)">Limpiar</VBtn><VBtn :loading="loading" @click="load(1)">Aplicar</VBtn></div>
    </VCardText></VCard>
    <VCard rounded="lg">
      <VTable>
        <thead><tr><th>Provider</th><th>Event</th><th>Status</th><th>Signature</th><th>Replay</th><th>Attempts</th><th>Payload hash</th><th>Processed</th><th>Created</th><th class="text-right">Acciones</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="10" class="text-center py-8"><VProgressCircular indeterminate /></td></tr>
          <tr v-else-if="rows.length === 0"><td colspan="10" class="text-center py-8 text-medium-emphasis">Sin eventos.</td></tr>
          <tr v-for="row in rows" v-else :key="row.id">
            <td>{{ row.provider || "-" }}</td><td>{{ row.event_type || row.event_id || "-" }}</td><td><StatusChip :value="row.status" /></td>
            <td><StatusChip :value="row.signature_valid" /></td><td>{{ row.replay_count ?? 0 }}</td>
            <td>{{ row.attempts ?? 0 }} / {{ row.max_attempts ?? 0 }}</td>
            <td class="text-truncate" style="max-width:180px">{{ row.payload_hash || "-" }}</td><td>{{ formatDate(row.processed_at) }}</td><td>{{ formatDate(row.created_at) }}</td>
            <td class="text-right">
              <VBtn v-if="row.provider === 'cryptocurrencyapi' && row.status === 'failed'" icon="mdi-reload" size="small" variant="text" @click="retryEvent(row)" />
              <VBtn icon="mdi-eye" size="small" variant="text" @click="router.push({ name: 'admin-webhook-event-show', params: { id: row.id } })" />
            </td>
          </tr>
        </tbody>
      </VTable>
      <VDivider />
      <div class="d-flex align-center justify-space-between pa-4"><span class="text-body-2 text-medium-emphasis">Total: {{ total }}</span><div class="d-flex align-center ga-2"><VBtn size="small" variant="text" :disabled="currentPage <= 1 || loading" @click="load(currentPage - 1)">Anterior</VBtn><span class="text-body-2">{{ currentPage }} / {{ lastPage }}</span><VBtn size="small" variant="text" :disabled="currentPage >= lastPage || loading" @click="load(currentPage + 1)">Siguiente</VBtn></div></div>
    </VCard>
  </div>
</template>
