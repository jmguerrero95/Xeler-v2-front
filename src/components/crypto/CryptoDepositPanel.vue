<script setup lang="ts">
import { computed, ref } from "vue";
import { downloadAuthenticatedBlob } from "@/services/apiClient";
import QrcodeVue from "qrcode.vue";
import CopyComponent from "@/components/CopyComponent.vue";
import type { Order } from "@/interfaces/Order/Order.model";
import type { CryptoInfo } from "@/interfaces/Crypto/Crypto.model";
import {
  buildCryptoQrValue,
  cryptoStatusColor,
  cryptoStatusLabel,
  getCryptoRequiredConfirmations,
  normalizeCryptoStatus,
} from "@/utils/crypto";

const props = defineProps<{
  order: Order;
  fallbackAddress?: string | null;
}>();

const showQr = ref(true);
const proofDownloading = ref(false);
const proofDownloadError = ref("");

const downloadSalePaymentProof = async (): Promise<void> => {
  const url = props.order.attributes.sale_payment_proof_download_url;
  if (!url || proofDownloading.value) return;

  proofDownloading.value = true;
  proofDownloadError.value = "";
  try {
    await downloadAuthenticatedBlob(url, `comprobante-venta-${props.order.id}`);
  } catch {
    proofDownloadError.value = "No fue posible descargar el comprobante.";
  } finally {
    proofDownloading.value = false;
  }
};

const crypto = computed<CryptoInfo | null>(() => props.order.attributes.crypto ?? null);
const address = computed(() => crypto.value?.address ?? props.fallbackAddress ?? props.order.attributes.address_send ?? "");
const currency = computed(
  () =>
    crypto.value?.currency ??
    props.order.relationships?.currency?.attributes?.abbreviation?.toUpperCase() ??
    props.order.relationships?.currency?.attributes?.name ??
    "-",
);
const network = computed(() => crypto.value?.network ?? props.order.relationships?.red?.attributes?.name ?? "-");
const status = computed(() => crypto.value?.status ?? crypto.value?.address_status ?? "assigned");
const addressPending = computed(() => Boolean(props.order.attributes.address_assignment_pending) && !address.value);
const confirmations = computed(() => Number(crypto.value?.confirmations ?? crypto.value?.transactions?.[0]?.confirmations ?? 0));
const requiredConfirmations = computed(() => getCryptoRequiredConfirmations(crypto.value));
const txid = computed(() => crypto.value?.txid ?? crypto.value?.transactions?.[0]?.txid ?? props.order.attributes.crypto_txid ?? "");
const detectedAmount = computed(() => props.order.attributes.detected_crypto_amount ?? crypto.value?.detected_amount ?? "0");
const confirmedAmount = computed(() => props.order.attributes.confirmed_crypto_amount ?? crypto.value?.confirmed_amount ?? "0");
const expectedAmount = computed(() => props.order.attributes.expected_deposit_amount ?? crypto.value?.amount ?? props.order.attributes.amount_currency);
const manualReviewReason = computed(() => props.order.attributes.manual_review_reason ?? props.order.attributes.manual_review_code ?? "");
const manualReviewHint = computed(() => props.order.attributes.manual_review_action_hint ?? "");
const qrValue = computed(() => props.order.attributes.deposit_qr_payload ?? (
  crypto.value
    ? buildCryptoQrValue({ ...crypto.value, address: address.value }, expectedAmount.value)
    : address.value),
);
const networkWarning = computed(() => ["USDT", "USDC"].includes(String(currency.value).toUpperCase())
  ? `Envia unicamente ${currency.value} por TRON/TRC20. No envies ${currency.value} por ERC20.`
  : `Envia unicamente ${currency.value} por la red ${network.value}.`);
const confirmationPercent = computed(() => {
  if (!requiredConfirmations.value) return 0;
  return Math.min(100, Math.round((confirmations.value / requiredConfirmations.value) * 100));
});
</script>

<template>
  <VCard class="pa-4 rounded-lg elevation-1">
    <VRow align="center" justify="center">
      <VCol cols="12" md="5" class="text-center">
        <VExpandTransition>
          <div v-show="showQr">
            <QrcodeVue
              v-if="qrValue"
              :value="qrValue"
              :size="$vuetify.display.smAndDown ? 184 : 208"
              render-as="svg"
              :foreground="$vuetify.display.smAndDown ? '#5043E8' : '#000'"
            />
            <div v-else class="py-8 text-medium-emphasis">
              {{ addressPending ? "Preparando direccion de deposito..." : "Direccion pendiente" }}
            </div>
          </div>
        </VExpandTransition>
        <VBtn
          class="mt-3 d-md-none"
          color="primary"
          variant="outlined"
          block
          prepend-icon="mdi-qrcode"
          @click="showQr = !showQr"
        >
          {{ showQr ? "Ocultar" : "Mostrar" }} QR
        </VBtn>
      </VCol>

      <VCol cols="12" md="7">
        <div class="d-flex flex-wrap align-center ga-2 mb-4">
          <VChip :color="cryptoStatusColor(status)" variant="tonal" size="small">
            {{ cryptoStatusLabel(status) }}
          </VChip>
          <VChip variant="tonal" size="small">{{ currency }}</VChip>
          <VChip variant="tonal" size="small">{{ network }}</VChip>
        </div>

        <div class="text-primary text-subtitle-1 font-weight-bold mb-2">
          Cantidad a enviar
        </div>
        <div class="d-flex justify-space-between align-center bg-grey-lighten-4 pa-3 rounded mb-4">
          <span class="text-break">{{ expectedAmount }}</span>
          <CopyComponent :value="expectedAmount" />
        </div>

        <div class="text-primary text-subtitle-1 font-weight-bold mb-2">
          Direccion destino
        </div>
        <div class="d-flex justify-space-between align-center bg-grey-lighten-4 pa-3 rounded mb-4">
          <span class="text-break" style="max-width: 100%">
            {{ addressPending ? "Preparando direccion de deposito..." : address || "-" }}
          </span>
          <CopyComponent v-if="address" :value="address" />
        </div>

        <VProgressLinear
          v-if="requiredConfirmations"
          class="mb-2"
          :model-value="confirmationPercent"
          color="primary"
          height="8"
          rounded
        />
        <div class="d-flex flex-wrap justify-space-between ga-2 text-body-2 text-medium-emphasis mb-2">
          <span>Confirmaciones: {{ confirmations }} / {{ requiredConfirmations || "-" }}</span>
          <span v-if="detectedAmount">Detectado: {{ detectedAmount }}</span>
          <span>Confirmado: {{ confirmedAmount }}</span>
        </div>

        <div v-if="txid" class="d-flex align-center ga-2 text-body-2">
          <span class="font-weight-bold">TxID</span>
          <span class="text-truncate" style="max-width: 280px">{{ txid }}</span>
          <CopyComponent :value="txid" />
        </div>
      </VCol>
    </VRow>

    <VAlert type="warning" variant="tonal" class="mt-5" icon="mdi-alert-circle-outline">
      {{ networkWarning }} Depositos en otra red pueden requerir revision manual.
    </VAlert>

    <VAlert v-if="order.attributes.variance_message" :type="order.attributes.manual_review ? 'info' : 'warning'" variant="tonal" class="mt-3">
      {{ order.attributes.variance_message }}
    </VAlert>

    <VCard v-if="order.attributes.fiat_payout_status" variant="tonal" class="mt-3 pa-4">
      <div class="font-weight-bold">Pago fiat: {{ order.attributes.fiat_payout_status }}</div>
      <div v-if="order.attributes.final_fiat_payout">Monto: {{ order.attributes.final_fiat_payout }} COP</div>
      <div v-if="order.attributes.payment_reference">Referencia: {{ order.attributes.payment_reference }}</div>
      <div v-if="order.attributes.payment_sent_at">Fecha: {{ order.attributes.payment_sent_at }}</div>
      <VBtn
        v-if="order.attributes.sale_payment_proof_download_url"
        class="mt-2"
        color="primary"
        variant="outlined"
        :loading="proofDownloading"
        :disabled="proofDownloading"
        @click="downloadSalePaymentProof"
      >
        Descargar comprobante
      </VBtn>
      <div v-if="proofDownloadError" class="text-error text-caption mt-2">
        {{ proofDownloadError }}
      </div>
    </VCard>

    <VAlert
      v-if="addressPending"
      type="info"
      variant="tonal"
      class="mt-3"
      icon="mdi-progress-clock"
    >
      Preparando direccion de deposito...
    </VAlert>

    <VAlert
      v-if="['manual_review', 'ignored'].includes(normalizeCryptoStatus(status))"
      type="info"
      variant="tonal"
      class="mt-3"
      icon="mdi-account-search-outline"
    >
      <div class="font-weight-bold">Esta transaccion quedo marcada para revision operativa.</div>
      <div v-if="manualReviewReason" class="mt-1">Motivo: {{ manualReviewReason }}</div>
      <div v-if="manualReviewHint" class="mt-1">{{ manualReviewHint }}</div>
    </VAlert>

    <VAlert
      v-if="['submitted', 'broadcasted', 'confirming'].includes(normalizeCryptoStatus(status)) && !txid"
      type="info"
      variant="tonal"
      class="mt-3"
      icon="mdi-clock-outline"
    >
      Deposito detectado y en proceso de conciliacion. El seguimiento sigue activo mientras llega la confirmacion final.
    </VAlert>
  </VCard>
</template>
