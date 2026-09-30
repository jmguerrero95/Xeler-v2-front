<template>
  <VRow class="d-flex justify-center">
    <VCol>
      <div :class="$vuetify.display.xs ? '' : 'd-flex justify-center'">
        <div
          data-test="fiat-amount-input"
          style="width: 170px"
          class="text-table"
          :class="$vuetify.display.xs ? 'mx-auto' : ''"
        >
          <TextTareaComponent
            v-model="amountFiat"
            inputmode="numeric"
            :events="eventsFiat"
            :rules="[onlyNumbers]"
            name=""
            appendText="COP"
          />
        </div>
        <div class="my-auto mx-3 pt-6 text-center" cols="1" style="font-size: 1.5rem">
          <div
            :class="$vuetify.display.xs ? 'mx-auto' : ''"
            class="border-degree"
            style="border-radius: 100% !important; width: 35px; height: 35px"
          >
            =
          </div>
        </div>
        <div
          data-test="crypto-amount-input"
          style="width: 170px"
          :class="$vuetify.display.xs ? 'mx-auto' : ''"
        >
          <TextTareaComponent
            v-model="amountCrypto"
            :events="eventsCrypto"
            :rules="[onlyNumbers]"
            :disabled="disableCrypto"
            inputmode="numeric"
            name=""
            :appendText="priceSelect?.symbol"
          />
        </div>
      </div>
      <div class="w-100 mt-10 text-center font-weight-bold text-table">
        {{ calculadora.amountCrypto }}
        {{ priceSelect?.symbol }} equivalente aproximado a
        {{ calculadora.amountUsd }} USD
      </div>

      <div v-if="validationForLimit" class="w-100 text-center font-weight-bold text-error">
        Transaccion minima {{ formatDecimalForDisplay(minAmount, 0) }} COP
      </div>
    </VCol>
  </VRow>
</template>

<script setup lang="ts">
import TextTareaComponent from "@/components/TextTareaComponent.vue";
import type { EventComponent } from "@/interfaces/Components.helper";
import type { Currency } from "@/interfaces/Currency/Currency.model";
import type { Calculator } from "@/interfaces/Calculadora.interface";
import type { CurrencyTicker } from "@/interfaces/Ticker/Ticker.model";
import { WalletStore } from "@/stores/WalletStore";
import {
  compareDecimalStrings,
  divideDecimalStrings,
  formatDecimalForDisplay,
  multiplyDecimalStrings,
  normalizeDecimalStrict,
  normalizeUnsignedDecimalInput,
} from "@/utils/decimal";
import { hasValidTickerPrice, tickerPriceForSide } from "@/utils/currencyTicker";
import { onlyNumbers } from "@/validator";
import { computed, reactive, ref, watch } from "vue";

const walletStore = WalletStore();

const props = defineProps<{
  currency: Currency;
  modelValue: Calculator;
  minAmount: string;
  side?: "buy" | "sale";
  paymentTypeId?: string | number | null;
}>();

const emits = defineEmits<{
  (e: "update:model-value", value: Calculator): void;
  (e: "noPrice"): void;
  (e: "amountPermitted", value: boolean): void;
  (e: "montoFiat", value: string): void;
}>();

const validationForLimit = computed(() =>
  compareDecimalStrings(calculadora.amountFiat, props.minAmount) < 0,
);

const calculadora = reactive<Calculator>({
  amountFiat: "0",
  amountCrypto: "0",
  amountUsd: "0",
  tasaCompra: "0",
  tasaVenta: "0",
  criptoOficial: "0",
  localOficial: "0",
  inputSide: props.side === "sale" ? "crypto" : "fiat",
});

const isNumericKey = (key: string): boolean => /[\d.,]/.test(key);

const eventsFiat: EventComponent = {
  keypress: (event: KeyboardEvent) => {
    if (!isNumericKey(event.key) && event.key !== "Backspace") {
      event.preventDefault();
    }
  },
  input: (event: Event) => {
    lastEditedSide.value = "fiat";
    amountFiat.value = normalizeUnsignedDecimalInput(
      (event.target as HTMLInputElement).value,
      2,
    );
    updateCrypto();
  },
};

const eventsCrypto: EventComponent = {
  keypress: (event: KeyboardEvent) => {
    if (!isNumericKey(event.key) && event.key !== "Backspace") {
      event.preventDefault();
    }
  },
  input: (event: Event) => {
    lastEditedSide.value = "crypto";
    amountCrypto.value = normalizeUnsignedDecimalInput(
      (event.target as HTMLInputElement).value,
      currencyScale.value,
    );
    updateFiat();
  },
};

const priceSelect = ref<CurrencyTicker | null>(null);
const oficialValue = ref("0");
const disableCrypto = ref(true);
const currencyScale = computed(() => Math.max(0, Math.min(props.currency.attributes.decimal_scale ?? 8, 18)));
const lastEditedSide = ref<"fiat" | "crypto">(props.side === "sale" ? "crypto" : "fiat");
const recalculateFromLastEditedSide = () => {
  if (lastEditedSide.value === "crypto" && !disableCrypto.value) {
    updateFiat();
    return;
  }
  updateCrypto();
};

const loadPrices = () => {
  priceSelect.value = walletStore.getCurrencyTickerForCurrency(props.currency);
  const tickerSide = props.side === "sale" ? "sell" : "buy";
  const price = tickerPriceForSide(priceSelect.value, tickerSide, props.paymentTypeId);

  disableCrypto.value = price === null;

  if (!hasValidTickerPrice(priceSelect.value, tickerSide) || price === null) {
    emits("noPrice");
    emits("amountPermitted", false);
    return;
  }

  calculadora.criptoOficial = normalizeDecimalStrict(priceSelect.value?.oficial ?? "0");
  calculadora.localOficial = calculadora.criptoOficial;
  oficialValue.value = divideDecimalStrings(
    calculadora.criptoOficial,
    normalizeDecimalStrict(priceSelect.value?.trm ?? "1"),
    8,
  );
  calculadora.tasaCompra = tickerSide === "buy" ? normalizeDecimalStrict(price) : "0";
  calculadora.tasaVenta = tickerSide === "sell" ? normalizeDecimalStrict(price) : "0";
};

const amountFiat = ref("0");
const amountCrypto = ref("0");

const updateCrypto = () => {
  const tickerSide = props.side === "sale" ? "sell" : "buy";
  const price = tickerPriceForSide(priceSelect.value, tickerSide, props.paymentTypeId);

  if (!hasValidTickerPrice(priceSelect.value, tickerSide) || price === null) {
    emits("noPrice");
    emits("amountPermitted", false);
    return;
  }

  const montoFiat = normalizeDecimalStrict(amountFiat.value || "0");
  const montoCrypto = divideDecimalStrings(montoFiat, normalizeDecimalStrict(price), currencyScale.value);

  calculadora.amountFiat = montoFiat;
  calculadora.amountCrypto = montoCrypto;
  calculadora.inputSide = lastEditedSide.value;
  calculadora.amountUsd = multiplyDecimalStrings(montoCrypto, oficialValue.value, 2);
  amountCrypto.value = montoCrypto;

  emits("montoFiat", montoFiat);
  emits("update:model-value", { ...calculadora });
};

const updateFiat = () => {
  const tickerSide = props.side === "sale" ? "sell" : "buy";
  const price = tickerPriceForSide(priceSelect.value, tickerSide, props.paymentTypeId);

  if (!hasValidTickerPrice(priceSelect.value, tickerSide) || price === null) {
    emits("noPrice");
    emits("amountPermitted", false);
    return;
  }

  const montoCrypto = normalizeDecimalStrict(amountCrypto.value || "0");
  const montoFiat = multiplyDecimalStrings(montoCrypto, normalizeDecimalStrict(price), 2);

  calculadora.amountCrypto = montoCrypto;
  calculadora.amountFiat = montoFiat;
  calculadora.inputSide = lastEditedSide.value;
  calculadora.amountUsd = multiplyDecimalStrings(montoCrypto, oficialValue.value, 2);
  amountFiat.value = montoFiat;

  emits("montoFiat", montoFiat);
  emits("update:model-value", { ...calculadora });
};

watch(
  () => props.currency.id,
  () => {
    loadPrices();
    recalculateFromLastEditedSide();
  },
  { immediate: true },
);

watch(
  () => props.paymentTypeId,
  () => {
    loadPrices();
    recalculateFromLastEditedSide();
  },
);

watch(
  () => props.side,
  (side) => {
    lastEditedSide.value = side === "sale" ? "crypto" : "fiat";
    calculadora.inputSide = lastEditedSide.value;
    recalculateFromLastEditedSide();
  },
);

watch(
  () => calculadora.amountFiat,
  (value) => {
    emits("amountPermitted", compareDecimalStrings(value, props.minAmount) >= 0);
  },
  { immediate: true },
);
</script>
