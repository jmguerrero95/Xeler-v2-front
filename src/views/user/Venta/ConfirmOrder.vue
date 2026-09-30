<template>
  <VCol cols="12" class="text-primary text-center">
    <h3>Detalle de venta #{{ order.attributes.tranx_no }}</h3>
  </VCol>

  <VRow
    v-if="
      order.attributes.payment_method_code === 'cash' &&
      cashLocation
    "
    class="mb-6"
  >
    <VCol cols="12">
      <div class="border-degree pa-4 text-table">
        <div class="text-primary font-weight-medium mb-2">
          Punto seleccionado para pago en efectivo
        </div>
        <div>{{ cashLocation.attributes.location_name }}</div>
        <div v-if="cashLocation.attributes.description">
          {{ cashLocation.attributes.description }}
        </div>
        <div v-if="cashLocation.attributes.beneficiary">
          Responsable: {{ cashLocation.attributes.beneficiary }}
        </div>
      </div>
    </VCol>
  </VRow>

  <CryptoDepositPanel class="mb-6" :order="order" :fallback-address="order.attributes.address_send" />

  <preview-order
    v-if="$vuetify.display.smAndDown"
    class="mx-auto mt-5"
    style="max-width: 320px"
  />

  <div
    class="text-center mt-10"
    v-if="order.attributes.can_cancel_order"
  >
    <cancel-order :order="order" />
  </div>
</template>

<script setup lang="ts">
import type { Order } from "@/interfaces/Order/Order.model";
import CancelOrder from "../Compra/CheckBuy/components/CancelOrder.vue";
import PreviewOrder from "@/layouts/full/menuRight/PreviewOrder/PreviewOrder.vue";
import CryptoDepositPanel from "@/components/crypto/CryptoDepositPanel.vue";
import type { EfectyAccount } from "@/interfaces/CompanyAccount/EfectyAccount/EfectyAccount.model";
import { computed } from "vue";

const props = defineProps<{
  order: Order;
}>();

const cashLocation = computed(() =>
  props.order.attributes.payment_method_code === "cash"
    ? (props.order.relationships?.account_delivery as EfectyAccount | undefined)
    : undefined
);
</script>

<style scoped lang="scss">
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
