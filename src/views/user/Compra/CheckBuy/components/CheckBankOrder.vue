<template>
  <VContainer class="py-8">
    <VRow justify="center" class="mb-6">
      <VCol cols="12" class="text-center">
        <h2 class="text-primary font-weight-bold">
          Pago de compra #{{ order.attributes.tranx_no }}
        </h2>
        <h3
          :class="{
            'text-success': order.attributes.is_completed,
            'text-error': order.attributes.is_cancelled,
            'text-grey-darken-2': order.attributes.is_initial_received,
          }"
        >
          {{ order.relationships?.status?.attributes?.name }}
        </h3>
      </VCol>

      <VCol cols="12" md="8">
        <InstructionsModal :order="order" />

        <VAlert
          type="warning"
          class="mt-4"
          border="start"
          color="pink-lighten-4"
          icon="mdi-alert-circle"
        >
          No recibimos transferencias virtuales a menos que tengas la
          verificacion de identidad aprobada (KYC). La cuenta desde la que
          transfieres debe estar a tu nombre; de lo contrario, la transaccion
          sera rechazada y se cobrara un costo administrativo del 1.4%.
        </VAlert>
      </VCol>

      <VCol cols="12" md="5" class="mt-6">
        <VCard class="pa-4" :style="{ borderColor: getColorBank }" variant="outlined">
          <VCardTitle class="text-h6">{{ breb ? "Datos Bre-B" : "Datos Bancarios" }}</VCardTitle>
          <VCardText class="text-subtitle-2">
            <VImg
              v-if="getImageBank()"
              :src="getImageBank()"
              width="180"
              class="mb-3 mx-auto"
              contain
            />
            <p>
              <strong>Titular:</strong>
              {{ breb?.holder_name || accountDelivery?.attributes?.beneficiary || "No especificado" }}
            </p>
            <p>
              <strong>{{ breb ? "Llave" : "Numero de Cuenta" }}:</strong>
              {{ breb?.operational_value || breb?.masked_value || accountDelivery?.attributes?.account_number || "No especificado" }}
            </p>
            <p>
              <strong>Banco:</strong>
              {{
                breb?.bank_name || accountDelivery?.relationships?.bank?.attributes?.name ||
                "Banco no especificado"
              }}
            </p>
            <p v-if="!breb">
              <strong>Tipo de Cuenta:</strong>
              {{
                accountDelivery?.relationships?.typeAccountBank?.attributes?.name ||
                "Tipo de cuenta no especificado"
              }}
            </p>
            <p v-if="breb?.instructions"><strong>Instrucciones:</strong> {{ breb.instructions }}</p>
          </VCardText>
        </VCard>
      </VCol>

      <VCol v-if="breb" cols="12" md="10">
        <VTextField v-model="brebPaymentReference" label="Referencia Bre-B (opcional)" maxlength="120" />
      </VCol>

      <VCol cols="12" md="5" class="mt-6">
        <UploadImageComponent
          class="border rounded-lg d-flex justify-center align-center pa-6"
          style="height: 320px"
          v-model="comprobant"
          text="Sube tu comprobante de pago"
          :disabled="isOrderClosed"
          :sizeImage="200"
        />
        <AuthenticatedVoucherDownload :images="order.relationships?.images" />
      </VCol>

      <VCol cols="12" md="10" class="mt-4">
        <VAlert :type="rateAlertType" variant="tonal" border="start">
          <div class="font-weight-bold mb-1">{{ rateStatusTitle }}</div>
          <div>{{ rateStatusMessage }}</div>
        </VAlert>
      </VCol>

      <VCol cols="12" class="text-center">
        <VBtnPrimary
          class="mt-4"
          style="min-width: 200px"
          @click="uploadVoucher"
          :disabled="
            !canSubmitVoucher ||
            !order.attributes.can_upload_voucher
          "
          :loading="submittingVoucher"
        >
          Subir Comprobante
        </VBtnPrimary>
      </VCol>

      <VCol v-if="order.attributes.can_upload_voucher" cols="12" class="text-center mt-6">
        <p class="text-body-1">
          Tienes
          <strong>
            <CountDown
              :deadline="order.attributes.voucher_deadline_at ?? order.attributes.payment_deadline_at ?? undefined"
              :server-time="order.attributes.server_time ?? undefined"
            />
          </strong>
          minutos para subir tu comprobante. De lo contrario, la orden sera
          cancelada y no podras generar otra en los proximos
          <span class="text-error font-weight-bold">30 minutos</span>.
        </p>
      </VCol>
      <VCol v-else-if="order.attributes.upload_voucher_block_reason" cols="12" class="text-center mt-6">
        <p class="text-error font-weight-bold">
          No es posible subir comprobante: {{ uploadBlockMessage }}.
        </p>
      </VCol>

      <VCol v-if="order.attributes.can_cancel_order" cols="12" class="text-center mt-6">
        <CancelOrder :order="order" />
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup lang="ts">
import CountDown from "@/components/CountDown.vue";
import UploadImageComponent from "@/views/user/Kyc/components/UploadImageComponent.vue";
import { ref, computed, toRefs } from "vue";
import type { BankAccount } from "@/interfaces/CompanyAccount/BankAccount/BankAccount.model";
import type { Order } from "@/interfaces/Order/Order.model";
import CancelOrder from "./CancelOrder.vue";
import InstructionsModal from "@/views/user/Compra/CheckBuy/components/InstructionsModal.vue";
import { TransactionStore } from "@/stores/TransactionStore";
import { useVoucherUpload } from "@/composables/useVoucherUpload";
import AuthenticatedVoucherDownload from "@/components/orders/AuthenticatedVoucherDownload.vue";

const props = defineProps<{
  order: Order;
}>();
const { order } = toRefs(props);

const transactionStore = TransactionStore();
const accountDelivery = order.value.relationships?.account_delivery as
  | BankAccount
  | undefined;
const breb = computed(() => order.value.attributes.breb ?? null);
const comprobant = ref<string | Blob>("");
const brebPaymentReference = ref("");

const getImageBank = (): string | undefined => {
  const images = accountDelivery?.relationships?.bank?.relationships?.images ?? [];
  if (!images.length) return undefined;
  return images[0]?.attributes?.aws_url ?? undefined;
};

const getColorBank = computed(() => {
  return accountDelivery?.relationships?.bank?.attributes?.color ?? "yellow";
});

const {
  canSubmit: canSubmitVoucher,
  submitting: submittingVoucher,
  upload: submitVoucher,
} = useVoucherUpload({
  orderId: order.value.id,
  tranxNo: order.value.attributes.tranx_no,
  file: comprobant,
  fileField: "vouchers[]",
  uploadUrl: "order/charge/voucher",
  successMessage: "Su comprobante se ha subido satisfactoriamente.",
  errorMessage: "Error al subir el comprobante. Verifica el archivo e intentalo de nuevo.",
  scope: `order-voucher-${order.value.id}`,
  extraFields: () => ({ breb_payment_reference: breb.value ? brebPaymentReference.value : null }),
  onSuccess: async () => {
    await transactionStore.getMyOrderByTransaction(order.value.attributes.tranx_no);
  },
});

const uploadVoucher = async () => {
  await submitVoucher();
};

const isOrderClosed = computed(() => !order.value.attributes.can_upload_voucher);

const rateAlertType = computed(() => {
  if (order.value.attributes.rate_recalculation_block_reason) {
    return "warning";
  }
  return order.value.attributes.last_rate_recalculated_at ? "warning" : "info";
});

const rateStatusTitle = computed(() => {
  if (order.value.attributes.rate_policy === "stable_locked") {
    return "Tasa fija";
  }
  if (order.value.attributes.rate_recalculation_block_reason) {
    return "Actualizando tasa";
  }
  if (order.value.attributes.last_rate_recalculated_at) {
    return "Tasa actualizada";
  }
  return "Tasa protegida";
});

const rateStatusMessage = computed(() => {
  const deadline = order.value.attributes.payment_deadline_at ?? "";
  if (order.value.attributes.rate_recalculation_block_reason) {
    return "Estamos actualizando la tasa de esta orden. Intenta nuevamente en unos minutos.";
  }
  if (order.value.attributes.rate_policy === "stable_locked") {
    return `La tasa se mantiene fija hasta el vencimiento de la orden (${deadline}).`;
  }
  if (order.value.attributes.last_rate_recalculated_at) {
    return `Tu tasa fue actualizada automaticamente. La orden sigue vigente hasta ${deadline}.`;
  }
  return `Tu tasa se mantiene durante 20 minutos. Despues de ese tiempo puede actualizarse automaticamente. La orden sigue vigente hasta ${deadline}.`;
});

const uploadBlockMessage = computed(() => {
  if (order.value.attributes.upload_voucher_block_reason === "payment_deadline_expired") {
    return "la ventana de pago de 90 minutos vencio";
  }
  if (["ticker_unavailable", "rate_recalculation_pending"].includes(String(order.value.attributes.upload_voucher_block_reason))) {
    return "estamos actualizando la tasa de esta orden. Intenta nuevamente en unos minutos";
  }
  return order.value.attributes.upload_voucher_block_reason;
});
</script>

<style scoped>
.v-card {
  border-width: 2px;
}
</style>

<style scoped lang="scss">
$background-color: v-bind("getColorBank");
.v-text-field__slot {
  background:
    linear-gradient($background-color, $background-color) padding-box,
    linear-gradient(
        180deg,
        rgba(2, 0, 36, 1) 0%,
        rgba(80, 67, 233, 1) 0%,
        rgba(22, 180, 229, 1) 100%
      )
      border-box;
}
</style>
