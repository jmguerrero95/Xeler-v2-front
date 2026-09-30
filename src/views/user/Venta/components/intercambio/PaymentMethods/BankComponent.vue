<template>
  <div>
    <VRow>
      <VCol
        cols="6"
        sm="4"
        md="6"
        lg="4"
        v-for="bankAccount, i in (itemsDetails as Bank[])"
        :key="i"
        @click="selectItem(bankAccount)"
      >
        <VBtnDegree
          rounded="lg"
          :class="{
            'payment-selected':
              bankAccount.id == props.modelValue?.relationships?.bank?.id,
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
          >
          </VImg>
          <span v-else>
            {{ bankAccount.attributes.name }}
          </span>
        </VBtnDegree>
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
const props = defineProps<{
  itemsDetails: Bank[];
  modelValue: BankAccount;
}>();

const emits =
  defineEmits<(e: "update:model-value", value: BankAccount) => void>();

const selectItem = async (item: Bank) => {
  const params = {
    bank_id: item.id,
    payment_type_id: 2,
  };
  const res = await helper.http("order/flow/company-random-bank-account", "get", {
    params,
  });
  const bankAccount = res.data.response;
  emits("update:model-value", bankAccount);
  itemSelect.value = bankAccount;
};
const itemSelect = ref<BankAccount | null>(null);
</script>

<style scoped>
.v-text-field__slot.payment-selected {
  background: none;
}

.payment-selected {
  color: white !important;
}
</style>
