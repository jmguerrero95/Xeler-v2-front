<template>
  <div>
    <VRow>
      <VCol
        cols="4"
        v-for="OtherAccount, i in (itemsDetails as OtherAccount[])"
        :key="i"
        @click="selectItem(OtherAccount)"
      >
        <VBtnDegree
          rounded="lg"
          :class="{
            'payment-selected': OtherAccount.id == props.modelValue?.id,
          }"
          color="primary"
        >
          {{ OtherAccount.attributes.description }}
        </VBtnDegree>
      </VCol>
    </VRow>
  </div>
</template>

<script setup lang="ts">
import type { OtherAccount } from "@/interfaces/CompanyAccount/OtherAccount/OtherAccount.model";
import { ref } from "vue";
const props = defineProps<{
  itemsDetails: OtherAccount[];
  modelValue: OtherAccount | null;
}>();

const emits =
  defineEmits<(e: "update:model-value", value: OtherAccount) => void>();

const selectItem = (item: OtherAccount) => {
  emits("update:model-value", item);
  itemSelect.value = item;
};
const itemSelect = ref<OtherAccount | null>(null);
</script>

<style scoped>
.v-text-field__slot.payment-selected {
  background: none;
}

.payment-selected {
  color: white !important;
}
</style>
