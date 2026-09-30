<template>
    <VRow dense class="d-flex gap-2">
        <div v-if="!isMobile" class="mx-0 px-0 d-flex gap-2 flex-wrap" style="width: 830px;">
            <!-- <VRow dense> -->
                <div
                    cols="4"
                    sm="4"
                    lg="3"
                    v-for="(coin, i) in coins"
                    :key="i"
                >
                    <VCard
                        elevation="5"
                        class=""
                        style="width: 220px; height: 220px"
                    >
                        <VCardText class="px-1 py-4">
                            <div class="px-2">
                                <div dense class="d-flex justify-space-around">
                                    <VImg
                                        inline
                                        width="50"
                                        :src="coin.icon"
                                    ></VImg>
                                    <div
                                        class="mx-0 pl-1 d-flex justify-space-between"
                                    >
                                        <div class="mr-4 text-20" style="line-height: 20px;">
                                            <p
                                                class="font-weight-bold text-dark text-capitalize ma-0"
                                                >{{ coin.name }}</p
                                            >
                                            <p
                                                class="text-table font-weight-light ma-0"
                                                >{{
                                                    coin.abbreviation.toLocaleUpperCase()
                                                }}</p
                                            >
                                        </div>
                                        <div
                                            elevation="0"
                                            style="
                                                width: 24px !important;
                                                height: 24px;
                                            "
                                            class="rounded d-flex justify-center align-center"
                                            color="light"
                                            :class="`bg-${colors[coin.band]}`"
                                            icon
                                        >
                                            <VIcon
                                                icon="mdi-arrow-down"
                                                :color="`${colors[coin.band]}`"
                                                :style="`
                                                transform: rotate(${
                                                    orientationArrow[coin.band]
                                                }deg);
                                            `"
                                            >
                                            </VIcon>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="pl-4 mt-6">
                                <!-- <div dense> -->
                                    <div
                                        class="font-22 text-table-2 font-weight-bold mb-0 pb-0"
                                    >
                                        <!--COP <br v-if="formatNumber(coin.value,',','.',0).length <= 7"> {{ formatNumber(coin.value,',','.',0) }}-->
                                        COP {{ formatNumber(coin.value,',','.',0) }}
                                    </div>
                                    <div
                                        class="font-weight-light mt-0 pt-1 text-20"
                                        :class="`text-${colorsText[coin.band]}`"
                                    >
                                        {{ coin.porcent }} %
                                    </div>
                                <!-- </div> -->
                            </div>
                        </VCardText>
                        <div class="d-flex justify-center align-center ma-0 pa-0">
                                <div class="text-table-2 text-center text-caption font-weight-light px-0 mx-0">
                                    <p
                                        style="
                                            font-size: 10px;
                                            white-space: break-spaces;
                                            line-height: 0.8rem;
                                        "
                                    >
                                        Ultima actualizacion: <br>{{
                                            dateQueryTicker
                                        }}
                                        <br />
                                        Valor Aproximado basado en TRM
                                    </p>
                            </div>
                        </div>
                    </VCard>
                </div>
            <!-- </VRow> -->
        </div>
        <div
            class="h-100"
            :style="`width: ${isMobile ? 340 : 360}px`"

        >
            <CalculatorComponent
                class="mx-auto"
            >
            </CalculatorComponent>
        </div>
    </VRow>
</template>

<script setup lang="ts">
import BtcIcon from "@/assets/images/home/BtcIcon.png";
import { formatNumber } from "@/helper";
import CalculatorComponent from "./PricingCards/CalculatorComponent.vue";
import { useDisplay } from "vuetify";
import { WalletStore } from "@/stores/WalletStore";
import { ref, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";


const walletStore = WalletStore();
const { dateQueryTicker, coins } = storeToRefs(walletStore);
const { colors, colorsText, orientationArrow } = walletStore;
const { smAndDown: isMobile, xs } = useDisplay();
let interval: any;

onMounted(() => {
    // coins.value = setCoins()
    walletStore.getCurrencies();
    walletStore.getCurrencyTicker();
    interval = setInterval(async () => {
        await walletStore.getCurrencies();
        await walletStore.getCurrencyTicker();
        // coins.value = setCoins()
        // bool.value = !bool.value
    }, 60000);
});

onUnmounted(() => {
    clearInterval(interval);
});
</script>

<style scoped lang="scss">
@use "@/scss/variables.scss" as *;

.border-primary {
    border: 2px solid;
    border-color: $color-primary;
}
.bg-down-2 {
    background-color: #ff707033 !important;
}

.arrow-down-2 {
    color: #ff7070 !important;
}

.bg-same {
    background-color: #d3c9c933 !important;
}

.arrow-same {
    color: #3d3d3c !important;
}

.bg-up {
    background-color: #95ff7033 !important;
}

.arrow-up {
    color: #2b5517 !important;
}
</style>
