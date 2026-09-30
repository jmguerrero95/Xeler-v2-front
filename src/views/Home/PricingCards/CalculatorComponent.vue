<template>
  <VCard elevation="4" rounded="10">
    <div :class="showBuy ? 'degradado-buy' : 'degradado-sell'">
      <div class="d-flex justify-lg-space-between font-22" style="height: 60px">
        <div
          class="my-auto mx-auto font-weight-bold cursor-pointer"
          :class="showBuy ? 'text-white bg-primary' : 'text-primary'"
          @click="showBuy = true"
        >
          <span class="">Comprar</span>
        </div>
        <div class="d-flex">
          <div
            class="barra"
            :class="!showBuy ? 'bg-white' : 'bg-primary'"
          ></div>
          <div class="barra" :class="showBuy ? 'bg-white' : 'bg-primary'"></div>
        </div>
        <div
          class="my-auto mx-auto font-weight-bold cursor-pointer"
          :class="!showBuy ? 'text-white bg-primary' : 'text-primary'"
          @click="showBuy = false"
        >
          Vender
        </div>
      </div>
    </div>
    <div
      class="bg-primary"
      :class="showBuy ? 'rounded-te-lg' : 'rounded-ts-lg'"
    >
      <div
        class="d-flex flex-column pt-8 px-4"
        :class="showBuy ? 'flex-column' : 'flex-column-reverse'"
      >
        <div class="py-3">
          <div
            class="d-flex justify-space-between align-center rounded-10 elevation-4 bg-white"
          >
            <VRow dense class="d-flex align-center">
              <VCol>
                <VTextarea
                  auto-grow
                  rows="1"
                  inputmode="numeric"
                  bg-color="white"
                  hide-details
                  id="algo"
                  class="font-22 probando"
                  :disabled="!cryptoSelect"
                  style="padding-left: 0px"
                  :label="showBuy ? 'Pagas' : 'Recibes'"
                  variant="solo"
                  placeholder="0.00"
                  active
                  rounded="10"
                  flat
                  v-model="amountFiat"
                  v-on="eventsFiat"
                >
                </VTextarea>
              </VCol>
              <VCol cols="5" class="mr-3">
                <div
                  class="bg-inactive-select rounded-lg d-flex align-center gap-2 justify-center py-1"
                  style="height: 44px"
                >
                  <VIcon :icon="ColombiaIcon" />
                  <span class="font-weight-light text-20 text-table-2"
                    >COP</span
                  >
                </div>
              </VCol>
            </VRow>
          </div>
        </div>
        <div class="py-3">
          <div
            class="d-flex justify-space-between align-center rounded-10 elevation-4 bg-white"
          >
            <VRow dense class="d-flex align-center">
              <VCol>
                <VTextarea
                  auto-grow
                  rows="1"
                  bg-color="white"
                  hide-details
                  inputmode="numeric"
                  class="font-22"
                  :label="showBuy ? 'Recibes' : 'Vendes'"
                  variant="solo"
                  placeholder="0.00"
                  active
                  rounded="10"
                  flat
                  :disabled="!cryptoSelect"
                  color="table-2"
                  v-model="amountCrypto"
                  v-on="eventsCrypto"
                >
                </VTextarea>
              </VCol>
              <VCol cols="5" class="mr-3">
                <VSelect
                  v-model="cryptoSelect"
                  density="compact"
                  hide-details
                  :items="currencies"
                  variant="solo"
                  item-value="id"
                  item-title="attributes.name"
                  flat
                  id="selectCrypto"
                  single-line
                  rounded="lg"
                  bg-color="#f7f7f7"
                  menu-icon=""
                  :menu="vModelMenu"
                  @update:menu="(v) => (vModelMenu = v)"
                >
                  <template #selection="{ index, item }">
                    <!-- <div
                                        class="d-flex h-100 w-100 align-center font-weight-light gap-2"
                                    > -->
                    <VImg
                      v-if="
                        itemHaveImages(getRawCurrency(item)?.relationships?.images)
                      "
                      inline
                      :src="
                        itemHaveImages(getRawCurrency(item)?.relationships?.images) as string
                      "
                      sizes="20px"
                    ></VImg>
                    <span class="font-weight-light text-20 text-table-2">
                      {{
                        getRawCurrency(item)?.attributes?.abbreviation?.toUpperCase() ??
                        "Seleccione"
                      }}
                    </span>
                    <!-- </div> -->
                  </template>

                  <template #item="{ item, props, index }">
                    <v-list-item
                      @click="selectCurrencyFromItem(item)"
                      class="text-table-2"
                    >
                      <template #prepend>
                        <img
                          inline
                          v-if="
                            itemHaveImages(getRawCurrency(item)?.relationships?.images)
                          "
                          :src="
                            itemHaveImages(getRawCurrency(item)?.relationships?.images) as string
                          "
                          width="25"
                          height="25"
                        />
                      </template>
                      <div class="d-flex justify-space-between align-center">
                        <div>
                          <span class="ml-2 font-weight-light font-22">
                            {{
                              getRawCurrency(item)
                                ?.attributes?.abbreviation?.toUpperCase() ?? ""
                            }}
                          </span>
                          <span class="ml-2 text-capitalize">
                            {{ getRawCurrency(item)?.attributes?.name ?? "" }}
                          </span>
                        </div>
                        <div
                          class="ml-3"
                          v-if="getRawCurrency(item)?.id == cryptoSelect"
                        >
                          <VIcon
                            color="primary"
                            size="16"
                            :icon="CheckedIconVue"
                          />
                        </div>
                      </div>
                    </v-list-item>
                  </template>
                </VSelect>
              </VCol>
            </VRow>
          </div>
        </div>
      </div>

      <VCardActions
        class="px-2 mx-1 d-flex justify-center"
        style="height: 140px"
      >
        <div class="text-center">
          <span v-if="amountCrypto">
            Equivalente a
            <b>
              {{
                formatNumber(
                  parseFloat(calculadora.amountUsd as string),
                  ",",
                  ".",
                  2,
                )
              }}
              USD</b
            >
            apróximadamente
          </span>
          <span v-else> Seleccione una moneda e Ingrese una cantidad </span>
        </div>
      </VCardActions>
    </div>
  </VCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ref, reactive } from "vue";
import ColombiaIcon from "@/assets/icons/ColombiaIcon.vue";
import { useDisplay } from "vuetify";
import { WalletStore } from "@/stores/WalletStore";
import type { EventComponent } from "@/interfaces/Components.helper";
import {
  amountFormat,
  keyPressIsNumber,
  onlyNumbers,
  transformAmount,
} from "@/validator";
import type { Calculator } from "@/interfaces/Calculadora.interface";
import type { CurrencyTicker } from "@/interfaces/Ticker/Ticker.model";
import { storeToRefs } from "pinia";
import type { Currency } from "@/interfaces/Currency/Currency.model";
import { watch } from "vue";
import { formatNumber, itemHaveImages } from "@/helper";
import CheckedIconVue from "@/assets/icons/CheckedIcon.vue";

const { smAndDown: isMobile, xs } = useDisplay();
const isSell = ref(false);
const walletStore = WalletStore();
const { currencies, currencyTicker: prices } = storeToRefs(walletStore);
const buyOrSell = computed(() => (isSell.value == true ? "Comprar" : "Vender"));
const emits = defineEmits<{
  (e: "update:model-value", value: Calculator): void;
  (e: "noPrice"): void;
  (e: "amountPermitted", value: boolean): void;
}>();
const isBank = ref(false);
const efectyOrBank = computed(() =>
  isBank.value == true ? "Efectivo" : "Banco",
);

const amountFiat = ref<string>("");
const amountCrypto = ref<string>("");

const cryptoSelect = ref<"" | number>("");

const getRawCurrency = (item: unknown): Currency | undefined => {
  return (item as { raw?: Currency } | undefined)?.raw;
};

const selectCurrencyFromItem = (item: unknown): void => {
  const rawCurrency = getRawCurrency(item);
  if (!rawCurrency) return;
  cryptoSelect.value = rawCurrency.id;
  vModelMenu.value = false;
};

const eventsFiat: EventComponent = {
  keypress: (event: any) => {
    if (!keyPressIsNumber(event) && event.key != "Backscape") {
      event.preventDefault();
      return;
    }
    // amountFiat.value = amountFormat(event)
  },
  keyup: (event: any) => {
    amountFiat.value = amountFormat(event);
    updateCrypto();
  },
};
const eventsCrypto: EventComponent = {
  keypress: (event: any) => {
    if (!keyPressIsNumber(event)) {
      event.preventDefault();
    }
  },
  keyup: (event: any) => {
    amountCrypto.value = amountFormat(event, 8);
    updateFiat();
  },
};

const priceSelect = ref<undefined | CurrencyTicker>();
const cryptoSelected = ref<Currency | undefined>();
watch(cryptoSelect, (nuevo, viejo) => {
  if (nuevo != "") {
    cryptoSelected.value = currencies.value.find(
      (currency) => currency.id == cryptoSelect.value,
    )!;
    priceSelect.value = prices.value.find((price) => {
      const symbol = price.symbol.toLocaleUpperCase();
      const abbreviation =
        cryptoSelected.value!.attributes.abbreviation.toUpperCase();

      return abbreviation.includes(symbol);
    });
    calculadora.criptoOficial = Number(priceSelect.value?.oficial ?? 1);
    oficialValue.value =
      Number(calculadora.criptoOficial) / Number(priceSelect.value?.trm ?? 1);
    calculadora.tasaCompra = oficialValue.value;
    calculadora.localOficial = priceSelect.value?.oficial ?? 1;
    if (amountFiat.value) {
      updateCrypto();
    }
  }
});

const calculadora = reactive<Calculator>({
  amountFiat: 0,
  amountCrypto: 0,
  amountUsd: 1,
  tasaCompra: 1,
  tasaVenta: 1,
  criptoOficial: 1,
  localOficial: 1,
});
const oficialValue = ref(1);

const updateCrypto = () => {
  calculadora.amountFiat = transformAmount(amountFiat.value);

  const division = Number(calculadora.amountFiat) / Number(priceSelect.value?.buy ?? 1);
  calculadora.amountCrypto = division.toFixed(8);
  amountCrypto.value = calculadora.amountCrypto;
  calculadora.amountUsd = (
    parseFloat(calculadora.amountCrypto) * oficialValue.value
  ).toFixed(2);
  emits("update:model-value", calculadora);
};

const updateFiat = () => {
  calculadora.amountCrypto = transformAmount(amountCrypto.value);
  calculadora.amountFiat =
    Number(calculadora.amountCrypto) * Number(priceSelect.value?.buy ?? 1);
  calculadora.amountUsd = (
    Number(calculadora.amountCrypto) * oficialValue.value
  ).toFixed(2);
  amountFiat.value = calculadora.amountFiat.toFixed(2);
  emits("update:model-value", calculadora);
};

const showBuy = ref(true);
const changeOrientation = computed(() => (showBuy.value ? 1.5 : -1.5));

const vModelMenu = ref(false);

watch(showBuy, (nuevo, viejo) => {});

const fontSizeForInputs = computed(() => (isMobile.value ? "21px" : "22px"));
</script>

<style lang="scss">
@use "@/scss/variables.scss" as *;

.v-field__input {
  font-size: v-bind("fontSizeForInputs");
  color: #4f4f5b;
  &#algo {
    --v-field-padding-end: 0px !important;
  }
  #selectCrypto {
    --v-field-padding-start: 0px !important;
  }
}
$side: v-bind("changeOrientation");
.degradado-buy {
  background: linear-gradient(50deg, $color-primary 51%, #ffffff 49%);
}
.degradado-sell {
  background: linear-gradient(-50deg, $color-primary 49%, #ffffff 51%);
}

.barra {
  border-radius: 10px;
  transform: skewX(calc($side * 15deg));
  width: 30px;
}

.image-container {
  // display: inline-block;
  border: 5px solid #ffffff;
  border-radius: 50%; /* Ajusta el valor según tus necesidades */
  overflow: hidden;
}

.image-container img {
  display: block;
  width: 100%;
  height: auto;
}

.bg-inactive-select {
  background-color: #f7f7f7;
}
</style>
