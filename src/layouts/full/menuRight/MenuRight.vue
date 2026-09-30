<template>
    <div>
        <PreviewOrder class="mb-5" v-if="isInCheck"/>
        <PreviewOrderForConfirm class="mb-5" v-if="transactionStore.showPreviewOrder && transactionStore.typeOrder !== OrderTypes.COMPRA"/>
        <CurrencyStadistics />
        <KycUnverified class="mt-6"/>
    </div>
</template>

<script setup lang="ts">
import PreviewOrder from './PreviewOrder/PreviewOrder.vue'
import CurrencyStadistics from './CurrencyStadistics/CurrencyStadistics.vue'
import KycUnverified from './KycUnverified/KycUnverified.vue'
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import PreviewOrderForConfirm from './PreviewOrder/PreviewOrderForConfirm.vue';
import { TransactionStore } from '@/stores/TransactionStore'
import { OrderTypes } from '@/enums/OrderTypes.enum'
const kycAccept = localStorage.getItem('kyc')
const route = useRoute()
const transactionStore = TransactionStore()

const isInCheck = computed((): boolean =>{
    const urlCurrent = route.name?.toString() ?? ''
    return viewForPreviewOrder.includes(urlCurrent)
})
const viewForPreviewOrder = [
    'user-check-buy',
    'user-timeline',
    'user-check-sell'
]
</script>

<style scoped lang="scss"></style>
