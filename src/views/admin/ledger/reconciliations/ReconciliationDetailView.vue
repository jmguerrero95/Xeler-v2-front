<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import {
  getReconciliation,
  ignoreReconciliation,
  reopenReconciliation,
  resolveReconciliation,
  type LedgerReconciliation,
} from "@/services/reconciliationsApi";
import { getPayload } from "@/utils/pagination";
import ReconciliationActionDialog from "./components/ReconciliationActionDialog.vue";
import ReconciliationSeverityBadge from "./components/ReconciliationSeverityBadge.vue";
import ReconciliationStatusBadge from "./components/ReconciliationStatusBadge.vue";

type ReconciliationAction = "resolve" | "ignore" | "reopen";

const props = defineProps<{
  id: string | number;
}>();

const router = useRouter();
const helper = helperStore();
const userStore = UserStore();

const reconciliation = ref<LedgerReconciliation | null>(null);
const loading = ref(false);
const actionLoading = ref(false);
const actionDialog = ref(false);
const selectedAction = ref<ReconciliationAction | null>(null);

const metadataJson = computed(() => JSON.stringify(reconciliation.value?.metadata ?? {}, null, 2));
const isBridge = computed(
  () => reconciliation.value?.metadata?.comparison_source === "bridge",
);

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const isClosed = computed(() =>
  ["resolved", "ignored"].includes(reconciliation.value?.status ?? "") ||
  Boolean(reconciliation.value?.resolved_at),
);

const canResolve = computed(() =>
  userStore.hasPermission("ledger.reconciliation.resolve") && !isClosed.value,
);
const canIgnore = computed(() =>
  userStore.hasPermission("ledger.reconciliation.ignore") && !isClosed.value,
);
const canReopen = computed(() =>
  userStore.hasPermission("ledger.reconciliation.reopen") && isClosed.value,
);
const actionPermission = computed(() => {
  if (!selectedAction.value) return undefined;
  return `ledger.reconciliation.${selectedAction.value}`;
});

const loadReconciliation = async () => {
  try {
    loading.value = true;
    const response = await getReconciliation(props.id);
    reconciliation.value = getPayload<LedgerReconciliation>(response);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar la reconciliación", "error");
  } finally {
    loading.value = false;
  }
};

const openAction = (action: ReconciliationAction) => {
  selectedAction.value = action;
  actionDialog.value = true;
};

const runAction = async (notes: string) => {
  if (!reconciliation.value || !selectedAction.value) return;

  if ((selectedAction.value === "resolve" || selectedAction.value === "ignore") && !notes) {
    helper.showNotify("La nota es obligatoria para esta acción", "error");
    return;
  }

  try {
    actionLoading.value = true;
    if (selectedAction.value === "resolve") await authorizeWithTwoFactor(resolveReconciliation.bind(undefined, reconciliation.value.id, notes), "finance.financial_configuration");
    if (selectedAction.value === "ignore") await authorizeWithTwoFactor(ignoreReconciliation.bind(undefined, reconciliation.value.id, notes), "finance.financial_configuration");
    if (selectedAction.value === "reopen") await authorizeWithTwoFactor(reopenReconciliation.bind(undefined, reconciliation.value.id, notes || undefined), "finance.financial_configuration");
    helper.showNotify("Acción ejecutada correctamente", "success");
    actionDialog.value = false;
    selectedAction.value = null;
    await loadReconciliation();
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible ejecutar la acción", "error");
  } finally {
    actionLoading.value = false;
  }
};

onMounted(loadReconciliation);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <div>
        <VBtn variant="text" prepend-icon="mdi-arrow-left" class="mb-2" @click="router.back()">Volver</VBtn>
        <h1 class="text-h5 font-weight-bold mb-0">Detalle Reconciliación</h1>
      </div>
      <div v-if="reconciliation" class="d-flex ga-2">
        <VBtn v-if="canResolve" color="success" :loading="actionLoading" @click="openAction('resolve')">Resolver</VBtn>
        <VBtn v-if="canIgnore" color="grey" :loading="actionLoading" @click="openAction('ignore')">Ignorar</VBtn>
        <VBtn v-if="canReopen" color="warning" :loading="actionLoading" @click="openAction('reopen')">Reabrir</VBtn>
      </div>
    </div>

    <VCard v-if="loading" class="pa-8 text-center" rounded="lg">
      <VProgressCircular indeterminate />
    </VCard>

    <VAlert v-else-if="!reconciliation" type="warning" variant="tonal">
      No se encontró la reconciliación.
    </VAlert>

    <VRow v-else>
      <VCol cols="12" md="6">
        <VCard class="pa-4" rounded="lg">
          <h2 class="text-subtitle-1 font-weight-bold mb-4">Información</h2>
          <VList density="compact">
            <VListItem title="ID" :subtitle="String(reconciliation.id)" />
            <VListItem title="UUID" :subtitle="reconciliation.uuid || '-'" />
            <VListItem title="Estado">
              <template #subtitle><ReconciliationStatusBadge :status="reconciliation.status" /></template>
            </VListItem>
            <VListItem title="Severidad">
              <template #subtitle><ReconciliationSeverityBadge :severity="reconciliation.severity" /></template>
            </VListItem>
            <VListItem title="Entidad" :subtitle="`${reconciliation.entity_type || '-'} #${reconciliation.entity_id || '-'}`" />
            <VListItem title="Tipo de balance" :subtitle="reconciliation.balance_type || '-'" />
            <VListItem title="Detectado por" :subtitle="reconciliation.detected_by || '-'" />
            <VListItem title="Clave de operaci&oacute;n" :subtitle="reconciliation.operation_key || '-'" />
          </VList>
        </VCard>
      </VCol>
      <VCol cols="12" md="6">
        <VCard class="pa-4" rounded="lg">
          <h2 class="text-subtitle-1 font-weight-bold mb-4">Balances</h2>
          <VList density="compact">
            <VListItem :title="isBridge ? 'Saldo Bridge' : 'Saldo legacy'" :subtitle="reconciliation.legacy_balance || '-'" />
            <VListItem title="Saldo ledger" :subtitle="reconciliation.ledger_balance || '-'" />
            <VListItem title="Diferencia" :subtitle="reconciliation.difference || '-'" />
            <VListItem title="Moneda" :subtitle="reconciliation.currency || '-'" />
            <VListItem title="Conciliado el" :subtitle="formatDate(reconciliation.reconciled_at)" />
            <VListItem title="Resuelto el" :subtitle="formatDate(reconciliation.resolved_at)" />
          </VList>
        </VCard>
      </VCol>
      <VCol cols="12">
        <VCard class="pa-4" rounded="lg">
          <h2 class="text-subtitle-1 font-weight-bold mb-3">Resolución</h2>
          <VList density="compact">
            <VListItem title="Resuelto por" :subtitle="String(reconciliation.resolved_by ?? '-')" />
            <VListItem title="Notas de resoluci&oacute;n" :subtitle="reconciliation.resolution_notes || '-'" />
            <VListItem title="Creado el" :subtitle="formatDate(reconciliation.created_at)" />
            <VListItem title="Actualizado el" :subtitle="formatDate(reconciliation.updated_at)" />
          </VList>
        </VCard>
      </VCol>
      <VCol cols="12">
        <VCard class="pa-4" rounded="lg">
          <h2 class="text-subtitle-1 font-weight-bold mb-3">Metadata</h2>
          <pre class="json-viewer">{{ metadataJson }}</pre>
        </VCard>
      </VCol>
    </VRow>

    <ReconciliationActionDialog
      v-model="actionDialog"
      :action="selectedAction"
      :loading="actionLoading"
      :permission="actionPermission"
      @confirm="runAction"
    />
  </div>
</template>

<style scoped>
.json-viewer {
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  max-height: 420px;
  overflow: auto;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
