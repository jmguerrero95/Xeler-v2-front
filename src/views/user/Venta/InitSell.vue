<template>
  <h3 class="text-primary">
    {{ $t("views.sell.title") }}
  </h3>
  <p class="text-table text-18">
    Selecciona la moneda que deseas vender. Luego podrás elegir cómo quieres
    recibir el pago.
  </p>
  <OperationSubjectSelect v-model="form.company_id" />
  <CryptoCurrencySelect v-model="currency" side="sale"> </CryptoCurrencySelect>
  <PaymentMethods
    v-if="currency"
    v-model="paymentMethod"
    side="sale"
    :currency-id="currency.id"
    :company-id="form.company_id"
  />
  <SelectAccount
    v-if="paymentMethod && !['cash', 'breb'].includes(paymentMethodCode)"
    :paymentMethod="paymentMethod"
    v-model="accountDetailSelected"
  >
  </SelectAccount>
  <BrebKeySelect v-if="paymentMethodCode === 'breb'" v-model="brebKeyId" :company-id="form.company_id" />
  <div v-if="paymentMethodCode === 'cash'">
    <div v-if="efectyLoading" class="text-table mt-4">
      Cargando puntos de efectivo...
    </div>
    <div
      v-else-if="efectyError"
      class="text-table mt-4 rounded-lg pa-4"
      style="background-color: rgba(239, 93, 168, 0.08)"
    >
      {{ efectyError }}
    </div>
    <div
      v-else-if="efectyEmptyMessage"
      class="text-table mt-4 rounded-lg pa-4"
      style="background-color: rgba(239, 93, 168, 0.08)"
    >
      {{ efectyEmptyMessage }}
    </div>
    <EfectyComponent
      v-else
      :items-details="itemsDetails"
      v-model="efectyDetailSelected"
    />
  </div>
  <div class="mt-5" v-if="accountDetailSelected || efectyDetailSelected || brebKeyId">
    <h3 class="text-primary">
      {{ $t("views.sell.amount") }}
    </h3>
    <p class="text-table text-18">
      Ingresa la cantidad a calcular. Puedes usar cualquiera de los campos para
      hacer el cálculo.
    </p>
    <CalculadoraComponent
      v-model="calculatorValue"
      @update:model-value="handleCalculatorUpdate"
      :currency="currency!"
      side="sale"
      :paymentTypeId="paymentMethod?.id"
      @no-price="noPrice"
      :minAmount="String(currency?.attributes.min_sale ?? '0')"
      @amount-permitted="(value) => (amountPermitted = value)"
    >
    </CalculadoraComponent>
    <VRow>
      <VCol v-if="canPayFeesWithXcop" cols="12" class="d-flex justify-center">
        <div>
          <VCheckbox
            v-model="form.xcop_payment"
            label="Pagar comisión con XCOP"
          ></VCheckbox>
        </div>
      </VCol>
      <VCol v-if="quote" cols="12">
        <VCard variant="tonal" class="pa-4 text-table">
          <h4 class="text-primary mb-2">Desglose de fees</h4>
          <div>Comision administrativa: {{ quote.fees?.administrative_fee ?? "0" }} COP</div>
          <div>Fee del metodo: {{ quote.fees?.payment_method_fee ?? "0" }} COP</div>
          <div>Ajuste manual: {{ quote.fees?.manual_adjustment ?? "0" }} COP</div>
          <div v-if="quote.fees?.network_fee_exemption_applied">Comision de red asumida por Xeler</div>
          <div v-else>Comision de red: {{ quote.fees?.network_fee ?? "0" }} COP</div>
          <div class="font-weight-bold">Total fees: {{ quote.fees?.total_fees ?? "0" }} COP</div>
          <div v-if="quote.xcop_payment" class="mt-2">Los fees se debitaran de tu saldo XCOP y no se descontaran del pago fiat.</div>
          <div v-else class="mt-2">Los fees se descontaran del pago fiat.</div>
          <div>Pago fiat estimado: {{ quote.total_exchange_local }} COP</div>
        </VCard>
      </VCol>
      <VCol class="text-center my-6">
        <VTooltip
          v-if="!amountPermitted"
          text="Ingresa un monto mayor al mínimo requerido"
        >
          <template #activator="{ props }">
            <VBtnPrimary
              v-bind="props"
              :disabled="true"
              @click="clickInContinue"
            >
              {{ $t("general-views.continue") }}
            </VBtnPrimary>
          </template>
        </VTooltip>

        <VBtnPrimary v-else @click="clickInContinue">
          {{ $t("general-views.continue") }}
        </VBtnPrimary>
      </VCol>
    </VRow>
  </div>
</template>

<script setup lang="ts">
import type { Currency } from "@/interfaces/Currency/Currency.model";
import CryptoCurrencySelect from "../components/intercambio/CryptoCurrencySelect.vue";
import PaymentMethods from "./../components/intercambio/PaymentMethods.vue";
import { computed, ref, watch } from "vue";
import type { PaymentMethod } from "@/interfaces/PaymentMethod/PaymentMethod.model";
import type { BankAccount } from "@/interfaces/CompanyAccount/BankAccount/BankAccount.model";
import type { OtherAccount } from "@/interfaces/CompanyAccount/OtherAccount/OtherAccount.model";
import { helperStore } from "@/helper";
import CalculadoraComponent from "../components/intercambio/CalculadoraComponent.vue";
import EfectyComponent from "./../components/intercambio/PaymentMethods/EfectyComponent.vue";

import type { Calculator } from "@/interfaces/Calculadora.interface";
import { storeToRefs } from "pinia";
import { compareDecimalStrings, normalizeDecimalStrict } from "@/utils/decimal";
import SelectAccount from "./components/intercambio/PaymentMethods/SelectAccount.vue";
import { ConfirmOrderStore } from "../Compra/CompraStore";
import type { EfectyAccount } from "@/interfaces/CompanyAccount/EfectyAccount/EfectyAccount.model";
import OperationSubjectSelect from "@/components/OperationSubjectSelect.vue";
import { exceedsOrderMaxCop } from "@/utils/operationLimits";
import BrebKeySelect from "./components/BrebKeySelect.vue";

const confirmOrderStore = ConfirmOrderStore();
const { form, quote } = storeToRefs(confirmOrderStore);
const emits = defineEmits<(e: "click:continue") => void>();
const helper = helperStore();
const currency = ref<Currency | null>(null);
const paymentMethod = ref<PaymentMethod | null>(null);
const paymentMethodCode = computed(() =>
  (paymentMethod.value?.attributes.code ?? paymentMethod.value?.attributes.slug ?? "").toLowerCase(),
);
const canPayFeesWithXcop = computed(() =>
  quote.value !== null
  && compareDecimalStrings(String(quote.value.fees?.total_fees ?? "0"), "0") > 0
);
const itemsDetails = ref<EfectyAccount[]>([]);
const accountDetailSelected = ref<number | null>(null);
const efectyDetailSelected = ref<EfectyAccount | null>(null);
const efectyLoading = ref(false);
const efectyError = ref("");
const efectyEmptyMessage = ref("");
const brebKeyId = ref<number | null>(null);

watch(currency, () => (paymentMethod.value = null));
watch(currency, () => {
  form.value.red_id = "";
  form.value.address_send = "";
  form.value.wallet_id = "";
  confirmOrderStore.resetQuote();
});
watch(() => form.value.company_id, () => {
  paymentMethod.value = null;
  accountDetailSelected.value = null;
  efectyDetailSelected.value = null;
  brebKeyId.value = null;
  form.value.account_delivery_id = "";
  form.value.breb_key_id = "";
  confirmOrderStore.resetQuote();
});
watch(() => form.value.xcop_payment, async () => {
  confirmOrderStore.resetQuote();
  if (!currency.value || !paymentMethod.value || !amountPermitted.value
    || (!accountDetailSelected.value && !efectyDetailSelected.value && !brebKeyId.value)) return;
  try {
    await requestCurrentQuote();
  } catch (error) {
    helper.showNotify(error instanceof Error ? error.message : "No fue posible renovar la cotizacion.", { type: "error" });
  }
});
watch(paymentMethod, async () => {
  itemsDetails.value = [];
  accountDetailSelected.value = null;
  efectyDetailSelected.value = null;
  brebKeyId.value = null;
  efectyError.value = "";
  efectyEmptyMessage.value = "";

  if (paymentMethodCode.value === "cash") {
    await getCashLocationsForSell();
  }
});

const getCashLocationsForSell = async () => {
  if (paymentMethodCode.value !== "cash") {
    return;
  }

  efectyLoading.value = true;
  efectyError.value = "";
  efectyEmptyMessage.value = "";

  try {
    const res = await helper.http("order/flow/company-payment-accounts", "get", {
      params: {
        payment_type_id: paymentMethod.value?.id,
      },
    });
    itemsDetails.value = res.data.response;

    if (!Array.isArray(itemsDetails.value) || itemsDetails.value.length === 0) {
      efectyEmptyMessage.value =
        "No hay puntos de efectivo disponibles en este momento. Intenta con banco o con otra cuenta de pago.";
    }
  } catch (error) {
    itemsDetails.value = [];
    efectyError.value =
      "No pudimos cargar los puntos de efectivo disponibles. Intenta nuevamente o elige otro método.";
  } finally {
    efectyLoading.value = false;
  }
};

const amountPermitted = ref(false);
const calculatorValue = ref<Calculator>({
  amountFiat: "0",
  amountCrypto: "0",
  amountUsd: "0",
  tasaCompra: "0",
  tasaVenta: "0",
  criptoOficial: "0",
  localOficial: "0",
  inputSide: "crypto",
});

const handleCalculatorUpdate = (value: Calculator) => {
  calculatorValue.value = value;
};

const noPrice = () => {
  helper.showNotify(
    "Problema con la moneda, por favor contactar al administrador",
    { type: "error" },
  );
  currency.value = null;
};

const requestCurrentQuote = async () => {
  const inputCurrency = calculatorValue.value.inputSide === "fiat" ? "COP" : "CRYPTO";
  const inputAmount = normalizeDecimalStrict(
    calculatorValue.value.inputSide === "fiat"
      ? calculatorValue.value.amountFiat
      : calculatorValue.value.amountCrypto,
  );
  return confirmOrderStore.requestQuote({
    type: "Venta",
    currency_id: currency.value?.id ?? form.value.currency_id,
    payment_type_id: paymentMethod.value?.id ?? form.value.payment_type_id,
    input_currency: inputCurrency,
    input_amount: inputAmount,
    breb_key_id: paymentMethodCode.value === "breb" ? brebKeyId.value : undefined,
    xcop_payment: Boolean(form.value.xcop_payment),
  });
};

const clickInContinue = async () => {
  if (paymentMethodCode.value === "breb") {
    form.value.account_delivery_id = "";
    form.value.breb_key_id = brebKeyId.value ?? "";
  } else if (paymentMethodCode.value !== "cash") {
    form.value.account_delivery_id = accountDetailSelected.value ?? "";
  } else {
    form.value.account_delivery_id = efectyDetailSelected.value?.id ?? "";
  }
  form.value.currency_id = currency.value?.id ?? "";
  form.value.payment_type_id = paymentMethod.value?.id ?? "";
  form.value.payment_method_code = paymentMethodCode.value;
  try {
    if (exceedsOrderMaxCop(String(calculatorValue.value.amountFiat))) {
      helper.showNotify("El monto maximo por orden es COP 9.000.000.", { type: "error" });
      return;
    }
    await requestCurrentQuote();
    emits("click:continue");
  } catch (error) {
    helper.showNotify(
      error instanceof Error ? error.message : "Formato decimal invalido",
      { type: "error" }
    );
    return;
  }
};
</script>
