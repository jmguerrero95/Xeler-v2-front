<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { helperStore } from "@/helper";
import { getCryptoProvidersHealth, getCryptoStats } from "@/services/cryptoHealthApi";
import type { CryptoHealthItem, CryptoStats } from "@/interfaces/Crypto/Crypto.model";
import { getItems, getPayload } from "@/utils/pagination";
import StatusChip from "@/views/admin/operability/components/StatusChip.vue";

const helper = helperStore();
const loading = ref(false);
const dryRun = ref(true);
const healthRows = ref<CryptoHealthItem[]>([]);
const stats = ref<CryptoStats>({});
const statCards = computed(() => [
  { label: "Providers soportados", value: stats.value.supported_providers ?? stats.value.providers ?? "-" },
  { label: "Accounts configuradas", value: stats.value.configured_provider_accounts ?? "-" },
  { label: "Configs por moneda", value: stats.value.configured_currency_configs ?? "-" },
  { label: "Addresses", value: stats.value.addresses ?? "-" },
  { label: "Transactions", value: stats.value.transactions ?? "-" },
  { label: "Pending conf.", value: stats.value.pending_confirmations ?? "-" },
  { label: "Failed tx", value: stats.value.failed_transactions ?? "-" },
  { label: "Ignored tx", value: stats.value.ignored_transactions ?? "-" },
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const looksLikeHealthItem = (value: unknown): value is CryptoHealthItem => {
  if (!isRecord(value)) return false;
  return ["provider", "healthy", "state", "status"].some((key) => key in value);
};

const normalizeHealthRows = (response: unknown): CryptoHealthItem[] => {
  const items = getItems<CryptoHealthItem>(response);
  if (items.length) return items.filter(looksLikeHealthItem);

  const payload = getPayload<unknown>(response);
  const dataEnvelope = isRecord(payload) && "data" in payload ? payload.data : payload;

  if (Array.isArray(dataEnvelope)) {
    return dataEnvelope.filter(looksLikeHealthItem);
  }

  if (looksLikeHealthItem(dataEnvelope)) {
    return [dataEnvelope];
  }

  if (isRecord(dataEnvelope)) {
    return Object.values(dataEnvelope).filter(looksLikeHealthItem);
  }

  return [];
};

const load = async () => {
  try {
    loading.value = true;
    const [healthRes, statsRes] = await Promise.all([getCryptoProvidersHealth(dryRun.value), getCryptoStats()]);
    healthRows.value = normalizeHealthRows(healthRes);
    stats.value = getPayload<CryptoStats>(statsRes) ?? {};
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar health crypto", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const runConfigurationReview = async () => {
  dryRun.value = true;
  await load();
};

const runRealConnections = async () => {
  dryRun.value = false;
  await load();
};

onMounted(load);

const walletStatusForRow = (row: CryptoHealthItem) => {
  if (row.provider !== "bitgo") return "N/A";
  return row.wallet_verified ?? (row.has_wallet_id ? "configured" : "missing");
};

const expressStatusForRow = (row: CryptoHealthItem) => {
  if (row.provider !== "bitgo") return "N/A";
  return row.express_status ?? row.express_healthy ?? row.express_reachable ?? "-";
};
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 font-weight-bold mb-0">Crypto Health</h1>
      <div class="health-actions">
        <VBtn variant="text" :loading="loading && dryRun" @click="runConfigurationReview">Revisar configuracion</VBtn>
        <VBtn color="primary" :loading="loading && !dryRun" @click="runRealConnections">Probar conexiones</VBtn>
      </div>
    </div>
    <VAlert
      type="info"
      variant="tonal"
      class="mb-4"
      text="Esta prueba realiza llamadas reales de lectura a los proveedores configurados solo cuando usas Probar conexiones."
    />
    <VRow class="mb-4">
      <VCol v-for="card in statCards" :key="card.label" cols="6" md="3">
        <VCard rounded="lg" class="pa-4 h-100">
          <div class="text-caption text-medium-emphasis">{{ card.label }}</div>
          <div class="text-h6 font-weight-bold">{{ card.value }}</div>
        </VCard>
      </VCol>
    </VRow>
    <VCard rounded="lg">
      <VTable>
        <thead><tr><th>Provider</th><th>Currency</th><th>Network</th><th>Enabled</th><th>Environment</th><th>Wallet</th><th>REST</th><th>Express</th><th>Detection</th><th>Healthy</th><th>Status</th><th>Message</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="12" class="text-center py-8"><VProgressCircular indeterminate /></td></tr>
          <tr v-else-if="healthRows.length === 0"><td colspan="12" class="text-center py-8 text-medium-emphasis">Sin datos de health crypto.</td></tr>
          <tr v-for="(row, index) in healthRows" v-else :key="`${row.provider}-${row.currency}-${row.network}-${index}`">
            <td>{{ row.provider || "-" }}</td><td>{{ row.currency || "-" }}</td><td>{{ row.network || "-" }}</td>
            <td><StatusChip :value="row.enabled" /></td><td><StatusChip :value="row.environment ?? (row.sandbox ? 'sandbox' : 'live')" /></td>
            <td><StatusChip :value="walletStatusForRow(row)" /></td>
            <td><StatusChip :value="row.rest_healthy ?? row.wallet_verified" /></td>
            <td><StatusChip :value="expressStatusForRow(row)" /></td>
            <td>{{ row.deposit_detection_mode === "webhook_only" ? "IPN/webhook / polling no disponible" : "-" }}</td>
            <td><StatusChip :value="row.healthy" /></td>
            <td><StatusChip :value="row.status" /></td><td class="text-truncate" style="max-width: 280px">{{ row.message || "-" }}</td>
          </tr>
        </tbody>
      </VTable>
    </VCard>
  </div>
</template>

<style scoped>
.health-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 599px) {
  .health-actions {
    width: 100%;
  }

  .health-actions :deep(.v-btn) {
    flex: 1 1 100%;
  }
}
</style>
