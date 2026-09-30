<template>
  <div v-if="order">
    <v-timeline density="compact" side="end">
      <v-timeline-item
        v-for="(item, i) in items"
        :key="i"
        fill-dot
        dot-color="white"
        density="compact"
        side="end"
      >
        <template #icon>
          <VIcon :color="item.color" :icon="item.icon" />
        </template>
        <span class="py-1">{{ item.text }}</span>
      </v-timeline-item>
    </v-timeline>

    <VRow
      v-if="
        order.attributes.payment_method_code !== 'cash'
      "
    >
    </VRow>
    <div
      v-else-if="
        order.attributes.can_prepare_cash_order ||
        order.attributes.can_user_accept_order
      "
      class="mt-10"
    >
      <VRow class="text-table">
        <h4 class="text-primary">Codigo para reclamar el pago</h4>
        <p>
          Codigo para reclamar el pago Hemos avisado al punto de pago para que
          preparen tu dinero, cuando llegues debes proporcionar el codigo No 1,
          en ese momento la persona en caja nos informara y te llegara un SMS y
          un EMAIL con el codigo No2.
        </p>
        <p class="mt-6">
          Este proceso nos garantiza que la persona indicada esta recibiendo el
          dinero.
        </p>
      </VRow>
      <VRow>
        <VCol class="d-flex justify-center align-center" style="gap: 15px">
          <div class="font-weight-bold text-primary">Codigo #1</div>
          <div
            class="border-degree d-flex align-center justify-center"
            style="width: 161px; height: 38px"
          >
            <span class="">{{
              order.relationships?.effectiveOrderCode?.code_one
            }}</span>
          </div>
        </VCol>
        <VCol
          v-if="order.attributes.can_user_accept_order"
          class="d-flex justify-center align-center"
          style="gap: 10px"
        >
          <div class="font-weight-bold text-primary">Codigo #2</div>
          <div
            @click="dialog = true"
            class="cursor-pointer border-degree d-flex align-center justify-center"
            style="width: 161px; height: 38px"
          >
            <span class="">_ _ _ _ _</span>
          </div>
        </VCol>
      </VRow>

      <VRow v-if="order.attributes.can_prepare_cash_order" class="mt-4">
        <VCol cols="12" class="text-center text-table">
          Estamos esperando que el punto valide tu codigo #1 para enviarte el
          codigo #2.
        </VCol>
      </VRow>

      <dialog-global
        v-if="order.attributes.can_user_accept_order"
        :dialog="dialog"
        @close-dialog="dialog = false"
        class-title="text-center text-primary"
      >
        <template #title>
          <span class="font-weight-light"
            >Transaccion: {{ order.attributes.tranx_no }}</span
          >
        </template>
        <template #content>
          <div class="text-center">
            <div>
              Ingresa el codigo que recibiste en el mensaje para autorizar el
              pago
            </div>
            <div
              class="mx-auto my-3 border-primary rounded-lg d-flex"
              style="width: 300px; height: 81px"
            >
              <v-otp-input
                v-model="secondCode"
                color="primary"
                length="6"
                variant="underlined"
                height="81"
                width="300"
              />
            </div>

            <div class="">
              Mensaje enviado, podras solicitar otro codigo dentro de <br />
              <count-down
                class="text-erro"
                :date-finish="count"
                :server-time="order.attributes.server_time ?? undefined"
              ></count-down>
            </div>
            <div class="cursor-pointer text-primary mb-5">
              No recibi el codigo
            </div>
            <div>
              <VBtnPrimary :disabled="secondCode.length < 4" @click="accept">
                Continuar
              </VBtnPrimary>
            </div>
          </div>
        </template>
      </dialog-global>
    </div>
    <preview-order
      v-if="$vuetify.display.smAndDown"
      class="mx-auto mt-5"
      style="max-width: 300px"
    ></preview-order>
  </div>
  <div v-else>No existe transaction con ese numero</div>
</template>

<script setup lang="ts">
import { helperStore } from "@/helper";
import { TransactionStore } from "@/stores/TransactionStore";
import { computed, ref, watch, watchEffect } from "vue";
import { storeToRefs } from "pinia";
import CheckIcon from "@/assets/icons/CheckIcon.vue";
import StageIcon from "@/assets/icons/StageIcon.vue";
import WithoutCheckIcon from "@/assets/icons/WithoutCheckIcon.vue";
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";
import CountDown from "@/components/CountDown.vue";
import PreviewOrder from "@/layouts/full/menuRight/PreviewOrder/PreviewOrder.vue";
import type { Order } from "@/interfaces/Order/Order.model";
import { buildOrderTimeline } from "../timeline";

const props = defineProps<{
  order: Order;
}>();

const secondCode = ref("");

watch(secondCode, (nuevo, viejo) => {
  if (nuevo.length > 6) {
    secondCode.value = viejo;
  }
});

const helper = helperStore();
const transactionStore = TransactionStore();
const { order } = storeToRefs(transactionStore);

watchEffect(() => {
  order.value = props.order;
});

const dialog = ref(false);

const count = computed(
  () =>
    order.value?.attributes.payment_deadline_at ??
    order.value?.attributes.voucher_deadline_at ??
    order.value?.attributes.order_expires_at ??
    order.value?.attributes.server_time ??
    "",
);

const items = computed(() => {
  const timeline = order.value ? buildOrderTimeline(order.value) : [];

  return timeline.map((item) => ({
    text: item.text,
    icon: item.tone === "done"
      ? CheckIcon
      : item.tone === "info"
        ? CheckIcon
        : item.tone === "warning"
          ? WithoutCheckIcon
          : StageIcon,
    color: item.tone === "done"
      ? "ok-2"
      : item.tone === "warning"
        ? "warning"
        : item.tone === "info"
          ? "info"
          : "active",
  }));
});

const accept = async () => {
  const url = "order/" + order.value?.id + "/accept";
  let data = {};

  if (order.value?.attributes.payment_method_code === "cash") {
    data = {
      code_two: secondCode.value,
    };
  }

  const scope = `order-accept-${order.value?.id}`;
  await helper
    .http(url, "post", { data }, "", false, {
      idempotent: true,
      idempotencyKey: createOperationKey(scope, data),
      financialAction: true,
    })
    .then(() => (dialog.value = false));
  clearOperationKey(scope);
  window.location.reload();
};
</script>

<style scoped>
input.border-0:focus-visible {
  border: none !important;
  outline: 0px;
}
</style>
