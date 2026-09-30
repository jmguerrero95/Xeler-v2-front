<template>
    <div class="border-degree text-left text-18">
        <div>Tipo de transaccion:</div>
        <div>{{ order?.attributes.type }}</div>
        <div>Tipo de Pago:</div>
        <div>{{ order?.relationships?.payment.attributes.name }}</div>
        <div>Moneda:</div>
        <div>{{ order?.relationships?.currency.attributes.name }}</div>
        <div>Direccion de envio:</div>
        <div class="cursor-pointer w-100 pr-9 d-flex align-center justify-space-between" @click="openTool">
            <span class="w-100 text-break" style="font-size: 16px">{{ displayAddress || "-" }}</span>
            <copy-component v-if="displayAddress" :value="displayAddress" />
        </div>
        <template v-if="order?.attributes.crypto">
            <div>Crypto status:</div>
            <div>
                <VChip :color="cryptoStatusColor(order.attributes.crypto.status)" size="small" variant="tonal">
                    {{ cryptoStatusLabel(order.attributes.crypto.status) }}
                </VChip>
            </div>
            <div>Provider / red:</div>
            <div>{{ order.attributes.crypto.provider || "-" }} / {{ order.attributes.crypto.network || "-" }}</div>
            <div>Confirmaciones:</div>
            <div>{{ order.attributes.crypto.confirmations ?? 0 }} / {{ getCryptoRequiredConfirmations(order.attributes.crypto) || "-" }}</div>
            <div v-if="cryptoTxid">TxID:</div>
            <div v-if="cryptoTxid" class="d-flex align-center justify-space-between">
                <span class="text-truncate" style="max-width: 260px">{{ cryptoTxid }}</span>
                <copy-component :value="cryptoTxid" />
            </div>
        </template>
        <div>
            Cantidad:
            <div class="d-inline-block float-end">
                {{
                    formatNumber(
                        parseFloat(
                            order?.relationships?.currencyExchangeOrder
                                .attributes.total_exchange_local!
                        )
                    )
                }}
                COP
            </div>
        </div>

        <div v-if="order?.attributes.type == OrderTypes.COMPRA">
            Comision:
            <div class="d-inline-block float-end">
                {{ formatNumber(parseFloat(order?.attributes.fee!)) }} USD
            </div>
            <div class="my-3 d-flex justify-center align-center" style="gap:5px">
                <VImg
                    inline
                    v-if="itemHaveImages(order?.relationships?.currency.relationships?.images)"
                    :src="(itemHaveImages(order?.relationships?.currency.relationships?.images) as string)"
                    height="30"
                />
                <div class="font-weight-bold" style="font-size: 30px">
                    {{ formatCrypoAmount(order?.attributes.amount_currency as string) }}
                    {{ order?.relationships?.currency.attributes.abbreviation.toLocaleUpperCase() }}
                </div>
            </div>
        </div>
        <div v-if="order?.attributes.type == OrderTypes.VENTA && showDetailAmount">
            <div>
                Titular:
                <div class="d-inline-block float-end">
                    {{ beneficiary?.beneficiary_name || "-" }}
                </div>
            </div>
            <div>
                Documento:
                <div class="d-inline-block float-end">
                    {{ beneficiary?.beneficiary_document_masked || "-" }} <br />
                </div>
            </div>
            <div>
                Numero de Cuenta:
                <div class="d-inline-block float-end">
                    {{ beneficiary?.account_number_masked || "-" }}
                </div>
            </div>
            <div>
                Banco:
                <div class="d-inline-block float-end">
                    <span v-if="beneficiary?.bank_name">
                        {{ beneficiary.bank_name }}
                    </span>
                </div>
            </div>
            <div>
                Tipo Cuenta:
                <div class="d-inline-block float-end">
                    {{ beneficiary?.account_type || "-" }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { OrderTypes } from "@/enums/OrderTypes.enum";
import CopyComponent from "@/components/CopyComponent.vue";
import { copyToClipboard, formatCrypoAmount, formatNumber, itemHaveImages } from "@/helper";
import { cryptoStatusColor, cryptoStatusLabel, getCryptoRequiredConfirmations } from "@/utils/crypto";
import { TransactionStore } from "@/stores/TransactionStore";
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";

defineProps<{
    showDetailAmount?: boolean
}>();

const transacionStore = TransactionStore();
const { order } = storeToRefs(transacionStore);
const tooltip = ref(false);

const displayAddress = computed(() => {
    return order.value?.attributes.crypto?.address ?? order.value?.attributes.address_send ?? "";
});
const beneficiary = computed(() => order.value?.attributes.payment_account_snapshot ?? null);

const cryptoTxid = computed(() => {
    return order.value?.attributes.crypto?.txid ?? order.value?.attributes.crypto?.transactions?.[0]?.txid ?? "";
});

const openTool = () => {
    tooltip.value = true;
    if (displayAddress.value) {
        copyToClipboard(displayAddress.value);
    }
};

watch(tooltip, (nuevo) => {
    if (nuevo === true) {
        const intervalToolTip = setInterval(() => {
            tooltip.value = false;
            clearInterval(intervalToolTip);
        }, 3000);
    }
});

</script>

<style scoped lang="scss">
@use "@/scss/variables.scss" as *;
.border-degree {
    >div {
        padding-left: 14px;
        padding-right: 14px;
    }
    > div:first-child {
        border-top-left-radius: 20px;
        border-top-right-radius: 20px;
    }
    > div:nth-child(odd) {
        color: $color-primary;
        background-color: $backgound-table-odd;
    }
    > div:nth-child(even) {
        color: $color-gray-dark;
    }
}
</style>
