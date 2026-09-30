<template>
    <VCard
        v-if="transactionStore.order"
        class="border-degree d-flex flex-column"
       
    >
        <div
            class="mt-5 mb-0 text-center text-primary mx-0 pb-0 px-0 font-weight-bold"
            style="font-size:23px"
        >
            {{ $t("views.menu-right.preview-order.title") }}
        </div>
        <VCardText
            class="px-3 my-auto text-left text-table font-weight-light"
            :style="{
                'font-size': $vuetify.display.smAndDown ? '17px' : '20px'
            }"
        >
            <div class="my-6 d-flex" style="justify-content: space-between">
                <span class="font-weight-regular">Cantidad:</span>
                <span class="">
                    {{ transactionStore.order!.attributes.amount_currency }}
                    {{
                        transactionStore.order!.relationships!.currency.attributes.abbreviation.toLocaleUpperCase()
                    }}
                </span>
            </div>
            <div
                v-if="
                    transactionStore.order.attributes.type == OrderTypes.COMPRA
                "
                class="my-6 d-flex"
                style="justify-content: space-between"
            >
                <span class="font-weight-regular">Pesos:</span>
                <span class="">
                    {{
                        formatNumber(
                            parseFloat(
                                transactionStore.order!.relationships!
                                    .currencyExchangeOrder.attributes
                                    .total_exchange_local
                            )
                        )
                    }}
                    {{
                        transactionStore.order!.relationships!
                            .currencyExchangeOrder.relationships?.localCurrency
                            .attributes.abbreviation
                    }}
                </span>
            </div>
            <div class="my-6 d-flex" style="justify-content: space-between">
                <span class="font-weight-regular">Doláres:</span>
                <div class="align-center justify-center d-flex">
                    <v-tooltip text="Valor Apróximado">
                        <template v-slot:activator="{ props }">
                            <VIcon
                                v-bind="props"
                                class="mt-0 pt-0 mr-1"
                                size="20"
                                :icon="InformationIcon"
                                color="primary"
                            />
                        </template>
                    </v-tooltip>
                    <span class="">
                        {{
                            transactionStore.order.relationships
                                ?.currencyExchangeOrder.attributes
                                .total_exchange_reference
                        }}
                        USD
                    </span>
                </div>
            </div>
            <div
                v-if="
                    transactionStore.order.attributes.type == OrderTypes.COMPRA
                "
                class="my-6 d-flex"
                style="justify-content: space-between"
            >
                <span class="font-weight-regular">Costo de red:</span>
                <span v-if="transactionStore.order.attributes.fee_asset === 'COP'">
                    {{ transactionStore.order.attributes.fee_mining_cop }} COP
                </span>
                <span v-else>
                    {{ transactionStore.order.attributes.network_fee_crypto ?? transactionStore.order.attributes.fee }}
                    {{ transactionStore.order.attributes.fee_asset }}
                </span>
            </div>
            <div
                v-if="
                    transactionStore.order?.attributes.administrative_fee_order
                "
                class="my-6 d-flex"
                style="justify-content: space-between"
            >
                <span class="font-weight-regular">Fee administrativo:</span>
                <div class="align-center justify-center d-flex">
                    <v-tooltip text="Comisión por monto menor al mínimo">
                        <template v-slot:activator="{ props }">
                            <VIcon
                                v-bind="props"
                                class="mt-0 mr-1 pt-0"
                                :icon="QuestionIcon"
                                color="primary"
                                size="20"
                            />
                        </template>
                    </v-tooltip>
                    <span class="">
                        {{
                            formatNumber(
                                Number(
                                    transactionStore.order?.attributes
                                        .administrative_fee_order ?? 0
                                )
                            )
                        }} COP
                    </span>
                </div>
            </div>
            <div
                v-if="
                    transactionStore.order.attributes.type == OrderTypes.VENTA
                "
                class="my-6 d-flex "
                style="justify-content: space-between"
            >
                <span class="font-weight-regular">Pesos a Recibir:</span>
                <span class="">
                    {{
                        formatNumber(
                            parseFloat(
                                transactionStore.order.relationships
                                    ?.currencyExchangeOrder.attributes
                                    .total_exchange_local!
                            )
                        )
                    }}
                    COP
                </span>
            </div>
        </VCardText>
        <VCardActions class="bg-primary text-white py-4 "
            >
            <VImg
                v-if="
                    (transactionStore.order.relationships?.currency.relationships
                        ?.images?.length ?? 0 > 0) && transactionStore.order.attributes.type != OrderTypes.COMPRA
                "
                :src="transactionStore.order.relationships?.currency.relationships?.images?.[0]?.attributes.aws_url ?? undefined"
                width="60"
                height="60"
            >
            </VImg>
            <VIcon v-else-if="!(transactionStore.order.relationships?.currency.relationships
            ?.images?.length ?? 0 > 0) && transactionStore.order.attributes.type != OrderTypes.COMPRA" :icon="BtcIcon" size="60" />
            <p class="text-h5 font-weight-bold ml-4" v-if="transactionStore.order.attributes.type == OrderTypes.VENTA">
                {{ transactionStore.order!.attributes.amount_currency }}
                {{
                    transactionStore.order!.relationships!.currency.attributes.abbreviation.toLocaleUpperCase()
                }}
            </p>
            <p class="text-h5 font-weight-bold ml-4" 
            :class="transactionStore.order.attributes.type == OrderTypes.COMPRA ? 'text-center w-100': ''"
            v-if="transactionStore.order.attributes.type == OrderTypes.COMPRA">
                {{
                    formatNumber(
                        parseFloat(
                            transactionStore.order!.relationships!
                                .currencyExchangeOrder.attributes
                                .total_exchange_local
                        )
                    )
                }}
                {{
                    transactionStore.order!.relationships!
                        .currencyExchangeOrder.relationships?.localCurrency
                        .attributes.abbreviation
                }}
            </p>
        </VCardActions>
    </VCard>
</template>

<script setup lang="ts">
import { TransactionStore } from "@/stores/TransactionStore";
import BtcIcon from "@/views/Home/PricingCards/BtcIcon.vue";
import { formatNumber } from "@/helper";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import InformationIcon from "@/assets/icons/InformationIcon.vue";
import QuestionIcon from "@/assets/icons/QuestionIcon.vue";
const transactionStore = TransactionStore();

const props = defineProps<{
    height?: string;
}>();
</script>

<style scoped></style>
