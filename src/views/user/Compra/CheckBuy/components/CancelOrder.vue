<template>
  <VBtnDanger
    v-if="props.order.attributes.can_cancel_order"
    @click="openModal = true"
    :disabled="submitting"
    style="background-color: #ef5da8 !important"
  >
    <span class="text-white">Cancelar Orden</span>
  </VBtnDanger>
  <dialog-global
    footer
    :dialog="openModal"
    @close-dialog="openModal = false"
    widthDialog="400"
  >
    <div class="text-center">
      <VIcon :icon="QuestionIcon" size="64" color="primary" />
    </div>

    <div class="text-center mt-4">
      <p class="text-h6 font-weight-medium mb-2">
        ¿Estás seguro de que deseas cancelar la orden?
      </p>
      <p class="text-body-1 text-grey-darken-1">
        Esta acción generará una penalización y se restringirá tu acceso para operar durante los próximos <strong>30 minutos</strong>.
      </p>
    </div>

    <template #actions>
      <VRow no-gutters class="mt-4" justify="space-between">
        <VCol cols="12" sm="6" class="pr-sm-2 mb-2 mb-sm-0">
          <VBtn block color="grey" variant="outlined" @click="openModal = false">
            Cancelar
          </VBtn>
        </VCol>
        <VCol cols="12" sm="6" class="pl-sm-2">
          <VBtn block color="primary" :loading="submitting" :disabled="submitting" @click="clickInCancel">
            Confirmar
          </VBtn>
        </VCol>
      </VRow>
    </template>
  </dialog-global>
</template>

<script setup lang="ts">
import type { Order } from "@/interfaces/Order/Order.model";
import { ref } from "vue";
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import QuestionIcon from "@/assets/icons/QuestionIcon.vue";
import { helperStore } from "@/helper";
import { useRouter } from "vue-router";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";
const openModal = ref(false);
const submitting = ref(false);
const props = defineProps<{
  order: Order;
}>();
const helper = helperStore();
const router = useRouter();
const clickInCancel = async () => {
  if (submitting.value) {
    return;
  }

  submitting.value = true;
  const url = "order/" + props.order.id + "/cancel";
  const scope = `order-cancel-${props.order.id}`;
  try {
    await helper.http(url, "post", {}, "", false, {
      idempotent: true,
      idempotencyKey: createOperationKey(scope, { order_id: props.order.id }),
      financialAction: true,
    });
    clearOperationKey(scope);
    openModal.value = false;
    helper.showNotify("Su Orden se ha cancelado");
    window.setTimeout(() => {
      router.push({ name: "user-profile" });
    }, 5000);
  } finally {
    submitting.value = false;
  }
};
</script>
