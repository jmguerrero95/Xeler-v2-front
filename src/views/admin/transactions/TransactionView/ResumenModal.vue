<template>
    <dialog-global
        :dialog="modal"
        @close-dialog="modal = false"
        width-dialog="450px"
        class-title="text-center text-primary"
    >
        <template #title>
            Transacción: {{ order?.attributes.tranx_no }}
        </template>
        <payment-detail showDetailAmount></payment-detail>
        <div v-if="order?.attributes.type == OrderTypes.VENTA" class="mt-3">
            <!-- <DetailAccountSell /> -->
            <AmountDetail  />
        </div>
        <div class="d-flex justify-center align-center mt-5">
            <div style="width: 130px;">

                <QrcodeVue
                    foreground="#5043E8"
                    :value="getDataForQr()"
                    render-as="svg"
                    :size="130"
                >
                </QrcodeVue>
                <p class="text-center text-primary font-weight-bold" style="font-size: 13px;">Click en el qr para abrir en tu wallet</p>
            </div>
        </div>
    </dialog-global>
</template>

<script setup lang="ts">
import DetailAccountSell from "../TransactionDetail/DetailAccountSell.vue";
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import PaymentDetail from "@/views/admin/transactions/TransactionDetail/PaymentDetail.vue";
import type { Order } from "@/interfaces/Order/Order.model";
import { TransactionStore } from "@/stores/TransactionStore";
import { ref } from "vue";
import QrcodeVue from "qrcode.vue";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import AmountDetail from "../TransactionDetail/AmountDetail.vue";
import { OrderTypes } from "@/enums/OrderTypes.enum";

const emits = defineEmits<{
    (e:'update:model-value',value: boolean):void
}>()
const props = defineProps<{
    order: Order;
    modelValue: boolean
}>();

const modal = ref(props.modelValue);

watch(modal, () => {
    emits('update:model-value', modal.value)
})
const transactionStore = TransactionStore();
const { order } = storeToRefs(transactionStore);
order.value = props.order;
const getDataForQr = () => {
    return transactionStore.getDataForQr(
        order.value?.relationships?.currency.attributes.name!,
        order.value?.attributes.address_send!,
        order.value?.attributes.amount_currency as string
    );
};
</script>

<style scoped></style>
