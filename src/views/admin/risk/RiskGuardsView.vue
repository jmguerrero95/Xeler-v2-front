<script setup lang="ts">
import { onMounted, ref } from "vue";
import { helperStore } from "@/helper";
import { getRiskGuards, type RiskGuardStatus } from "@/services/riskApi";
import { getPayload } from "@/utils/pagination";
import JsonViewer from "@/views/admin/operability/components/JsonViewer.vue";
import MetricCard from "@/views/admin/operability/components/MetricCard.vue";
import StatusChip from "@/views/admin/operability/components/StatusChip.vue";

const helper = helperStore();
const loading = ref(false);
const status = ref<RiskGuardStatus | null>(null);

const load = async () => {
  try {
    loading.value = true;
    const res = await getRiskGuards();
    status.value = getPayload<RiskGuardStatus>(res);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar risk guards", "error");
  } finally {
    loading.value = false;
  }
};
onMounted(load);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 font-weight-bold mb-0">Risk Guards</h1>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="load">Refrescar</VBtn>
    </div>
    <VRow>
      <VCol cols="12" sm="6" md="3"><MetricCard title="Enabled" :value="status?.enabled ? 'enabled' : 'disabled'" :loading="loading" /></VCol>
      <VCol cols="12" sm="6" md="3"><MetricCard title="Open high/critical" :value="status?.open_high_critical_reconciliations" :loading="loading" /></VCol>
      <VCol cols="12" sm="6" md="3"><MetricCard title="Blocked conditions" :value="status?.blocked_conditions?.length ?? 0" :loading="loading" /></VCol>
      <VCol cols="12" sm="6" md="3"><MetricCard title="Generated" :value="status?.generated_at || '-'" :loading="loading" /></VCol>
      <VCol cols="12">
        <VCard rounded="lg"><VCardTitle>Estado</VCardTitle><VCardText>
          <div class="d-flex flex-wrap ga-2 mb-4">
            <StatusChip v-for="condition in status?.blocked_conditions || []" :key="condition" :value="condition" />
            <span v-if="!status?.blocked_conditions?.length" class="text-body-2 text-medium-emphasis">Sin bloqueos reportados.</span>
          </div>
          <JsonViewer :value="status || {}" />
        </VCardText></VCard>
      </VCol>
    </VRow>
  </div>
</template>

