<template>
  <VCard v-if="visible" class="mx-auto mb-6 pa-5" max-width="760" variant="tonal">
    <div class="d-flex align-center ga-3 mb-3">
      <VIcon color="primary" size="30">mdi-send-check</VIcon>
      <div>
        <div class="text-h6 font-weight-bold">{{ title }}</div>
        <div class="text-body-2 text-medium-emphasis">{{ message }}</div>
      </div>
    </div>

    <VProgressLinear
      v-if="!terminal"
      indeterminate
      color="primary"
      rounded
      class="mb-4"
    />

    <div class="text-body-2">
      <div><strong>Moneda:</strong> {{ crypto?.currency ?? currency }}</div>
      <div><strong>Red:</strong> {{ crypto?.network ?? order.attributes.network ?? "-" }}</div>
      <div><strong>Monto final:</strong> {{ crypto?.final_crypto_received_amount ?? order.attributes.final_crypto_received_amount ?? "-" }}</div>
      <div><strong>Direccion destino:</strong> {{ crypto?.address ?? order.attributes.address_send ?? "-" }}</div>
      <div v-if="crypto?.txid" class="text-break"><strong>TXID:</strong> {{ crypto.txid }}</div>
      <div v-if="crypto?.txid">
        <strong>Confirmaciones:</strong> {{ confirmations }} de {{ requiredConfirmations }}
      </div>
    </div>

    <VBtn
      v-if="crypto?.txid && crypto.can_view_txid && crypto.explorer_url"
      :href="crypto.explorer_url"
      target="_blank"
      rel="noopener noreferrer"
      color="primary"
      variant="text"
      class="mt-3 px-0"
    >
      Ver en explorador
    </VBtn>
  </VCard>
</template>

<script setup lang="ts">
import type { Order } from "@/interfaces/Order/Order.model";
import { computed } from "vue";

const props = defineProps<{ order: Order }>();

const crypto = computed(() => props.order.attributes.crypto);
const status = computed(() => String(crypto.value?.payout_status ?? crypto.value?.status ?? "pending"));
const confirmations = computed(() => Math.max(0, Number(crypto.value?.confirmations ?? 0)));
const requiredConfirmations = computed(() => Math.max(0, Number(crypto.value?.required_confirmations ?? crypto.value?.confirmations_required ?? 0)));
const currency = computed(() => props.order.relationships?.currency?.attributes?.abbreviation ?? "-");
const terminal = computed(() => Boolean(props.order.attributes.is_terminal) || status.value === "confirmed");
const visible = computed(() => {
  const statusName = String(props.order.attributes.status_name ?? "").toLowerCase();
  return Boolean(
    props.order.attributes.manual_review
    || crypto.value?.txid
    || ["submitted", "broadcasted", "confirming", "confirmed", "failed", "manual_review"].includes(status.value)
    || statusName.includes("comprobante aprobado")
    || statusName.includes("envio"),
  );
});

const title = computed(() => {
  if (terminal.value) return "Compra completada";
  if (props.order.attributes.manual_review || status.value === "manual_review" || status.value === "failed") {
    return "Operacion en revision";
  }
  if (status.value === "submitted") return "Envio solicitado";
  if (crypto.value?.txid) return "Transaccion enviada";
  return "Pago confirmado";
});

const message = computed(() => {
  if (terminal.value) return "La entrega de tu criptomoneda fue confirmada.";
  if (props.order.attributes.manual_review || status.value === "manual_review" || status.value === "failed") {
    return "Tu operacion esta siendo revisada antes del envio.";
  }
  if (crypto.value?.txid) return `Confirmando ${confirmations.value} de ${requiredConfirmations.value}.`;
  if (status.value === "submitted") return "El envio fue solicitado y estamos esperando el TXID.";
  return "Preparando el envio de tu criptomoneda.";
});
</script>
