<template>
    <div class="border-degree text-table">
        <div class="my-2">
            <div class="d-flex justify-space-around">
                <div>Total a Pagar:</div>
                <div>{{ formatNumber(parseFloat(order?.relationships?.currencyExchangeOrder.attributes.total_exchange_local!)) }}</div>
                <div>
                    <copy-component :value="parseFloat(order?.relationships?.currencyExchangeOrder.attributes.total_exchange_local!)" />
                </div>
            </div>
            <div class="d-flex justify-center align-center" style="gap: 20px">
                <div>
                    <VImg
                        v-if="itemHaveImages(order?.relationships?.currency.relationships?.images)"
                        :src="(itemHaveImages(order?.relationships?.currency.relationships?.images) as string)"
                        height="30"
                    />
                </div>
                <div class="font-weight-bold" style="font-size: 30px">
                    {{ formatCrypoAmount(order?.attributes.amount_currency as string) }}
                    <span>{{ order?.relationships?.currency.attributes.abbreviation.toLocaleUpperCase() }}</span>
                </div>
                <div v-if="verifyCompatibilityShareInNav()" class="cursor-pointer" @click="shareInNav(contentShare)">
                    <VIcon title="Compartir" color="primary" :icon="ShareIcon" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatNumber, formatCrypoAmount, itemHaveImages, verifyCompatibilityShareInNav, shareInNav } from "@/helper";
import { TransactionStore } from "@/stores/TransactionStore";
import { storeToRefs } from "pinia";
import CopyComponent from "@/components/CopyComponent.vue";
import ShareIcon from "@/assets/icons/ShareIcon.vue";

const transactionStore = TransactionStore();
const { order } = storeToRefs(transactionStore);
const beneficiary = computed(() => order.value?.attributes.payment_account_snapshot ?? null);
const contentShare = computed<ShareData>(() => ({
    title: `Transaccion: ${order.value?.attributes.tranx_no ?? ""}`,
    text: `
    Transaccion: ${order.value?.attributes.tranx_no ?? "-"}
    Titular: ${beneficiary.value?.beneficiary_name ?? "-"}
    Documento: ${beneficiary.value?.beneficiary_document_masked ?? "-"}
    Numero de Cuenta: ${beneficiary.value?.account_number_masked ?? "-"}
    Banco: ${beneficiary.value?.bank_name ?? "-"}
    Tipo Cuenta: ${beneficiary.value?.account_type ?? "-"}
    Total a Pagar: ${order.value?.relationships?.currencyExchangeOrder.attributes.total_exchange_local ?? "-"} COP
    Crypto: ${order.value?.relationships?.currency.attributes.abbreviation.toUpperCase() ?? "-"}
    Total Crypto: ${order.value?.attributes.amount_currency ?? "-"}
    `,
}));
</script>

<style scoped></style>
