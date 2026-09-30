<template>
  <VRow>
    <VCol v-if="requiresShipping" data-test="buy-shipping-select" cols="12">
      <div
        v-if="shippingLoading"
        class="text-table rounded-lg pa-4 mb-3"
        style="background-color: rgba(239, 93, 168, 0.08)"
      >
        Cargando tipos de envio...
      </div>
      <div
        v-else-if="shippingError"
        class="text-table rounded-lg pa-4 mb-3"
        style="background-color: rgba(239, 93, 168, 0.08)"
      >
        {{ shippingError }}
      </div>
      <div
        v-else-if="shippingType.length === 0"
        class="text-table rounded-lg pa-4 mb-3"
        style="background-color: rgba(239, 93, 168, 0.08)"
      >
        No hay tipos de envio disponibles para esta operacion.
      </div>
      <SelectComponent
        v-model="form.shipping_type_id"
        :items="shippingType"
        :name="$t('views.shipping-types.title')"
        itemValue="id"
        itemTitle="attributes.name"
        classLabel="text-primary"
      >
        <template #label>
          <div class="text-primary font-weight-bold">
            {{ $t("views.shipping-types.title") }}
          </div>
        </template>
      </SelectComponent>
    </VCol>

    <VCol data-test="buy-network-select" cols="12">
      <div
        class="w-100 alertError py-2 px-4 rounded-lg text-soft-error"
      >
        Puedes hacer transferencia virtual <span class="font-weight-bold">UNICAMENTE</span>
        si tienes tu identidad validada en nuestra seccion KYC.
        <a href="#" class="link-reset" @click.prevent="openKYC">Haz click aqui para validarla</a>
      </div>
    </VCol>
  </VRow>

  <VRow>
    <VCol cols="12">
      <div
        v-if="networkLoading"
        class="text-table rounded-lg pa-4 mb-3"
        style="background-color: rgba(239, 93, 168, 0.08)"
      >
        Cargando redes disponibles...
      </div>
      <div
        v-else-if="networkError"
        class="text-table rounded-lg pa-4 mb-3"
        style="background-color: rgba(239, 93, 168, 0.08)"
      >
        {{ networkError }}
      </div>
      <div
        v-else-if="networkTypes.length === 0"
        class="text-table rounded-lg pa-4 mb-3"
        style="background-color: rgba(239, 93, 168, 0.08)"
      >
        No hay redes disponibles para esta moneda.
      </div>
      <SelectComponent
        v-model="form.red_id"
        :items="networkTypes"
        :name="$t('views.network-type.title')"
        itemValue="id"
        itemTitle="attributes.name"
        classLabel="text-primary"
      >
        <template #label>
          <div class="text-primary font-weight-bold">
            {{ $t("views.network-type.title") }}
          </div>
        </template>
      </SelectComponent>
    </VCol>

    <VCol cols="12">
      <VForm ref="formRef" @submit.prevent="() => {}">
        <InputComponent
          v-model="form.address_send"
          :name="$t('views.order.address')"
          :rules="[validateAddress]"
          :append-icon="WalletIcon"
          @click:append-icon="modalSelectWallet = true"
        >
          <template #label>
            <div class="text-primary font-weight-bold">
              Direccion de destino
            </div>
          </template>
        </InputComponent>
      </VForm>
      <SelectWallet
        :dialog="modalSelectWallet"
        @close-dialog="modalSelectWallet = false"
        @select-wallet="(value) => (form.address_send = value.attributes.address)"
      />
    </VCol>

    <VCol cols="12">
      <div class="w-100 py-2 px-1 text-primary d-flex" style="gap: 15px">
        <VCheckbox v-model="confirmAddress" color="primary" />
        <div class="ml-2 cursor-pointer" @click="confirmAddress = !confirmAddress">
          Declaro conocer que las transacciones en criptomonedas son irreversibles,
          y asumo la responsabilidad de cualquier error de mi parte al introducir
          la direccion destino.
        </div>
      </div>
    </VCol>
  </VRow>

  <BuyFeeBreakdown v-if="quote" :quote="quote" class="mb-6" />

  <VAlert v-if="isXcopPayment" type="info" variant="tonal" class="mb-6">
    <h5 class="mb-2">Pago con XCOP</h5>
    <div v-if="xcopSummaryLoading">Consultando saldo XCOP...</div>
    <div v-else-if="xcopSummaryError">
      {{ xcopSummaryError }}
      <VBtn variant="text" size="small" :loading="xcopSummaryLoading" @click="loadXcopSummary">
        Reintentar
      </VBtn>
    </div>
    <template v-else-if="xcopSummary">
      <div>Saldo XCOP disponible: <strong>{{ xcopSummary.available_balance }}</strong></div>
      <div>XCOP requerido: <strong>{{ quote?.total_exchange_local ?? "-" }}</strong></div>
      <div>
        Saldo estimado despues de pagar:
        <strong>{{ estimatedXcopBalance ?? "-" }}</strong>
      </div>
    </template>
  </VAlert>

  <div v-if="quote?.breb" class="text-table rounded-lg pa-4 mb-6" style="background-color: rgba(239, 93, 168, 0.08)">
    <h5 class="text-primary mb-2">Pago mediante Bre-B</h5>
    <div>Llave: {{ quote.breb.masked_value }}</div>
    <div>Titular: {{ quote.breb.holder_name }}</div>
    <div v-if="quote.breb.bank_name">Entidad: {{ quote.breb.bank_name }}</div>
    <div v-if="quote.breb.instructions" class="mt-2">{{ quote.breb.instructions }}</div>
    <small>Tras pagar, registra la referencia y adjunta el comprobante en el flujo de la orden.</small>
  </div>

  <div v-else-if="quoteError" class="text-table text-error rounded-lg pa-4 mb-6" data-test="fee-unavailable">
    {{ quoteError }}
  </div>

  <div v-if="quote" class="text-table rounded-lg pa-4 mb-6" style="background-color: rgba(239, 93, 168, 0.08)">
    <h5 class="text-primary mb-2">Cotizacion vigente</h5>
    <div v-if="!quoteExpired">
      Tienes
      <CountDown
        :deadline="quote.quote_expires_at ?? quote.expires_at"
        :server-time="quote.server_time"
        @expired="quoteExpired = true"
      />
      para confirmar la creacion de la orden.
    </div>
    <div v-else class="text-error font-weight-bold">
      La cotizacion vencio. Solicita una nueva cotizacion para continuar.
      <div class="mt-3">
        <VBtnSecondary :disabled="quoteLoading" @click="refreshQuote">
          Solicitar nueva cotizacion
        </VBtnSecondary>
      </div>
    </div>
    <div v-if="quoteNeedsUserReconfirmation" class="text-error font-weight-bold mt-3">
      La cotizacion fue actualizada. Revisa los nuevos valores y confirma nuevamente.
    </div>
  </div>

  <VRow>
    <VCol cols="6" class="text-center">
      <VBtnSecondary @click="clickInBack">
        {{ $t("general-views.back") }}
      </VBtnSecondary>
    </VCol>
    <VCol cols="6" class="text-center">
      <VBtnPrimary :disabled="disabledButton" @click="emitConfirmOrder">
        {{ $t("general-views.accept.title") }}
      </VBtnPrimary>
      <div v-if="blockerMessage" class="text-table text-error mt-3">
        {{ blockerMessage }}
      </div>
    </VCol>
  </VRow>
</template>

<script setup lang="ts">
import SelectComponent from "@/components/SelectComponent.vue";
import InputComponent from "@/components/InputComponent.vue";
import CountDown from "@/components/CountDown.vue";
import { ConfirmOrderStore } from "./CompraStore";
import { onMounted, ref, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { addressValid } from "@/validator";
import { WalletStore } from "@/stores/WalletStore";
import { helperStore } from "@/helper";
import WalletIcon from "@/assets/icons/WalletIcon.vue";
import SelectWallet from "./ConfirmOrder/SelectWallet.vue";
import { TransactionStore } from "@/stores/TransactionStore";
import { useRouter } from "vue-router";
import BuyFeeBreakdown from "./components/BuyFeeBreakdown.vue";
import { XcopStore } from "@/stores/XcopStore";
import { subtractDecimals } from "@/utils/decimal";

const transactionStore = TransactionStore();
const modalSelectWallet = ref(false);
const helper = helperStore();
const { formRef } = storeToRefs(helper);
const walletStore = WalletStore();
const confirmOrderStore = ConfirmOrderStore();
const {
  shippingType,
  form,
  networkTypes,
  quote,
  quoteNeedsUserReconfirmation,
  creatingOrder,
  quoteInputSide,
  quoteInputAmount,
} = storeToRefs(confirmOrderStore);
const { getShippingTypes } = confirmOrderStore;
const router = useRouter();
const xcopStore = XcopStore();
const {
  summary: xcopSummary,
  summaryLoading: xcopSummaryLoading,
  summaryError: xcopSummaryError,
} = storeToRefs(xcopStore);
const shippingLoading = ref(false);
const shippingError = ref("");
const networkLoading = ref(false);
const networkError = ref("");
const quoteLoading = ref(false);
const quoteError = ref("");
const quoteExpired = ref(false);


onMounted(async () => {
  form.value.address_send = "";
  if (isXcopPayment.value) {
    await loadXcopSummary();
  }
  await loadNetworks();
  if (!requiresShipping.value) await refreshQuote();
  else loadShippingTypes();
});

const emits = defineEmits<{
  (e: "confirmOrder"): void;
  (e: "back"): void;
}>();

const emitConfirmOrder = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  if (!quote.value || !form.value.quote_id) {
    quoteError.value =
      "Debes solicitar una cotizacion vigente antes de crear la orden.";
    return;
  }

  if (quoteExpired.value) {
    quoteError.value =
      "La cotizacion vencio. Solicita una nueva cotizacion y confirma nuevamente.";
    return;
  }

  emits("confirmOrder");
};

const validateAddress = () => {
  const address = String(form.value.address_send ?? "").trim();
  if (!address) return "Direccion requerida";

  const currency = transactionStore.currencyUsed ?? walletStore.currencies.find(
    (currencyIterable) => currencyIterable.id === form.value.currency_id
  );
  const symbol = String(currency?.attributes.abbreviation ?? "").toUpperCase();
  const network = String(
    networkTypes.value.find((item) => item.id === form.value.red_id)?.attributes.name ?? ""
  ).toUpperCase();

  if (["USDT", "USDC"].includes(symbol) && ["TRC20", "TRX", "TRON"].includes(network)) {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)
      ? true
      : "Direccion TRON/TRC20 invalida";
  }

  if (symbol === "ETH" || network === "ETH") {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
      ? true
      : "Direccion Ethereum invalida";
  }

  if (symbol) {
    return addressValid(address, symbol);
  }

  return address.length >= 20 ? true : "Direccion invalida";
};

const confirmAddress = ref(false);
const isBrebPayment = computed(() => form.value.payment_method_code === "breb");
const isXcopPayment = computed(() => form.value.payment_method_code === "xcop");
const requiresShipping = computed(() => !isBrebPayment.value && !isXcopPayment.value);
const estimatedXcopBalance = computed((): string | null => {
  if (!xcopSummary.value || !quote.value) return null;
  try {
    return subtractDecimals(
      xcopSummary.value.available_balance,
      quote.value.total_exchange_local,
    );
  } catch {
    return null;
  }
});

const loadXcopSummary = async (): Promise<void> => {
  try {
    await xcopStore.loadSummary();
  } catch {
    // The balance remains unknown until the user retries.
  }
};

const loadShippingTypes = async () => {
  shippingLoading.value = true;
  shippingError.value = "";
  try {
    await getShippingTypes();
  } catch {
    shippingError.value =
      "No pudimos cargar los tipos de envio disponibles para esta operacion.";
  } finally {
    shippingLoading.value = false;
  }
};

const loadNetworks = async () => {
  networkLoading.value = true;
  networkError.value = "";
  try {
    await confirmOrderStore.getNetworkTypes();
    if (networkTypes.value.length === 1) {
      form.value.red_id = networkTypes.value[0].id;
    }
  } catch {
    networkError.value =
      "No pudimos cargar las redes disponibles para esta moneda.";
  } finally {
    networkLoading.value = false;
  }
};

const addFeesToTotalLocal = () => {
  if (!quote.value) return;
  form.value.fee = quote.value.network_fee_currency;
  form.value.fee_mining_cop = quote.value.network_fee_local;
  form.value.total_exchange_local = quote.value.total_exchange_local;
  form.value.total_exchange_reference = quote.value.total_exchange_reference;
  form.value.received_amount =
    quote.value.net_amount_currency ?? quote.value.amount_currency;
};

const refreshQuote = async (): Promise<boolean> => {
  if (!form.value.currency_id || !form.value.payment_type_id || (requiresShipping.value && !form.value.shipping_type_id)) {
    quoteError.value =
      "Debes completar la configuracion de la compra antes de solicitar la cotizacion.";
    return false;
  }

  quoteLoading.value = true;
  quoteError.value = "";

  try {
    await confirmOrderStore.requestQuote({
      type: "Compra",
      currency_id: form.value.currency_id,
      payment_type_id: form.value.payment_type_id,
      shipping_type_id: requiresShipping.value ? form.value.shipping_type_id : undefined,
      input_currency: quoteInputSide.value === "crypto" ? "CRYPTO" : "COP",
      input_amount: String(
        quoteInputAmount.value ||
          (quoteInputSide.value === "crypto"
            ? form.value.amount_currency
            : form.value.fiat_received) ||
          "0",
      ),
    });
    quoteExpired.value = false;
    addFeesToTotalLocal();
    return true;
  } catch {
    quoteError.value =
      "No pudimos actualizar la cotizacion de la compra. Intenta nuevamente antes de crear la orden.";
    return false;
  } finally {
    quoteLoading.value = false;
  }
};

const disabledButton = computed((): boolean => {
  return (
    creatingOrder.value ||
    !confirmAddress.value ||
    quoteLoading.value ||
    (requiresShipping.value && form.value.shipping_type_id == "") ||
    form.value.red_id == "" ||
    !form.value.address_send ||
    validateAddress() !== true ||
    !quote.value ||
    !form.value.quote_id ||
    quoteExpired.value
  );
});

const blockerMessage = computed((): string => {
  if ((requiresShipping.value && shippingLoading.value) || networkLoading.value) {
    return "Estamos cargando la configuracion necesaria para continuar.";
  }
  if (quoteLoading.value) {
    return "Estamos actualizando la cotizacion segura de esta compra.";
  }
  if (requiresShipping.value && shippingError.value) {
    return shippingError.value;
  }
  if (requiresShipping.value && shippingType.value.length === 0) {
    return "No hay tipos de envio disponibles para esta operacion.";
  }
  if (networkError.value) {
    return networkError.value;
  }
  if (networkTypes.value.length === 0) {
    return "No hay redes disponibles para esta moneda.";
  }
  if (requiresShipping.value && form.value.shipping_type_id == "") {
    return "Selecciona un tipo de envio antes de continuar.";
  }
  if (form.value.red_id == "") {
    return "Selecciona una red antes de continuar.";
  }
  if (!form.value.address_send) {
    return "Ingresa una direccion valida o selecciona una billetera cripto registrada.";
  }
  if (validateAddress() !== true) {
    return String(validateAddress());
  }
  if (quoteError.value) {
    return quoteError.value;
  }
  if (!quote.value || !form.value.quote_id) {
    return "Debes solicitar una cotizacion vigente antes de crear la orden.";
  }
  if (quoteExpired.value) {
    return "La cotizacion vencio. Solicita una nueva cotizacion para continuar.";
  }
  if (quoteNeedsUserReconfirmation.value) {
    return "La cotizacion fue actualizada. Revisa los nuevos valores y confirma nuevamente.";
  }
  if (!confirmAddress.value) {
    return "Debes aceptar la responsabilidad sobre la direccion antes de continuar.";
  }
  return "";
});

const clickInBack = () => {
  form.value.shipping_type_id = "";
  form.value.red_id = "";
  form.value.address_send = "";
  confirmAddress.value = false;
  quoteError.value = "";
  emits("back");
};

const openKYC = () => {
  router.push("/user/profile/kyc");
};

addFeesToTotalLocal();

watch(
  () => form.value.fee,
  () => {
    addFeesToTotalLocal();
  }
);

watch(
  () => form.value.payment_type_id,
  () => {
    loadShippingTypes();
  }
);

watch(
  () => form.value.shipping_type_id,
  async (nextValue, previousValue) => {
    if (nextValue === previousValue) return;
    confirmOrderStore.resetQuote();
    quoteExpired.value = false;
    quoteError.value = "";
    if (!nextValue) return;
    await refreshQuote();
  }
);

</script>

<style scoped>
.alertError {
  background-color: #ef5da84d;
}

.link-reset {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  font-weight: bold;
}
</style>
