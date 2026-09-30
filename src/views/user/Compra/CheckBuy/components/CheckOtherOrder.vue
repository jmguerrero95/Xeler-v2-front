<template>
  <VRow>
    <VCol cols="12" class="text-primary text-center">
      <h3>Pago de compra #{{ order.attributes.tranx_no }}</h3>
    </VCol>
    <VCol
      cols="12"
      class="text-center"
      :class="{
        'text-success': order.attributes.is_completed,
        'text-error': order.attributes.is_cancelled,
        'text-table':
          !order.attributes.is_completed && !order.attributes.is_cancelled,
      }"
    >
      <h3>
        {{ order.relationships?.status?.attributes?.name }}
      </h3>
    </VCol>

    <VCol v-if="!$vuetify.display.xs" cols="12">
      <div
        class="w-100 alertError py-2 px-1 rounded-lg text-soft-error d-flex"
        style="gap: 15px"
      >
        <div class="text-center align-self-center">
          <VIcon size="50" class="">
            <svg
              width="53"
              height="53"
              viewBox="0 0 53 53"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_157_6393)">
                <path
                  d="M24.2917 33.1248H28.7084V37.5415H24.2917V33.1248ZM24.2917 15.4582H28.7084V28.7082H24.2917V15.4582ZM26.4779 4.4165C14.2879 4.4165 4.41669 14.3098 4.41669 26.4998C4.41669 38.6898 14.2879 48.5832 26.4779 48.5832C38.69 48.5832 48.5834 38.6898 48.5834 26.4998C48.5834 14.3098 38.69 4.4165 26.4779 4.4165ZM26.5 44.1665C16.7392 44.1665 8.83335 36.2607 8.83335 26.4998C8.83335 16.739 16.7392 8.83317 26.5 8.83317C36.2609 8.83317 44.1667 16.739 44.1667 26.4998C44.1667 36.2607 36.2609 44.1665 26.5 44.1665Z"
                  fill="#EF5DA8"
                />
              </g>
              <defs>
                <clipPath id="clip0_157_6393">
                  <rect width="53" height="53" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </VIcon>
        </div>
        <div class="my-auto">
          No recibimos transferencias virtuales a menos que tengas la
          verificacion de identidad aprobada (KYC), la cuenta desde la que
          transfieres debe estar a nombre tuyo; de lo contrario la transaccion
          sera rechazada y se cobrara un costo administrativo del 1.4%.
        </div>
      </div>
    </VCol>
  </VRow>
  <VRow>
    <VCol cols="12" class="mx-0 px-0">
      <h3 class="text-primary text-center">
        Realizar pago y sube el comprobante de pago
      </h3>
    </VCol>
    <VCol cols="12" lg="6" class="my-6" style="height: 300px">
      <div
        class="d-flex flex-column mx-auto v-text-field__slot h-100"
        style="width: 300px"
      >
        <div class="d-flex flex-column mx-5 my-auto text-table font-weight-bold">
          <div class="d-flex justify-space-between">
            <div>Titular:</div>
            <div>{{ accountDelivery?.attributes?.beneficiary || "No especificado" }}</div>
          </div>
          <div class="d-flex justify-space-between">
            <div>Numero de Cuenta:</div>
            <div>{{ accountDelivery?.attributes?.account_number || "No especificado" }}</div>
          </div>
          <div class="d-flex justify-space-between">
            <div>Documento:</div>
            <div>
              {{ accountDelivery?.attributes?.identification_document || "No especificado" }}
            </div>
          </div>
          <div class="d-flex justify-space-between">
            <div>Telefono:</div>
            <div>{{ accountDelivery?.attributes?.phone || "No especificado" }}</div>
          </div>
          <div class="d-flex justify-space-between">
            <div>Tipo:</div>
            <div>
              {{
                accountDelivery?.relationships?.typeSubPayment?.attributes?.name ||
                accountDelivery?.relationships?.typePayment?.attributes?.name ||
                accountDelivery?.attributes?.description ||
                "Tipo de cuenta no especificado"
              }}
            </div>
          </div>
        </div>
      </div>
    </VCol>
    <VCol cols="12" lg="6">
      <UploadImageComponent
        :class-input="['d-flex h-100 flex-column justify-center align-center ']"
        style="height: 280px"
        v-model="comprobant"
        text="Sube tu comprobante de pago"
        :disabled="
          order.attributes.is_terminal
        "
      />
      <AuthenticatedVoucherDownload :images="order.relationships?.images" />
    </VCol>
    <VCol cols="12" class="mt-4">
      <VAlert :type="rateAlertType" variant="tonal" border="start">
        <div class="font-weight-bold mb-1">{{ rateStatusTitle }}</div>
        <div>{{ rateStatusMessage }}</div>
      </VAlert>
    </VCol>
      <VCol
        v-if="order.attributes.can_upload_voucher"
        cols="12"
        class="text-center"
      >
        <VBtnPrimary
          style="min-width: 170px"
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
  </VRow>

  <VRow v-if="order.attributes.can_upload_voucher">
    <div class="text-table mt-7">
      Tienes
      <CountDown
        :deadline="order.attributes.voucher_deadline_at ?? order.attributes.payment_deadline_at ?? undefined"
        :server-time="order.attributes.server_time ?? undefined"
      />
      minutos para enviarnos tu comprobante; de lo contrario sera cancelada, y
      no podras crear una nueva orden hasta dentro de
      <span class="text-error text-h6">30 minutos</span>
    </div>
  </VRow>
  <VRow v-else-if="order.attributes.upload_voucher_block_reason">
    <div class="text-error font-weight-bold mt-7">
      No es posible subir comprobante: {{ uploadBlockMessage }}.
    </div>
  </VRow>
  <div v-if="order.attributes.can_cancel_order" class="text-center w-100 mt-10">
    <CancelOrder :order="order" />
  </div>
</template>

<script setup lang="ts">
import CountDown from "@/components/CountDown.vue";
import UploadImageComponent from "@/views/user/Kyc/components/UploadImageComponent.vue";
import { computed, toRefs, ref } from "vue";
import type { Order } from "@/interfaces/Order/Order.model";
import CancelOrder from "./CancelOrder.vue";
import type { OtherAccount } from "@/interfaces/CompanyAccount/OtherAccount/OtherAccount.model";
import { TransactionStore } from "@/stores/TransactionStore";
import { useVoucherUpload } from "@/composables/useVoucherUpload";
import AuthenticatedVoucherDownload from "@/components/orders/AuthenticatedVoucherDownload.vue";

const props = defineProps<{
  order: Order;
}>();
const { order } = toRefs(props);

const transactionStore = TransactionStore();
const accountDelivery = order.value.relationships?.account_delivery as
  | OtherAccount
  | undefined;
const comprobant = ref<Blob | string>("");

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
  onSuccess: async () => {
    await transactionStore.getMyOrderByTransaction(order.value.attributes.tranx_no);
  },
});

const uploadVoucher = async () => {
  await submitVoucher();
};

const rateAlertType = computed(() => {
  if (order.value.attributes.rate_recalculation_block_reason) return "warning";
  return order.value.attributes.last_rate_recalculated_at ? "warning" : "info";
});

const rateStatusTitle = computed(() => {
  if (order.value.attributes.rate_policy === "stable_locked") return "Tasa fija";
  if (order.value.attributes.rate_recalculation_block_reason) return "Actualizando tasa";
  if (order.value.attributes.last_rate_recalculated_at) return "Tasa actualizada";
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
