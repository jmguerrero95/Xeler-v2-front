<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import {
  getLedgerFloatUsage,
  getLedgerReadiness,
  getLedgerSourceMode,
  getSecurityPreflight,
  type FloatUsageReport,
  type LedgerReadiness,
  type SecurityPreflight,
  type SourceModeStatus,
} from "@/services/operabilityApi";
import { getPayload } from "@/utils/pagination";
import JsonViewer from "./components/JsonViewer.vue";
import MetricCard from "./components/MetricCard.vue";
import StatusChip from "./components/StatusChip.vue";
import SeverityChip from "./components/SeverityChip.vue";

const helper = helperStore();
const userStore = UserStore();
const loading = ref(false);
const readiness = ref<LedgerReadiness | null>(null);
const preflight = ref<SecurityPreflight | null>(null);
const floatUsage = ref<FloatUsageReport | null>(null);
const sourceMode = ref<SourceModeStatus | null>(null);
const sectionErrors = ref<Record<string, string>>({});

const canReadiness = computed(() => userStore.hasPermission("ledger.readiness.view"));
const canPreflight = computed(() => userStore.hasPermission("security.preflight.view"));
const canFloatUsage = computed(() => userStore.hasPermission("ledger.float-usage.view"));
const canSourceMode = computed(() => userStore.hasPermission("ledger.source-mode.view"));
const canAccessAnySection = computed(() =>
  canReadiness.value || canPreflight.value || canFloatUsage.value || canSourceMode.value,
);

const generatedAt = computed(() =>
  readiness.value?.generated_at ?? preflight.value?.generated_at ?? sourceMode.value?.generated_at ?? "-",
);

const load = async () => {
  if (!canAccessAnySection.value) return;

  loading.value = true;
  sectionErrors.value = {};

  const loadSection = async (key: string, callback: () => Promise<void>) => {
    try {
      await callback();
    } catch (error: any) {
      sectionErrors.value[key] = error?.message ?? "No fue posible cargar esta seccion";
    }
  };

  const requests: Promise<void>[] = [];

  if (canReadiness.value) {
    requests.push(loadSection("readiness", async () => {
      const res = await getLedgerReadiness();
      readiness.value = getPayload<LedgerReadiness>(res);
    }));
  }
  if (canPreflight.value) {
    requests.push(loadSection("preflight", async () => {
      const res = await getSecurityPreflight();
      preflight.value = getPayload<SecurityPreflight>(res);
    }));
  }
  if (canFloatUsage.value) {
    requests.push(loadSection("floatUsage", async () => {
      const res = await getLedgerFloatUsage({ per_page: 5 });
      floatUsage.value = getPayload<FloatUsageReport>(res);
    }));
  }
  if (canSourceMode.value) {
    requests.push(loadSection("sourceMode", async () => {
      const res = await getLedgerSourceMode();
      sourceMode.value = getPayload<SourceModeStatus>(res);
    }));
  }

  await Promise.all(requests);

  if (Object.keys(sectionErrors.value).length > 0) {
    helper.showNotify("Algunas secciones no pudieron cargarse", "error");
  }

  loading.value = false;
};

onMounted(load);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <div>
        <h1 class="text-h5 font-weight-bold mb-1">Operability Readiness</h1>
        <div class="text-body-2 text-medium-emphasis">Generado: {{ generatedAt }}</div>
      </div>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="load">Refrescar</VBtn>
    </div>

    <VAlert v-if="!canAccessAnySection" type="error" variant="tonal" class="mb-4">
      No tienes permisos para ver modulos de operabilidad.
    </VAlert>

    <VRow v-if="canAccessAnySection" class="mb-2">
      <VCol v-if="canReadiness" cols="12" sm="6" md="3">
        <MetricCard title="Readiness" :value="readiness?.status" :loading="loading" />
      </VCol>
      <VCol v-if="canPreflight" cols="12" sm="6" md="3">
        <MetricCard title="Preintegration" :value="preflight?.preintegration_ready ? 'READY' : 'NOT_READY'" :loading="loading" />
      </VCol>
      <VCol v-if="canReadiness" cols="12" sm="6" md="3">
        <MetricCard title="Source mode" :value="readiness?.source_mode || '-'" :subtitle="readiness?.source_mode_enabled ? 'ledger enabled' : 'legacy fallback'" :loading="loading" />
      </VCol>
      <VCol v-if="canReadiness" cols="12" sm="6" md="3">
        <MetricCard title="Dataset" :value="readiness?.dataset_representative ? 'representative' : 'not ready'" :loading="loading" />
      </VCol>
    </VRow>

    <VRow v-if="canAccessAnySection">
      <VCol v-if="canReadiness" cols="12" lg="6">
        <VCard rounded="lg" class="h-100">
          <VCardTitle>Ledger</VCardTitle>
          <VCardText>
            <VAlert v-if="sectionErrors.readiness" type="error" variant="tonal" class="mb-4">
              {{ sectionErrors.readiness }}
            </VAlert>
            <VRow>
              <VCol cols="6"><MetricCard title="Source entities" :value="readiness?.source_entities_count" /></VCol>
              <VCol cols="6"><MetricCard title="High/Critical open" :value="readiness?.high_critical_open" /></VCol>
              <VCol cols="6"><MetricCard title="Openings missing" :value="readiness?.opening_missing" /></VCol>
              <VCol cols="6"><MetricCard title="Openings duplicated" :value="readiness?.opening_duplicates" /></VCol>
            </VRow>
            <div class="d-flex flex-wrap ga-2 mt-4">
              <StatusChip :value="`XCOP: ${readiness?.xcop_source_status || '-'}`" />
              <StatusChip :value="`Pending: ${readiness?.pending_limit_source_status || '-'}`" />
              <StatusChip :value="`Accumulated: ${readiness?.accumulated_limit_source_status || '-'}`" />
              <StatusChip :value="`Decimal: ${readiness?.decimal_engine || '-'}`" />
            </div>
            <VAlert v-if="readiness?.not_ready_reasons?.length" type="warning" variant="tonal" class="mt-4">
              {{ readiness.not_ready_reasons.join(", ") }}
            </VAlert>
          </VCardText>
        </VCard>
      </VCol>

      <VCol v-if="canPreflight || canFloatUsage" cols="12" lg="6">
        <VCard rounded="lg" class="h-100">
          <VCardTitle>Seguridad</VCardTitle>
          <VCardText>
            <VAlert v-if="sectionErrors.preflight" type="error" variant="tonal" class="mb-4">
              {{ sectionErrors.preflight }}
            </VAlert>
            <VAlert v-if="sectionErrors.floatUsage" type="error" variant="tonal" class="mb-4">
              {{ sectionErrors.floatUsage }}
            </VAlert>
            <VRow v-if="canPreflight">
              <VCol cols="6"><MetricCard title="Critical" :value="preflight?.critical_count" color="error" /></VCol>
              <VCol cols="6"><MetricCard title="High" :value="preflight?.high_count" color="deep-orange" /></VCol>
              <VCol cols="6"><MetricCard title="Medium" :value="preflight?.medium_count" color="warning" /></VCol>
              <VCol cols="6"><MetricCard title="Low" :value="preflight?.low_count" color="info" /></VCol>
            </VRow>
            <div class="d-flex flex-wrap ga-2 mt-4">
              <StatusChip v-if="canPreflight" :value="`Route critical: ${preflight?.route_audit?.critical ?? '-'}`" />
              <StatusChip v-if="canFloatUsage" :value="`Float critical: ${floatUsage?.summary?.critical ?? '-'}`" />
              <StatusChip v-if="canPreflight" :value="`Webhook replay: ${preflight?.webhook_replay_protection ?? false}`" />
              <StatusChip v-if="canPreflight" :value="`Secrets: ${preflight?.secret_scan?.findings ?? '-'}`" />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol v-if="canPreflight" cols="12" lg="6">
        <VCard rounded="lg">
          <VCardTitle>Checks preflight</VCardTitle>
          <VTable>
            <thead><tr><th>Check</th><th>Severidad</th><th>Estado</th></tr></thead>
            <tbody>
              <tr v-if="loading"><td colspan="3" class="text-center py-6"><VProgressCircular indeterminate /></td></tr>
              <tr v-else-if="!preflight?.checks?.length"><td colspan="3" class="text-center py-6 text-medium-emphasis">Sin checks disponibles.</td></tr>
              <tr v-for="check in preflight?.checks || []" :key="check.key">
                <td>{{ check.key }}</td>
                <td><SeverityChip :severity="check.severity" /></td>
                <td><StatusChip :value="check.status" /></td>
              </tr>
            </tbody>
          </VTable>
        </VCard>
      </VCol>

      <VCol v-if="canSourceMode" cols="12" lg="6">
        <VCard rounded="lg">
          <VCardTitle>Source mode</VCardTitle>
          <VCardText>
            <VAlert v-if="sectionErrors.sourceMode" type="error" variant="tonal" class="mb-4">
              {{ sectionErrors.sourceMode }}
            </VAlert>
            <div class="d-flex flex-wrap ga-2 mb-4">
              <StatusChip :value="`source: ${sourceMode?.ledger_use_as_source ?? false}`" />
              <StatusChip :value="`write legacy: ${sourceMode?.ledger_write_legacy ?? false}`" />
              <StatusChip :value="`auto heal: ${sourceMode?.ledger_auto_heal_legacy ?? false}`" />
              <StatusChip :value="`strict: ${sourceMode?.ledger_strict_mode ?? false}`" />
            </div>
            <JsonViewer :value="sourceMode || {}" collapsed max-height="300px" />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
