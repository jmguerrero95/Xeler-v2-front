<template>
  <VCard class="mx-auto pa-6" max-width="760" variant="outlined">
    <div class="d-flex align-center ga-3 mb-5">
      <VIcon color="success" size="34">mdi-check-decagram</VIcon>
      <div>
        <h3 class="text-primary">Pago realizado con XCOP</h3>
        <p class="text-body-2">{{ deliveryMessage }}</p>
      </div>
    </div>

    <VAlert
      v-if="order.attributes.manual_review_public_message"
      type="warning"
      variant="tonal"
      class="mb-5"
    >
      {{ order.attributes.manual_review_public_message }}
    </VAlert>

    <VRow>
      <VCol cols="12" sm="6">
        <strong>XCOP debitado:</strong> {{ order.attributes.xcop_debited_amount ?? "-" }}
      </VCol>
      <VCol cols="12" sm="6">
        <strong>Moneda comprada:</strong> {{ currency }}
      </VCol>
      <VCol cols="12" sm="6">
        <strong>Crypto final:</strong> {{ finalCrypto }}
      </VCol>
      <VCol cols="12" sm="6">
        <strong>Red:</strong> {{ order.attributes.crypto?.network ?? order.attributes.network ?? "-" }}
      </VCol>
      <VCol cols="12">
        <strong>Direccion destino:</strong>
        {{ order.attributes.destination_address_masked ?? "-" }}
      </VCol>
      <VCol cols="12" sm="6">
        <strong>Estado de entrega:</strong> {{ deliveryStatus }}
      </VCol>
      <VCol cols="12" sm="6">
        <strong>Referencia:</strong> {{ order.attributes.tranx_no }}
      </VCol>
      <VCol v-if="order.attributes.crypto?.txid" cols="12" class="text-break">
        <strong>TXID:</strong> {{ order.attributes.crypto.txid }}
      </VCol>
      <VCol v-if="order.attributes.crypto?.confirmations != null" cols="12">
        <strong>Confirmaciones:</strong>
        {{ order.attributes.crypto.confirmations }} de
        {{ order.attributes.crypto.required_confirmations ?? order.attributes.crypto.confirmations_required ?? "-" }}
      </VCol>
    </VRow>

    <VDivider class="my-5" />
    <h4 class="text-primary mb-3">Seguimiento</h4>
    <div v-for="item in timeline" :key="item.key" class="d-flex ga-3 py-2">
      <VIcon :color="toneColor(item.tone)" size="20">mdi-circle-medium</VIcon>
      <span>{{ item.text }}</span>
    </div>
  </VCard>
</template>

<script setup lang="ts">
import type { Order } from "@/interfaces/Order/Order.model";
import { buildOrderTimeline, type TimelineTone } from "@/views/user/timeline";
import { computed } from "vue";

const props = defineProps<{ order: Order }>();

const currency = computed(
  () => props.order.relationships?.currency?.attributes?.abbreviation ?? "-",
);
const finalCrypto = computed(
  () =>
    props.order.attributes.crypto?.final_crypto_received_amount
    ?? props.order.attributes.final_crypto_received_amount
    ?? "-",
);
const deliveryStatus = computed(
  () =>
    props.order.attributes.crypto?.payout_status
    ?? props.order.attributes.crypto?.status
    ?? props.order.attributes.status_name
    ?? "Pendiente",
);
const timeline = computed(() => buildOrderTimeline(props.order));
const deliveryMessage = computed(() => {
  if (props.order.attributes.is_terminal) {
    return "La entrega de crypto fue completada.";
  }
  if (props.order.attributes.manual_review_public_message) {
    return "Tu pago XCOP permanece confirmado mientras revisamos la entrega.";
  }
  return "Tu pago XCOP fue confirmado. La entrega de crypto esta en proceso.";
});

const toneColor = (tone: TimelineTone): string => ({
  done: "success",
  active: "primary",
  warning: "warning",
  info: "info",
  idle: "grey",
}[tone]);
</script>
