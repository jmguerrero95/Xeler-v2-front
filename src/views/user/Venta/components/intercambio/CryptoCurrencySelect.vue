<template>
  <VRow class="mt-3">
    <VCol
      class="cursor-pointer"
      cols="12"
      sm="6"
      lg="6"
      md="12"
      v-for="(currency, i) in wallets"
      :key="currency.id ?? i"
      @click="emit(currency)"
    >
      <VHover v-slot="{ isHovering, props }">
        <VCard
          v-bind="props"
          style="min-height: 70; max-height: 70"
          class="h-100 rounded-lg pa-3 border-orange d-flex"
          :class="[isHovering || modelValue?.id == currency.id ? 'bg-orange2 ' : '']"
          :style="{
            'background-color': getColorHover(isHovering, currency),
            border: `2px solid ${currency.attributes.color ?? 'black'}`,
          }"
        >
          <VRow class="font-weight-bold text-table">
            <VCol class="my-auto">
              <VImg
                v-if="getImageCurrency(currency)"
                :src="getImageCurrency(currency) as string"
                width="40"
              />
              <VIcon v-else icon="mdi-bitcoin" size="40" />
            </VCol>

            <VCol class="my-auto">
              {{ currency.attributes.name }}
            </VCol>

            <VCol class="my-auto">
              {{ getFormatPrice(currency) }}
            </VCol>
          </VRow>
        </VCard>
      </VHover>
    </VCol>

    <VCol v-if="loading" cols="12">
      <VAlert type="info" variant="tonal">Cargando criptomonedas...</VAlert>
    </VCol>

    <VCol v-if="!loading && wallets.length === 0" cols="12">
      <VAlert type="warning" variant="tonal">
        No hay criptomonedas activas disponibles para vender.
      </VAlert>
    </VCol>

    <VCol v-if="!loading && tickerError" cols="12">
      <VAlert type="warning" variant="tonal">
        {{ tickerError }}
        <VBtn class="ml-2" size="small" variant="text" @click="loadTicker">
          Reintentar
        </VBtn>
      </VAlert>
    </VCol>
  </VRow>
</template>

<script setup lang="ts">
import { helperStore, formatNumber } from "@/helper";
import type { Currency } from "@/interfaces/Currency/Currency.model";
import type { CurrencyTicker } from "@/interfaces/Ticker/Ticker.model";
import { tickerApi } from "@/services/tickerApi";
import { computed, onMounted, ref } from "vue";
import {
  findTickerForCurrency,
  hasValidTickerPrice,
  isBuySellCurrency,
} from "@/utils/currencyTicker";

const helper = helperStore();

const loading = ref(false);
const currencies = ref<Currency[]>([]);
const tickers = ref<CurrencyTicker[]>([]);
const tickerError = ref("");

const emits = defineEmits<{
  (e: "update:model-value", value: Currency): void;
}>();

const props = defineProps<{
  modelValue: Currency | null;
}>();

const normalize = (value: unknown): string =>
  String(value ?? "").trim().toLowerCase();

const isTestCurrency = (currency: Currency): boolean => {
  const abbreviation = normalize(currency.attributes?.abbreviation);
  const symbol = normalize(currency.attributes?.symbol);
  const name = normalize(currency.attributes?.name);

  return (
    ["tbtc", "tdash"].includes(abbreviation) ||
    ["tbtc", "tdash"].includes(symbol) ||
    name.includes("test")
  );
};

const wallets = computed((): Currency[] => {
  return currencies.value.filter((currency) => {
    if (!currency?.attributes) return false;
    if (currency.attributes.deleted_at) return false;
    if (isTestCurrency(currency)) return false;

    return isBuySellCurrency(currency, "sale");
  });
});

const loadCurrencies = async () => {
  const response = await helper.http("currency", "get", {
    params: { type_currency: "crypto" },
  });

  currencies.value = Array.isArray(response.data?.response)
    ? response.data.response
    : [];
};

const loadTicker = async () => {
  try {
    tickerError.value = "";
    tickers.value = await tickerApi.getRates();
    if (tickers.value.length === 0) {
      tickerError.value = "No hay tasas disponibles en este momento.";
    }
  } catch {
    tickers.value = [];
    tickerError.value = "No fue posible consultar las tasas.";
  }
};

const loadData = async () => {
  loading.value = true;

  try {
    await Promise.all([loadCurrencies(), loadTicker()]);
  } finally {
    loading.value = false;
  }
};

const getTicker = (currency: Currency) => {
  return findTickerForCurrency(tickers.value, currency);
};

const emit = (currency: Currency) => {
  const ticker = getTicker(currency);

  if (!hasValidTickerPrice(ticker)) {
    helper.showNotify("No hay tasa disponible para esta moneda. Intenta nuevamente más tarde.", {
      type: "error",
    });
    return;
  }

  emits("update:model-value", currency);
};

const getImageCurrency = (currency: Currency): string | boolean => {
  if (currency.relationships?.images?.length == 0) return false;
  return currency.relationships?.images?.[0]?.attributes.aws_url ?? false;
};

const getColorHover = (
  isHovering: boolean | null | undefined,
  currency: Currency
) => {
  if (isHovering || props.modelValue?.id == currency.id) {
    return currency.attributes.color ?? "rgba(233, 182, 42, 0.274)";
  }
  return "";
};

const getFormatPrice = (currency: Currency) => {
  const ticker = getTicker(currency);

  if (!hasValidTickerPrice(ticker)) return "Sin tasa";

  return "COP " + formatNumber(Number(ticker?.oficial ?? 0), ",", ".");
};

onMounted(loadData);
</script>

<style scoped lang="scss">
.border-orange {
  border: 2px solid orange;
}

.bg-orange2 {
  background-color: rgba(233, 182, 42, 0.274);
}
</style>
