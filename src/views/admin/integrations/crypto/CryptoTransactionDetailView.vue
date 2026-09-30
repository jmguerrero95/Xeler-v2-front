<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";
const { authorizeWithTwoFactor } = useTwoFactorGuard();
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { helperStore } from "@/helper";
import CopyComponent from "@/components/CopyComponent.vue";
import type { CryptoTransaction } from "@/interfaces/Crypto/Crypto.model";
import { getCryptoTransaction, resolveCryptoPayoutReconciliation, resolveCryptoTransaction } from "@/services/cryptoTransactionsApi";
import { validatePayoutReconciliation, type PayoutReconciliationAction } from "@/services/cryptoPayoutReconciliation";
import { UserStore } from "@/stores/UserStore";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";
import { getPayload } from "@/utils/pagination";
import JsonViewer from "@/views/admin/operability/components/JsonViewer.vue";
import StatusChip from "@/views/admin/operability/components/StatusChip.vue";

const props = defineProps<{ id: string | number }>();
const router = useRouter();
const helper = helperStore();
const userStore = UserStore();
const twoFactor = TwoFactorAuthStore();
const loading = ref(false);
const transaction = ref<CryptoTransaction | null>(null);
const resolving = ref(false);
const reconciliationDialog = ref(false);
const reconciliationAction = ref<PayoutReconciliationAction>("transmitted");
const reconciliationTxid = ref("");
const reconciliationProviderReference = ref("");
const reconciliationReason = ref("");
const reconciliationEvidence = ref("");
const reconciliationConfirmed = ref(false);
const canResolveNormally = computed(() => transaction.value?.can_resolve_crypto_transaction === true
  && userStore.hasPermission("crypto.transaction.resolve"));
const canResolveReconciliation = computed(() => transaction.value?.can_resolve_crypto_reconciliation === true
  && userStore.hasPermission("orders.updated")
  && userStore.hasPermission("crypto.payout.process"));
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : "-";

const load = async () => {
  try {
    loading.value = true;
    const res = await getCryptoTransaction(props.id);
    transaction.value = getPayload<CryptoTransaction>(res);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar la transaccion crypto", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const resolveTx = async (action: "accept_confirmed" | "reject" | "manual_review") => {
  if (!transaction.value?.id || !canResolveNormally.value) return;
  try {
    resolving.value = true;
    await authorizeWithTwoFactor(resolveCryptoTransaction.bind(undefined, transaction.value.id, { action }), "finance.crypto_payout");
    helper.showNotify("Resolucion manual registrada");
    await load();
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible resolver la transaccion", { type: "error" });
  } finally {
    resolving.value = false;
  }
};

const requestReconciliation = () => {
  const error = validatePayoutReconciliation({
    action: reconciliationAction.value,
    txid: reconciliationTxid.value,
    reason: reconciliationReason.value,
    confirmation: reconciliationConfirmed.value,
  });
  if (error) {
    helper.showNotify(error, { type: "error" });
    return;
  }
  twoFactor.modal = true;
  twoFactor.newFlow = true;
  twoFactor.requestedScope = "finance.crypto_payout";
  twoFactor.callback = { fn: executeReconciliation };
};

const executeReconciliation = async () => {
  if (!transaction.value?.id || !canResolveReconciliation.value) return;
  try {
    resolving.value = true;
    await resolveCryptoPayoutReconciliation(transaction.value.id, {
      action: reconciliationAction.value,
      txid: reconciliationAction.value === "transmitted" ? reconciliationTxid.value : undefined,
      provider_reference: reconciliationProviderReference.value || undefined,
      reason: reconciliationReason.value,
      evidence: reconciliationEvidence.value || undefined,
      confirmation: reconciliationAction.value === "not_transmitted" ? reconciliationConfirmed.value : undefined,
      two_factor_code: localStorage.getItem("2fa") ? twoFactor.code : undefined,
    });
    reconciliationDialog.value = false;
    helper.showNotify("Conciliacion de payout registrada");
    await load();
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible resolver la conciliacion", { type: "error" });
  } finally {
    resolving.value = false;
  }
};

onMounted(load);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 font-weight-bold mb-0">Crypto Transaction</h1>
      <VBtn variant="text" prepend-icon="mdi-arrow-left" @click="router.back()">Volver</VBtn>
    </div>

    <VCard rounded="lg" class="pa-4">
      <div v-if="loading" class="text-center py-8"><VProgressCircular indeterminate /></div>
      <VRow v-else-if="transaction">
        <VCol cols="12" md="6">
          <VList density="compact">
            <VListItem title="Provider" :subtitle="transaction.provider || '-'" />
            <VListItem title="Currency" :subtitle="transaction.currency || '-'" />
            <VListItem title="Network" :subtitle="transaction.network || '-'" />
            <VListItem title="Direction"><template #subtitle><StatusChip :value="transaction.direction" /></template></VListItem>
            <VListItem title="Status"><template #subtitle><StatusChip :value="transaction.status_label || transaction.status" /></template></VListItem>
            <VListItem title="Amount" :subtitle="transaction.amount || '-'" />
            <VListItem title="Confirmations" :subtitle="`${transaction.confirmations ?? 0} / ${transaction.required_confirmations ?? '-'}`" />
            <VListItem title="Order" :subtitle="String(transaction.order_id ?? '-')" />
            <VListItem title="User" :subtitle="String(transaction.user_id ?? '-')" />
            <VListItem title="Webhook event" :subtitle="String(transaction.webhook_event_id ?? '-')" />
            <VListItem title="Detected at" :subtitle="formatDate(transaction.detected_at)" />
            <VListItem title="Confirmed at" :subtitle="formatDate(transaction.confirmed_at)" />
            <VListItem title="Failed at" :subtitle="formatDate(transaction.failed_at)" />
          </VList>
        </VCol>
        <VCol cols="12" md="6">
          <div class="text-subtitle-2 text-primary mb-2">TxID</div>
          <div class="d-flex align-center ga-2 bg-grey-lighten-4 pa-3 rounded mb-4">
            <span class="text-break">{{ transaction.txid || "-" }}</span>
            <CopyComponent v-if="transaction.txid" :value="transaction.txid" />
          </div>
          <div class="text-subtitle-2 text-primary mb-2">Address</div>
          <div class="d-flex align-center ga-2 bg-grey-lighten-4 pa-3 rounded mb-4">
            <span class="text-break">{{ transaction.address || "-" }}</span>
            <CopyComponent v-if="transaction.address" :value="transaction.address" />
          </div>
          <div class="text-subtitle-2 text-primary mb-2">Metadata</div>
          <JsonViewer :value="transaction.metadata || {}" collapsed max-height="320px" />
          <div v-if="canResolveNormally" class="d-flex flex-wrap ga-2 mt-4">
            <VBtn color="success" :loading="resolving" @click="resolveTx('accept_confirmed')">Aceptar confirmado</VBtn>
            <VBtn color="warning" variant="tonal" :loading="resolving" @click="resolveTx('manual_review')">Revision manual</VBtn>
            <VBtn color="error" variant="tonal" :loading="resolving" @click="resolveTx('reject')">Rechazar</VBtn>
          </div>
          <VBtn v-if="canResolveReconciliation" color="warning" class="mt-4" @click="reconciliationDialog = true">
            Resolver conciliacion de payout
          </VBtn>
        </VCol>
      </VRow>
      <div v-else class="text-center py-8 text-medium-emphasis">Transaccion no encontrada.</div>
    </VCard>

    <VDialog v-model="reconciliationDialog" max-width="620">
      <VCard title="Resolver conciliacion de payout">
        <VCardText>
          <VRadioGroup v-model="reconciliationAction" inline>
            <VRadio label="El proveedor transmitio" value="transmitted" />
            <VRadio label="El proveedor no transmitio" value="not_transmitted" />
          </VRadioGroup>
          <VTextField v-if="reconciliationAction === 'transmitted'" v-model="reconciliationTxid" label="TXID confirmado" />
          <VTextField v-if="reconciliationAction === 'transmitted'" v-model="reconciliationProviderReference" label="Referencia del proveedor (opcional)" />
          <VTextarea v-model="reconciliationReason" label="Motivo de la resolucion" rows="3" />
          <VTextarea v-model="reconciliationEvidence" label="Evidencia (opcional)" rows="2" />
          <VCheckbox
            v-if="reconciliationAction === 'not_transmitted'"
            v-model="reconciliationConfirmed"
            label="Confirmo que verifique en el proveedor que el envio no fue transmitido"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="reconciliationDialog = false">Cancelar</VBtn>
          <VBtn color="warning" :loading="resolving" @click="requestReconciliation">Registrar resolucion</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
