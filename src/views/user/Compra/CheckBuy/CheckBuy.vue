<template>
  <div v-if="loading">Cargando orden...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else-if="order">
    <BuyCryptoDeliveryStatus :order="order" />
    <Component
      v-if="typeOrderComponent"
      :is="typeOrderComponent"
      :order="order!"
    ></Component>
    <div v-else class="text-table text-center pa-4">
      No se pudo identificar el método de pago de esta orden. Contacta soporte.
    </div>
  </div>
  <div v-else>No existe una orden con ese numero</div>
</template>

<script setup lang="ts">
import CheckBankOrder from "./components/CheckBankOrder.vue";
import { computed } from "vue";
import CheckOtherOrder from "./components/CheckOtherOrder.vue";
import CheckEfectyOrder from "./components/CheckEfectyOrder.vue";
import CheckXcopOrder from "./components/CheckXcopOrder.vue";
import { useOrderTracking } from "@/composables/useOrderTracking";
import BuyCryptoDeliveryStatus from "./components/BuyCryptoDeliveryStatus.vue";
const props = defineProps<{
  numTransaction: string;
}>();

const { order, loading, error } = useOrderTracking(props.numTransaction, "user");

const paymentMethodCode = computed(() =>
  String(
    order.value?.attributes.payment_method_code ??
      order.value?.relationships?.payment?.attributes?.code ??
      order.value?.relationships?.payment?.attributes?.slug ??
      "",
  ).toLowerCase()
);

const isConfirmedXcopPayment = computed(() =>
  paymentMethodCode.value === "xcop"
  && order.value?.attributes.buy_payment_mode === "xcop"
  && order.value?.attributes.payment_settled === true
  && order.value?.attributes.payment_source === "xcop"
  && order.value?.attributes.payment_proof_required === false
);

const typeOrderComponent = computed(() => {
  if (isConfirmedXcopPayment.value) {
    return CheckXcopOrder;
  }

  switch (paymentMethodCode.value) {
    case "bank":
    case "breb":
      return CheckBankOrder;
    case "other":
      return CheckOtherOrder;
    case "cash":
      return CheckEfectyOrder;
    default:
      return false;
  }
});
</script>
