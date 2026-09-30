<template>
    <div>
        <div
            v-if="!itemsDetails || itemsDetails.length === 0"
            class="text-table rounded-lg pa-4"
            style="background-color: rgba(239, 93, 168, 0.08)"
        >
            No hay billeteras o cuentas de pago disponibles para este método.
        </div>
        <VRow v-else>
            <VCol cols="4" v-for="OtherAccount, i in (itemsDetails as OtherAccount[])" :key="i"
                @click="selectItem(OtherAccount)">
                <VBtnDegree rounded="lg" :class="{
                    'payment-selected': OtherAccount.id == modelValue?.id
                }" color="white">
                   
                    {{ OtherAccount.attributes.description }}
                </VBtnDegree>
            </VCol>
        </VRow>
    </div>
</template>

<script setup lang="ts">
import type { OtherAccount } from '@/interfaces/CompanyAccount/OtherAccount/OtherAccount.model';
import { ref } from 'vue';
const { modelValue, itemsDetails } = defineProps<{
    itemsDetails: any[] | null | undefined
    modelValue: any
}>()

const emits = defineEmits<{
    (e: 'update:model-value', value: OtherAccount): void
}>()

const selectItem = (item: OtherAccount) => {
    emits('update:model-value', item)
    itemSelect.value = item
}
const itemSelect = ref<OtherAccount | null>(null)

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
