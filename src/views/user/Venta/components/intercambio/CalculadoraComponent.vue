<template>
  <VRow class="d-flex justify-center">
    <VCol>
      <div class="d-flex justify-center">
        <div data-test="fiat-amount-input" style="width: 150px">
          <InputComponent
            v-model="amountFiat"
            :events="eventsFiat"
            :rules="[onlyNumbers]"
            name="COP"
          />
        </div>
        <div class="my-auto mx-3 pt-6 text-center" cols="1" style="font-size: 1.5rem">
          =
        </div>
        <div data-test="crypto-amount-input" style="width: 150px">
          <InputComponent
            v-model="amountCrypto"
            :events="eventsCrypto"
            :rules="[onlyNumbers]"
            name="Crypto"
          />
        </div>
      </div>
      <div class="w-100 text-center font-weight-bold text-table">
        {{ amountCrypto }} {{ priceSelect?.symbol }} equivalente aproximado a
        {{ calculadora.amountUsd }} USD
      </div>
      <div v-if="validationForLimit" class="w-100 text-center font-weight-bold text-error">
        Transaccion minima {{ formatDecimalForDisplay(minAmount, 0) }} COP
      </div>
    </VCol>
  </VRow>
</template>

<script setup lang="ts">
import InputComponent from "@/components/InputComponent.vue";
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
import { reactive, ref, watch } from "vue";

const walletStore = WalletStore();

const props = defineProps<{
  currency: Currency;
  modelValue: Calculator;
  minAmount: string;
}>();

const emits = defineEmits<{
  (e: "update:model-value", value: Calculator): void;
  (e: "noPrice"): void;
  (e: "amountPermitted", value: boolean): void;
}>();

const calculadora = reactive<Calculator>({
  amountFiat: "0",
  amountCrypto: "0",
  amountUsd: "0",
  tasaCompra: "0",
  tasaVenta: "0",
  criptoOficial: "0",
  localOficial: "0",
});

const validationForLimit = ref(true);
const isNumericKey = (key: string): boolean => /[\d.,]/.test(key);

const eventsFiat: EventComponent = {
  keypress: (event: KeyboardEvent) => {
    if (!isNumericKey(event.key) && event.key !== "Backspace") {
      event.preventDefault();
    }
  },
  input: (event: Event) => {
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
    amountCrypto.value = normalizeUnsignedDecimalInput(
      (event.target as HTMLInputElement).value,
      props.currency.attributes.decimal_scale ?? 8,
    );
    updateFiat();
  },
};

const priceSelect = ref<CurrencyTicker | null>(null);
const oficialValue = ref("0");
const amountFiat = ref("0");
const amountCrypto = ref("0");

const loadPrices = () => {
  priceSelect.value = walletStore.getCurrencyTickerForCurrency(props.currency);
  const price = tickerPriceForSide(priceSelect.value, "sell");

  if (!hasValidTickerPrice(priceSelect.value, "sell") || price === null) {
    emits("noPrice");
    emits("amountPermitted", false);
    return;
  }

  calculadora.criptoOficial = normalizeDecimalStrict(priceSelect.value?.oficial ?? "0");
  calculadora.localOficial = calculadora.criptoOficial;
  calculadora.tasaVenta = normalizeDecimalStrict(price);
  oficialValue.value = divideDecimalStrings(
    calculadora.criptoOficial,
    normalizeDecimalStrict(priceSelect.value?.trm ?? "1"),
    8,
  );
};

const updateCrypto = () => {
  const price = tickerPriceForSide(priceSelect.value, "sell");
  if (!hasValidTickerPrice(priceSelect.value, "sell") || price === null) {
    emits("noPrice");
    emits("amountPermitted", false);
    return;
  }

  const fiat = normalizeDecimalStrict(amountFiat.value || "0");
  const crypto = divideDecimalStrings(fiat, normalizeDecimalStrict(price), props.currency.attributes.decimal_scale ?? 8);

  calculadora.amountFiat = fiat;
  calculadora.amountCrypto = crypto;
  calculadora.amountUsd = multiplyDecimalStrings(crypto, oficialValue.value, 2);
  amountCrypto.value = crypto;

  emits("update:model-value", { ...calculadora });
};

const updateFiat = () => {
  const price = tickerPriceForSide(priceSelect.value, "sell");
  if (!hasValidTickerPrice(priceSelect.value, "sell") || price === null) {
    emits("noPrice");
    emits("amountPermitted", false);
    return;
  }

  const crypto = normalizeDecimalStrict(amountCrypto.value || "0");
  const fiat = multiplyDecimalStrings(crypto, normalizeDecimalStrict(price), 2);

  calculadora.amountCrypto = crypto;
  calculadora.amountFiat = fiat;
  calculadora.amountUsd = multiplyDecimalStrings(crypto, oficialValue.value, 2);
  amountFiat.value = fiat;

  emits("update:model-value", { ...calculadora });
};

watch(
  () => props.currency.id,
  () => {
    loadPrices();
    updateCrypto();
  },
  { immediate: true },
);

watch(
  () => calculadora.amountFiat,
  (value) => {
    validationForLimit.value = compareDecimalStrings(value, props.minAmount) < 0;
    emits("amountPermitted", !validationForLimit.value);
  },
  { immediate: true },
);
</script>
