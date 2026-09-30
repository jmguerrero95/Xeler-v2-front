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
  </VRow>
  <VRow class="px-5">
    <VCol
      cols="12"
      sm="12"
      class="text-table border-degree text-left font-22 font-weight-light"
    >
      <p>
        <span class="text-primary font-weight-light">Direccion:</span> <br />{{
          accountDelivery?.attributes.description
        }}
      </p>
      <p>Nombre: {{ accountDelivery?.attributes.beneficiary }}</p>
      <VSpacer />
      <div class="mt-5">
        <span class="text-primary font-weight-light">Indicaciones:</span>
        <ul class="ml-10" style="list-style-type: decimal">
          <li>Informar un pago para Xeler Go!.</li>
          <li>Entregar el dinero.</li>
          <li>Conservar el recibo.</li>
        </ul>
      </div>
    </VCol>
    <VCol cols="12" sm="12">
      <VAlert :type="rateAlertType" variant="tonal" border="start" class="mb-4">
        <div class="font-weight-bold mb-1">{{ rateStatusTitle }}</div>
        <div>{{ rateStatusMessage }}</div>
      </VAlert>
      <UploadImageComponent
        class="border rounded-lg d-flex justify-center align-center pa-6 mb-4"
        style="height: 280px"
        v-model="comprobant"
        text="Sube tu recibo o comprobante de pago"
        :disabled="!order.attributes.can_upload_voucher"
        :sizeImage="180"
      />
      <AuthenticatedVoucherDownload :images="order.relationships?.images" />
      <div class="text-center">
        <VBtnPrimary
          style="min-width: 190px"
          @click="uploadVoucher"
          :disabled="!canSubmitVoucher || !order.attributes.can_upload_voucher"
          :loading="submittingVoucher"
        >
          Subir recibo
        </VBtnPrimary>
      </div>
      <div v-if="order.attributes.can_upload_voucher" class="text-table text-center mt-4">
        Tienes
        <CountDown
          :deadline="order.attributes.voucher_deadline_at ?? order.attributes.payment_deadline_at ?? undefined"
          :server-time="order.attributes.server_time ?? undefined"
        />
        minutos para subir tu comprobante.
      </div>
      <div v-else-if="order.attributes.upload_voucher_block_reason" class="text-error font-weight-bold text-center mt-4">
        No es posible subir comprobante: {{ uploadBlockMessage }}.
      </div>
      <div
        v-if="!center"
        class="text-table rounded-lg pa-4"
        style="background-color: rgba(239, 93, 168, 0.08)"
      >
        Este punto no tiene coordenadas registradas.
      </div>
      <GoogleMap
        v-else
        :api-key="apiGoogleKey"
        style="width: 100%; height: 500px"
      >
        <Marker :options="markerOptions" />
      </GoogleMap>
    </VCol>
  </VRow>
  <div
    v-if="order.attributes.can_cancel_order"
    class="text-center w-100 mt-10"
  >
    <cancel-order :order="order" />
  </div>
</template>

<script setup lang="ts">
import { GoogleMap, Marker } from "vue3-google-map";
import { computed, ref, toRefs } from "vue";
import type { Order } from "@/interfaces/Order/Order.model";
import CancelOrder from "./CancelOrder.vue";
import type { EfectyAccount } from "@/interfaces/CompanyAccount/EfectyAccount/EfectyAccount.model";
import { parseCoordinateString } from "@/utils/decimal";
import CountDown from "@/components/CountDown.vue";
import UploadImageComponent from "@/views/user/Kyc/components/UploadImageComponent.vue";
import { TransactionStore } from "@/stores/TransactionStore";
import { useVoucherUpload } from "@/composables/useVoucherUpload";
import AuthenticatedVoucherDownload from "@/components/orders/AuthenticatedVoucherDownload.vue";

const props = defineProps<{
  order: Order;
}>();
const { order } = toRefs(props);

const apiGoogleKey = import.meta.env.VITE_API_GOOGLE as string;

const parseCoordinates = (value?: string | null) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [latRaw, lngRaw] = value.split(",");
  if (!latRaw || !lngRaw) {
    return null;
  }

  const lat = parseCoordinateString(latRaw.trim());
  const lng = parseCoordinateString(lngRaw.trim());

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return { lat, lng };
};

const accountDelivery = order.value.relationships
  ?.account_delivery as EfectyAccount;
const transactionStore = TransactionStore();
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

const center = ref(parseCoordinates(accountDelivery?.attributes.coordinate));
const markerOptions = computed(() =>
  center.value
    ? {
        position: center.value,
        label: "L",
        title: "Punto de pago",
      }
    : undefined
);

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
