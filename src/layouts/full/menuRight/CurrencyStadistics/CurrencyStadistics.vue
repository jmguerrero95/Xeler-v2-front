<template>
  <div class="rounded-xl color-border-degree">
    <div class="w-100 text-center">
      <label
        for="currency-input"
        class="mx-auto bg-white px-4 text-primary font-weight font-22"
      >
        Valores basados en TRM
      </label>
      <input id="currency-input" type="hidden" />
      <h4 v-if="coins.length == 0" class="ticker-empty pa-4">
        No hay información de tasas disponible en este momento.
      </h4>
      <div v-for="(coin, i) in coins" :key="i">
        <div
          class="d-flex text-left text-table justify-space-around px-3 py-4 align-center"
        >
          <VImg :src="coin.icon" width="18px" inline />
          <div class="" style="width: 80px">
            <span class="text-18 ml-2 text-capitalize"> {{ coin.name }}</span>
          </div>
          <div class="d-inline-block align-center" style="width: 100px">
            <VBtn
              elevation="0"
              size="small"
              :flat="false"
              style="width: 24px !important; height: 24px"
              class="rounded"
              :class="`bg-${colors[coin.band]}`"
              icon
            >
              <VIcon
                icon="mdi-arrow-down"
                :class="`arrow-${colors[coin.band]}`"
                :style="`
                transform: rotate(${orientationArrow[coin.band]}deg);`"
              >
              </VIcon>
            </VBtn>
            <span
              class="font-weight-light mt-0 pt-0 ml-3 font-15"
              :class="`text-${colorsText[coin.band]}`"
            >
              {{ coin.porcent }} %
            </span>
          </div>
          <div
            class="text-left d-inline-block text-primary ml-1 font-15"
            style="width: 130px"
          >
            <span>COP {{ formatNumber(coin.value) }}</span>
          </div>
        </div>
        <VDivider v-if="coins.length - 1 > i" />
      </div>
      <VDivider />
      <div class="d-flex justify-center align-center py-2">
        <div
          class="text-table-2 text-center text-caption font-weight-light px-0 mx-0"
        >
          <p
            style="
              font-size: 11px;
              white-space: break-spaces;
              line-height: 0.8rem;
            "
          >
            Ultima actualizacion: {{ dateQueryTicker }}
            <br />
            Valor Aproximado basado en TRM
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { formatNumber } from "@/helper";
import { WalletStore } from "@/stores/WalletStore";
import { storeToRefs } from "pinia";

const walletStore = WalletStore();
walletStore.getCurrencies();
walletStore.getCurrencyTicker();

const { coins, dateQueryTicker } = storeToRefs(walletStore);
const { colors, colorsText, orientationArrow } = walletStore;
let interval: ReturnType<typeof setInterval> | undefined;
const bool = ref(false);

onMounted(() => {
  // coins.value = setCoins()

  interval = setInterval(async () => {
    await walletStore.getCurrencies();
    await walletStore.getCurrencyTicker();
    // coins.value = setCoins()
    bool.value = !bool.value;
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
.ticker-empty { color:#344054; background:#f2f4f7; border-radius:10px; margin:12px; }
</style>
