<template>
  <VRow class="mt-3">
    <VCol
      v-for="(currency, i) in wallets"
      :key="currency.id ?? i"
      class="cursor-pointer"
      cols="12"
      :lg="$vuetify.display.width < 1400 ? 12 : 6"
      md="12"
      @click="emit(currency)"
    >
      <VHover v-slot="{ isHovering, props }">
        <VCard
          v-bind="props"
          style="min-height: 70; max-height: 70"
          class="h-100 rounded-lg pa-3 border-orange d-flex"
          :class="[
            isCurrencyBlocked(currency) ? 'opacity-60' : '',
            isHovering || modelValue?.id == currency.id ? 'bg-orange2' : '',
          ]"
          :style="{
            'background-color': getColorHover(isHovering, currency),
            border: `2px solid ${currency.attributes.color ?? 'black'}`,
          }"
        >
          <div class="w-100">
            <div
              :class="$vuetify.display.xs ? 'text-18' : 'text-20'"
              class="text-table w-100 d-flex justify-space-around align-center"
            >
              <div>{{ currency.attributes.name }}</div>
              <div>{{ getFormatPrice(currency) }}</div>
            </div>
            <div v-if="isCurrencyBlocked(currency)" class="text-caption mt-1 text-error">
              {{ currencyBlockedMessage(currency) }}
            </div>
            <div v-else-if="isCurrencyManual(currency)" class="text-caption mt-1 text-warning">
              Esta operacion sera revisada manualmente.
            </div>
          </div>
        </VCard>
      </VHover>
    </VCol>

    <VCol v-if="loading" cols="12">
      <VAlert type="info" variant="tonal">Cargando criptomonedas...</VAlert>
    </VCol>

    <VCol v-if="!loading && wallets.length === 0" cols="12">
      <VAlert type="warning" variant="tonal">
        No hay criptomonedas activas disponibles para esta operacion.
      </VAlert>
    </VCol>

    <VCol v-if="!loading && publicOperationsError" cols="12">
      <VAlert type="warning" variant="tonal">
        {{ publicOperationsError }}
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
import type { PublicCurrencyAvailability } from "@/interfaces/ControlCenter/ControlCenter.model";
import type { Currency } from "@/interfaces/Currency/Currency.model";
import type { CurrencyTicker } from "@/interfaces/Ticker/Ticker.model";
import { getPublicOperationsStatus } from "@/services/controlCenterApi";
import { tickerApi } from "@/services/tickerApi";
import { computed, onMounted, ref } from "vue";
import {
  currencyCodes,
  findTickerForCurrency,
  hasValidTickerPrice,
  isBuySellCurrency,
  normalizeCurrencyCode,
} from "@/utils/currencyTicker";

const helper = helperStore();

const loading = ref(false);
const currencies = ref<Currency[]>([]);
const tickers = ref<CurrencyTicker[]>([]);
const tickerError = ref("");
const publicCurrencies = ref<PublicCurrencyAvailability[]>([]);
const publicOperationsReady = ref(false);
const publicOperationsError = ref("");

const emits = defineEmits<(e: "update:model-value", value: Currency) => void>();

const props = defineProps<{
  modelValue: Currency | null;
  side?: "buy" | "sale";
}>();

const side = computed(() => props.side ?? "buy");

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

    return isBuySellCurrency(currency, side.value);
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

const loadPublicOperations = async () => {
  try {
    const response = await getPublicOperationsStatus();
    publicCurrencies.value = Array.isArray(response.data?.data?.currencies)
      ? response.data.data.currencies
      : [];
    publicOperationsReady.value = true;
    publicOperationsError.value = "";
  } catch {
    publicCurrencies.value = [];
    publicOperationsReady.value = false;
    publicOperationsError.value =
      "No fue posible verificar la disponibilidad operativa de las criptomonedas.";
  }
};

const loadData = async () => {
  loading.value = true;

  try {
    await Promise.all([loadCurrencies(), loadTicker(), loadPublicOperations()]);
  } finally {
    loading.value = false;
  }
};

const controlForCurrency = (
  currency: Currency,
): PublicCurrencyAvailability | null => {
  const codes = currencyCodes(currency).map((code) =>
    normalizeCurrencyCode(code).toUpperCase(),
  );

  return (
    publicCurrencies.value.find((item) =>
      codes.includes(normalizeCurrencyCode(item.currency).toUpperCase()),
    ) ?? null
  );
};

const isCurrencyBlocked = (currency: Currency): boolean => {
  if (!publicOperationsReady.value || publicOperationsError.value) return true;
  const control = controlForCurrency(currency);
  if (!control) return true;
  if (!control.enabled) return true;
  if (side.value === "buy" && !control.buy_enabled) return true;
  if (side.value === "sale" && !control.sell_enabled) return true;
  return false;
};

const isCurrencyManual = (currency: Currency): boolean => {
  return Boolean(controlForCurrency(currency)?.manual_mode);
};

const currencyBlockedMessage = (currency: Currency): string => {
  if (publicOperationsError.value) {
    return publicOperationsError.value;
  }

  if (!publicOperationsReady.value) {
    return "Estamos verificando la disponibilidad operativa para esta moneda.";
  }

  const control = controlForCurrency(currency);
  if (!control) return "Esta moneda no esta disponible en este momento.";
  if (control.public_message) return control.public_message;
  if (!control.enabled) return "Esta moneda esta temporalmente deshabilitada.";

  return side.value === "buy"
    ? "Las compras estan deshabilitadas para esta moneda."
    : "Las ventas estan deshabilitadas para esta moneda.";
};

const getTicker = (currency: Currency) => {
  return findTickerForCurrency(tickers.value, currency);
};

const emit = (currency: Currency) => {
  if (isCurrencyBlocked(currency)) {
    helper.showNotify(currencyBlockedMessage(currency), {
      type: "error",
    });
    return;
  }

  const ticker = getTicker(currency);
  const tickerSide = side.value === "sale" ? "sell" : "buy";

  if (!hasValidTickerPrice(ticker, tickerSide)) {
    helper.showNotify(
      "No hay tasa disponible para esta moneda. Intenta nuevamente mas tarde.",
      {
        type: "error",
      },
    );
    return;
  }

  emits("update:model-value", currency);
};

const getColorHover = (
  isHovering: boolean | null | undefined,
  currency: Currency,
) => {
  if (isHovering || props.modelValue?.id == currency.id) {
    return currency.attributes.color ?? "rgba(233, 182, 42, 0.274)";
  }
  return "";
};

const getFormatPrice = (currency: Currency) => {
  const ticker = getTicker(currency);
  const tickerSide = side.value === "sale" ? "sell" : "buy";

  if (!hasValidTickerPrice(ticker, tickerSide)) return "Sin tasa";

  return `${formatNumber(Number(ticker?.[tickerSide] ?? 0), ",", ".")} COP`;
};

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.border-orange {
  border: 2px solid orange;
}

.bg-orange2 {
  background-color: rgba(233, 182, 42, 0.274);
}
</style>
