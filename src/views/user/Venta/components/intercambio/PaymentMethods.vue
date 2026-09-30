<template>
  <div class="my-4">
    <div>
      <h5 class="text-primary">
        {{ $t("views.sell.receiver-method") }}
      </h5>
      <p class="text-table text-18">
        Seleccione el método mediante el cual desea recibir los fondos de la venta.
      </p>
    </div>

    <VRow>
      <VCol
        cols="4"
        v-for="(paymentMethod, i) in companyAccountStore.paymentMethods"
        :key="i"
        @click="emits('update:model-value', paymentMethod)"
      >
        <VBtnDegree
          class="w-100 font-weight-light"
          rounded="lg"
          :class="{
            'payment-selected': paymentMethod.id == modelValue?.id,
          }"
          color="primary"
        >
          {{ paymentMethod.attributes.name }}
        </VBtnDegree>
      </VCol>
    </VRow>
  </div>
</template>

<script setup lang="ts">
import type { PaymentMethod } from "@/interfaces/PaymentMethod/PaymentMethod.model";
import { CompanyAccountStore } from "@/stores/CompanyAccountStore";

const companyAccountStore = CompanyAccountStore();
companyAccountStore.getPaymentMethods();

const emits =
  defineEmits<(e: "update:model-value", value: PaymentMethod) => void>();

defineProps<{
  modelValue: PaymentMethod | null;
}>();
</script>

<style scoped>
.v-text-field__slot.payment-selected {
  background: none;
}

.payment-selected {
  color: white !important;
}
</style>
