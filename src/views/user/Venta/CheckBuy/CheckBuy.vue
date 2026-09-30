<template>
  <div v-if="loading">Cargando orden...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else-if="order">
    <confirm-order
      v-if="!order.attributes.is_terminal"
      :order="order!"
    >
    </confirm-order>
    <timeline-view v-else :order="order"></timeline-view>
  </div>
  <div v-else>No existe una orden con ese numero</div>
</template>

<script setup lang="ts">
import TimelineView from "../../Timeline/TimelineView.vue";
import ConfirmOrder from "./../ConfirmOrder.vue";
import { useOrderTracking } from "@/composables/useOrderTracking";

const props = defineProps<{
  numTransaction: string;
}>();

const { order, loading, error } = useOrderTracking(props.numTransaction, "user");
</script>
