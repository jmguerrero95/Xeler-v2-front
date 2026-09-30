<template>
  <div class="my-4">
    <div>
      <h3 class="text-primary">
        {{ title }}
      </h3>
      <p class="text-table text-18">
        {{ helperText }}
      </p>
    </div>

    <div
      v-if="loading"
      class="text-table rounded-lg pa-4 mb-3"
      style="background-color: rgba(239, 93, 168, 0.08)"
    >
      Cargando metodos de pago disponibles...
    </div>
    <div
      v-else-if="errorMessage"
      class="text-table rounded-lg pa-4 mb-3"
      style="background-color: rgba(239, 93, 168, 0.08)"
    >
      {{ errorMessage }}
    </div>
    <div
      v-else-if="flowPaymentMethods.length === 0"
      class="text-table rounded-lg pa-4 mb-3"
      style="background-color: rgba(239, 93, 168, 0.08)"
    >
      No hay metodos de pago disponibles para esta operacion y moneda.
    </div>

    <VRow v-else>
      <VCol
        v-for="paymentMethod in flowPaymentMethods"
        :key="paymentMethod.id"
        cols="4"
      >
        <VBtnDegree
          class="w-100"
          rounded="lg"
          :class="{
            'payment-selected': paymentMethod.id === modelValue?.id,
          }"
          :disabled="paymentMethod.attributes.available === false"
          color="white"
          @click="selectPaymentMethod(paymentMethod)"
        >
          {{ paymentMethod.attributes.name }}
        </VBtnDegree>
        <div
          v-if="paymentMethod.attributes.available === false && paymentMethod.attributes.disabled_reason"
          class="text-caption text-table mt-2"
        >
          {{ paymentMethod.attributes.disabled_reason }}
        </div>
      </VCol>
    </VRow>
  </div>
</template>

<script setup lang="ts">
import type { PaymentMethod } from "@/interfaces/PaymentMethod/PaymentMethod.model";
import { CompanyAccountStore } from "@/stores/CompanyAccountStore";
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";

const emits =
  defineEmits<(e: "update:model-value", value: PaymentMethod | null) => void>();

const props = defineProps<{
  side?: "buy" | "sale";
  currencyId: number | string | null;
  companyId?: number | null;
  modelValue: PaymentMethod | null;
}>();

const companyAccountStore = CompanyAccountStore();
const { flowPaymentMethods } = storeToRefs(companyAccountStore);
const loading = ref(false);
const errorMessage = ref("");

const title = computed(() =>
  props.side === "sale"
    ? "Metodo para recibir el pago"
    : "Metodo para realizar el pago"
);

const helperText = computed(() =>
  props.side === "sale"
    ? "Selecciona un metodo realmente disponible para esta venta."
    : "Selecciona un metodo realmente disponible para esta compra."
);

const loadPaymentMethods = async () => {
  emits("update:model-value", null);
  errorMessage.value = "";

  if (!props.currencyId) {
    flowPaymentMethods.value = [];
    return;
  }

  loading.value = true;
  try {
    await companyAccountStore.getFlowPaymentMethods({
      type: props.side ?? "buy",
      currency_id: props.currencyId,
      company_id: props.companyId ?? null,
    });
  } catch {
    errorMessage.value =
      "No pudimos cargar los metodos de pago para esta operacion.";
  } finally {
    loading.value = false;
  }
};

const selectPaymentMethod = (paymentMethod: PaymentMethod) => {
  if (paymentMethod.attributes.available === false) {
    return;
  }

  emits("update:model-value", paymentMethod);
};

watch(
  () => [props.side, props.currencyId, props.companyId],
  async () => {
    await loadPaymentMethods();
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
@use "@/scss/variables.scss" as *;

.v-text-field__slot.payment-selected {
  background: none;
}

.payment-selected {
  color: white !important;
  background-color: $color-primary !important;
}
</style>
