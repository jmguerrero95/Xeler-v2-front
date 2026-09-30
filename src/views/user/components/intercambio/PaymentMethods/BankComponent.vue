<template>
  <div>
    <div
      v-if="!itemsDetails || itemsDetails.length === 0"
      class="text-table rounded-lg pa-4"
      style="background-color: rgba(239, 93, 168, 0.08)"
    >
      No hay bancos disponibles para pagar en este momento.
    </div>
    <div
      v-if="errorMessage"
      class="text-table rounded-lg pa-4 mt-4"
      style="background-color: rgba(239, 93, 168, 0.08)"
    >
      {{ errorMessage }}
    </div>
    <VRow v-if="itemsDetails && itemsDetails.length > 0">
      <VCol
        v-for="(bankAccount, i) in itemsDetails as Bank[]"
        :key="i"
        cols="6"
        sm="4"
        md="6"
        lg="4"
        @click="selectItem(bankAccount)"
      >
        <div
          class="cursor-pointer text-center"
          :class="{
            'border-primary border-t-0 border-e-0 border-s-0':
              bankAccount.id == modelValue?.relationships?.bank?.id,
          }"
          :color="bankAccount.attributes.color ?? 'primary'"
        >
          <VImg
            v-if="bankAccount.relationships?.images?.length"
            :src="bankAccount.relationships?.images?.[0]?.attributes?.aws_url ?? undefined"
            width="150"
            cover
            class="mx-auto"
            aspect-ratio="16/9"
            :max-height="34"
          />
          <span v-else class="text-capitalize font-weight-light text-table">
            {{ bankAccount.attributes.name }}
          </span>
          <div v-if="loadingBankId === bankAccount.id" class="text-table mt-2">
            Cargando cuenta disponible...
          </div>
        </div>
      </VCol>
    </VRow>
  </div>
</template>

<script setup lang="ts">
import type { BankAccount } from "@/interfaces/CompanyAccount/BankAccount/BankAccount.model";
import type { Bank } from "@/interfaces/Bank/Bank.model";
import { ref } from "vue";
import { helperStore } from "@/helper";

const helper = helperStore();
const { modelValue, itemsDetails, paymentTypeId } = defineProps<{
  itemsDetails: Bank[] | null | undefined;
  modelValue: BankAccount;
  paymentTypeId?: number | string | null;
}>();

const emits = defineEmits<{
  (e: "update:model-value", value: BankAccount): void;
}>();

const loadingBankId = ref<number | null>(null);
const errorMessage = ref("");
const itemSelect = ref<BankAccount | null>(null);

const selectItem = async (item: Bank) => {
  const params = {
    bank_id: item.id,
    payment_type_id: paymentTypeId,
  };

  loadingBankId.value = item.id;
  errorMessage.value = "";

  try {
    const res = await helper.http("order/flow/company-random-bank-account", "get", {
      params,
    });
    const bankAccount = res.data.response;

    if (!bankAccount?.id) {
      itemSelect.value = null;
      errorMessage.value =
        "No pudimos cargar una cuenta disponible para este banco. Intenta otro banco o metodo.";
      return;
    }

    emits("update:model-value", bankAccount);
    itemSelect.value = bankAccount;
  } catch (error) {
    itemSelect.value = null;
    errorMessage.value =
      "No pudimos cargar una cuenta disponible para este banco. Intenta otro banco o metodo.";
  } finally {
    loadingBankId.value = null;
  }
};
</script>

<style scoped>
.v-text-field__slot.payment-selected {
  background: none;
}

.payment-selected {
  color: white !important;
}
</style>
