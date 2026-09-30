<template>
  <div
    :class="!$vuetify.display.mdAndDown ? 'border-degree px-5 pt-5 pb-16' : ''"
    class=""
  >
    <div class="text-primary font-22 text-left">
      {{ $t("views.buy.title") }}
    </div>
    <p class="text-table text-18 text-left">
      Selecciona la moneda que deseas comprar, luego de seleccionar podrás
      elegir el método de pago.
    </p>
    <OperationSubjectSelect v-model="form.company_id" />
    <CryptoCurrencySelect v-model="currency" side="buy"> </CryptoCurrencySelect>
  </div>

  <PaymentMethods
    v-if="currency"
    v-model="paymentMethod"
    side="buy"
    :currency-id="currency.id"
    :company-id="form.company_id"
  />
  <div v-if="paymentMethod && !['breb', 'xcop'].includes(paymentMethodSlug)">
    <div v-if="paymentMethodDetailsLoading" class="text-table mt-4">
      Cargando opciones de pago...
    </div>
    <div
      v-else-if="paymentMethodDetailsError"
      class="text-table mt-4 rounded-lg pa-4"
      style="background-color: rgba(239, 93, 168, 0.08)"
    >
      {{ paymentMethodDetailsError }}
    </div>
    <div
      v-else-if="paymentMethodDetailsEmptyMessage"
      class="text-table mt-4 rounded-lg pa-4"
      style="background-color: rgba(239, 93, 168, 0.08)"
    >
      {{ paymentMethodDetailsEmptyMessage }}
    </div>
    <component
      v-else
      :is="detailPaymentMethod!"
      :itemsDetails="itemsDetails"
      :paymentTypeId="paymentMethod?.id"
      v-model="itemDetailSelected"
    >
    </component>
  </div>
  <VAlert v-if="paymentMethodSlug === 'breb'" type="info" variant="tonal" class="mt-4">
    Xeler seleccionara una llave Bre-B receptora activa y compatible al generar la cotizacion.
  </VAlert>
  <VAlert v-if="paymentMethodSlug === 'xcop'" type="info" variant="tonal" class="mt-4">
    El total de la cotizacion se debitara de tu saldo XCOP y no requerira comprobante.
    <div v-if="xcopSummaryLoading" class="mt-2">Consultando saldo XCOP...</div>
    <div v-else-if="xcopSummaryError" class="mt-2">
      {{ xcopSummaryError }}
      <VBtn variant="text" size="small" :loading="xcopSummaryLoading" @click="retryXcopSummary">
        Reintentar
      </VBtn>
    </div>
    <div v-else-if="xcopSummary" class="mt-2">
      Saldo XCOP disponible: <strong>{{ xcopSummary.available_balance }}</strong>
    </div>
  </VAlert>
  <div class="mt-5" v-if="itemDetailSelected || ['breb', 'xcop'].includes(paymentMethodSlug)">
    <h3 class="text-primary">
      {{ $t("views.buy.amount") }}
    </h3>
    <p class="text-table text-18">
      Ingresa la cantidad a calcular, puedes usar cualquiera de los campos para
      hacer el cálculo
    </p>
    <CalculadoraComponent
      v-model="calculatorValue"
      @update:model-value="handleCalculatorUpdate"
      :currency="currency!"
      side="buy"
      :paymentTypeId="paymentMethod?.id"
      @no-price="noPrice"
      :minAmount="String(currency?.attributes.min_buy ?? '0')"
      @amount-permitted="(value) => (amountPermitted = value)"
      @monto-fiat="(value) => (form.fiat_received = value)"
    >
    </CalculadoraComponent>
    <VRow>
      <VCol class="text-center my-6">
        <VBtnPrimary :disabled="!amountPermitted" @click="clickInContinue">
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
import { ref, watch, computed } from "vue";
import type { PaymentMethod } from "@/interfaces/PaymentMethod/PaymentMethod.model";
import BankComponent from "./../components/intercambio/PaymentMethods/BankComponent.vue";
import EfectyComponent from "./../components/intercambio/PaymentMethods/EfectyComponent.vue";
import OtherComponent from "./../components/intercambio/PaymentMethods/OtherComponent.vue";
import type { BankAccount } from "@/interfaces/CompanyAccount/BankAccount/BankAccount.model";
import type { EfectyAccount } from "@/interfaces/CompanyAccount/EfectyAccount/EfectyAccount.model";
import type { OtherAccount } from "@/interfaces/CompanyAccount/OtherAccount/OtherAccount.model";
import { helperStore } from "@/helper";
import CalculadoraComponent from "../components/intercambio/CalculadoraComponent.vue";
import { ConfirmOrderStore } from "./CompraStore";
import type { Calculator } from "@/interfaces/Calculadora.interface";
import { storeToRefs } from "pinia";
import { normalizeDecimalStrict } from "@/utils/decimal";
import OperationSubjectSelect from "@/components/OperationSubjectSelect.vue";
import { exceedsOrderMaxCop } from "@/utils/operationLimits";
import { XcopStore } from "@/stores/XcopStore";

const confirmOrderStore = ConfirmOrderStore();
const { form } = storeToRefs(confirmOrderStore);
const xcopStore = XcopStore();
const {
  summary: xcopSummary,
  summaryLoading: xcopSummaryLoading,
  summaryError: xcopSummaryError,
} = storeToRefs(xcopStore);
const emits = defineEmits<{
  (e: "click:continue"): void;
  (e: "currency", value: Currency): void;
}>();

const helper = helperStore();
const currency = ref<Currency | null>(null);
const paymentMethod = ref<PaymentMethod | null>(null);
const itemsDetails = ref<BankAccount[] | EfectyAccount[] | OtherAccount[] | null>(null);
const itemDetailSelected = ref<
  BankAccount | EfectyAccount | OtherAccount | null
>();
const paymentMethodDetailsLoading = ref(false);
const paymentMethodDetailsError = ref("");
const paymentMethodDetailsEmptyMessage = ref("");
const paymentMethodSlug = computed(() =>
  String(paymentMethod.value?.attributes.code ?? paymentMethod.value?.attributes.slug ?? "")
);
const detailPaymentMethod = computed(() => {
  if (!paymentMethod.value) return null;
  switch (paymentMethodSlug.value) {
    case "bank":
      return BankComponent;
    case "cash":
      return EfectyComponent;
    case "other":
      return OtherComponent;
    default:
      return null;
  }
});

watch(currency, () => (paymentMethod.value = null));
watch(currency, () => {
  form.value.red_id = "";
  form.value.address_send = "";
  form.value.wallet_id = "";
  confirmOrderStore.resetQuote();
});
watch(() => form.value.company_id, () => {
  paymentMethod.value = null;
  itemDetailSelected.value = null;
  form.value.account_delivery_id = "";
  confirmOrderStore.resetQuote();
});
watch(paymentMethod, async () => {
  itemsDetails.value = null;
  itemDetailSelected.value = null;
  paymentMethodDetailsError.value = "";
  paymentMethodDetailsEmptyMessage.value = "";

  if (!paymentMethod.value) {
    return;
  }

  if (paymentMethodSlug.value === "xcop") {
    await retryXcopSummary();
  }
  await getDetailsForPaymentMethod();
});

const retryXcopSummary = async (): Promise<void> => {
  try {
    await xcopStore.loadSummary();
  } catch {
    // The store exposes a retryable, user-safe error state.
  }
};

const getDetailsForPaymentMethod = async () => {
  if (!paymentMethod.value) return;

  if (["breb", "xcop"].includes(paymentMethodSlug.value)) {
    itemsDetails.value = [];
    form.value.account_delivery_id = "";
    form.value.shipping_type_id = "";
    form.value.breb_key_id = "";
    return;
  }

  paymentMethodDetailsLoading.value = true;
  paymentMethodDetailsError.value = "";
  paymentMethodDetailsEmptyMessage.value = "";

  try {
    if (paymentMethodSlug.value === "bank") {
      const res = await helper.http("order/flow/company-payment-banks", "get", {
        params: { payment_type_id: paymentMethod.value.id },
      });
      itemsDetails.value = res.data.response;
      if (!Array.isArray(itemsDetails.value) || itemsDetails.value.length === 0) {
        paymentMethodDetailsEmptyMessage.value =
          "No hay bancos disponibles para pagar en este momento.";
      }
      return;
    }

    const params = {
      payment_type_id: paymentMethod.value.id,
    };
    const res = await helper.http("order/flow/company-payment-accounts", "get", {
      params,
    });
    itemsDetails.value = res.data.response;

    if (!Array.isArray(itemsDetails.value) || itemsDetails.value.length === 0) {
      paymentMethodDetailsEmptyMessage.value =
        paymentMethodSlug.value === "cash"
          ? "No hay puntos de efectivo disponibles en este momento."
          : "No hay billeteras o cuentas de pago disponibles para este método. Intenta otro método o contacta soporte.";
    }
  } catch (error) {
    itemsDetails.value = null;
    paymentMethodDetailsError.value =
      "No pudimos cargar las opciones de pago para este método. Intenta nuevamente o elige otro método.";
  } finally {
    paymentMethodDetailsLoading.value = false;
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
  inputSide: "fiat",
});

const handleCalculatorUpdate = (value: Calculator) => {
  calculatorValue.value = value;
  const inputSide = value.inputSide ?? "fiat";
  confirmOrderStore.setQuoteInput(
    inputSide,
    inputSide === "crypto" ? String(value.amountCrypto) : String(value.amountFiat),
  );
};

const noPrice = () => {
  helper.showNotify(
    "Problema con la moneda, por favor contactar al administrador",
    { type: "error" }
  );
  currency.value = null;
};

const clickInContinue = async () => {
  if (!currency.value || !paymentMethod.value) return;
  if (itemDetailSelected.value) {
    form.value.account_delivery_id = itemDetailSelected.value.id;
  }
  if (currency.value) {
    form.value.currency_id = currency.value.id;
  }
  form.value.payment_type_id = paymentMethod.value?.id ?? "";
  form.value.payment_method_code = paymentMethodSlug.value;

  try {
    form.value.fiat_received = normalizeDecimalStrict(calculatorValue.value.amountFiat);
    if (exceedsOrderMaxCop(form.value.fiat_received)) {
      helper.showNotify("El monto maximo por orden es COP 9.000.000.", { type: "error" });
      return;
    }
    form.value.amount_currency = "0";
    const inputSide = calculatorValue.value.inputSide ?? "fiat";
    confirmOrderStore.setQuoteInput(
      inputSide,
      inputSide === "crypto"
        ? String(calculatorValue.value.amountCrypto)
        : String(calculatorValue.value.amountFiat),
    );
    confirmOrderStore.resetQuote();
    emits("click:continue");
    if (currency.value) {
      emits("currency", currency.value);
    }
  } catch (error) {
    helper.showNotify(
      error instanceof Error ? error.message : "Formato decimal invalido",
      { type: "error" }
    );
  }
};
</script>
