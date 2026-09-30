<template>
  <div>
    <h3 class="text-primary">Selecciona donde quieres recibir el pago</h3>
    <p class="text-table">
      {{ helperText }}
    </p>
  </div>
  <div
    data-test="sell-account-select"
    :style="{
      width: $vuetify.display.xs ? '300px' : '390px',
    }"
    class="mx-auto"
  >
    <div v-if="loading" class="text-table">Cargando cuentas disponibles...</div>
    <div
      v-else-if="errorMessage"
      class="text-table rounded-lg pa-4"
      style="background-color: rgba(239, 93, 168, 0.08)"
    >
      {{ errorMessage }}
    </div>
    <div
      v-else-if="itemsDetails.length === 0"
      class="text-table rounded-lg pa-4"
      style="background-color: rgba(239, 93, 168, 0.08)"
    >
      <div class="mb-3">{{ emptyMessage }}</div>
      <VBtn variant="outlined" color="primary" @click="goToProfileSection">
        {{ emptyActionLabel }}
      </VBtn>
    </div>
    <SelectComponent
      v-else
      v-model="valueSelect"
      name=""
      :items="itemsDetails"
      itemValue="id"
      itemTitle="attributes.name"
    />
  </div>

  <div v-if="accountSelect">
    <VCard
      elevation="0"
      class="border custom-border-primary mx-auto mt-10"
      :style="{
        width: $vuetify.display.xs ? '300px' : '390px',
      }"
      :height="$vuetify.display.xs ? 200 : 173"
    >
      <VCardText style="font-size: 18px">
        <VRow dense class="d-flex text-table align-content-space-between">
          <VCol>Nombre Titular:</VCol>
          <VCol class="text-primary text-left">
            {{ accountSelect.attributes?.beneficiary || "Cuenta" }}
          </VCol>
        </VRow>
        <VRow dense class="d-flex text-table">
          <VCol>Numero de Cuenta:</VCol>
          <VCol class="text-left">
            {{ accountSelect.attributes?.account_number || "No especificado" }}
          </VCol>
        </VRow>
        <VRow dense class="d-flex text-table">
          <VCol>{{ selectedAccountTypeLabel }}:</VCol>
          <VCol class="text-left">
            {{ selectedAccountTypeValue }}
          </VCol>
        </VRow>
        <VRow dense class="d-flex text-table">
          <VCol>Identificacion:</VCol>
          <VCol class="text-left">
            {{
              accountSelect.attributes?.identification_document ||
              "No especificada"
            }}
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </div>
</template>

<script setup lang="ts">
import SelectComponent from "@/components/SelectComponent.vue";
import { helperStore } from "@/helper";
import type { BankAccountClient } from "@/interfaces/CompanyAccount/BankAccount/BankAccount.model";
import type { OtherAccountClient } from "@/interfaces/CompanyAccount/OtherAccount/OtherAccount.model";
import type { PaymentMethod } from "@/interfaces/PaymentMethod/PaymentMethod.model";
import { parseIntegerString } from "@/utils/decimal";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

const emits = defineEmits<(e: "update:model-value", value: number | null) => void>();

const helper = helperStore();
const router = useRouter();
const props = defineProps<{
  modelValue: number | null;
  paymentMethod: PaymentMethod;
}>();

const valueSelect = ref<number | string | null>(null);
const itemsDetails = ref<(BankAccountClient | OtherAccountClient)[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const accountSelect = ref<BankAccountClient | OtherAccountClient | null>(null);

const isBankPayment = computed(
  () => (props.paymentMethod.attributes.code ?? props.paymentMethod.attributes.slug) === "bank"
);

const helperText = computed(() =>
  isBankPayment.value
    ? "Selecciona una de tus cuentas bancarias registradas para recibir el pago de esta venta."
    : "Selecciona tu cuenta de pago registrada, por ejemplo Nequi, Daviplata u otro metodo de pago. Aqui no se seleccionan billeteras cripto."
);

const emptyMessage = computed(() =>
  isBankPayment.value
    ? "No tienes cuentas bancarias registradas para recibir este pago. Agrega una cuenta en tu perfil y vuelve a intentarlo."
    : "No tienes cuentas de pago registradas para este metodo. Agrega una cuenta de pago en tu perfil, por ejemplo Nequi, Daviplata u otro metodo similar."
);

const emptyActionLabel = computed(() =>
  isBankPayment.value ? "Ir a cuentas bancarias" : "Ir a cuentas de pago"
);

const selectedAccountTypeLabel = computed(() =>
  isBankPayment.value ? "Banco" : "Tipo de cuenta"
);

const selectedAccountTypeValue = computed(() => {
  if (!accountSelect.value) {
    return "";
  }

  if (isBankPayment.value) {
    return (
      accountSelect.value.relationships?.bank?.attributes?.name ??
      "Banco no especificado"
    );
  }

  const otherAccount = accountSelect.value as OtherAccountClient;
  return (
    otherAccount.relationships?.typeSubPayment?.attributes?.name ??
    otherAccount.relationships?.typePayment?.attributes?.name ??
    "Cuenta de pago"
  );
});

watch(
  () => props.paymentMethod,
  () => {
    getDetailsForPaymentMethod();
    valueSelect.value = null;
    accountSelect.value = null;
  }
);

watch(valueSelect, (nuevo) => {
  const normalized =
    typeof nuevo === "string" ? parseIntegerString(nuevo) : (nuevo ?? null);

  accountSelect.value =
    normalized !== null
      ? itemsDetails.value.find((item) => item.id === normalized) ?? null
      : null;

  emits("update:model-value", normalized);
});

const goToProfileSection = () => {
  router.push({
    name: isBankPayment.value ? "user-bank-accounts" : "user-other-accounts",
  });
};

const titleSelect = (item: OtherAccountClient | BankAccountClient): string => {
  const beneficiary = item.attributes?.beneficiary || "Cuenta";
  const accountNumber = item.attributes?.account_number
    ? ` - ${item.attributes.account_number}`
    : "";

  if (isBankPayment.value) {
    const bankName =
      item.relationships?.bank?.attributes?.name ?? "Banco no especificado";
    return `${beneficiary} - ${bankName}${accountNumber}`;
  }

  const otherAccount = item as OtherAccountClient;
  const paymentName =
    otherAccount.relationships?.typeSubPayment?.attributes?.name ??
    otherAccount.relationships?.typePayment?.attributes?.name ??
    "Cuenta de pago";

  return `${beneficiary} - ${paymentName}${accountNumber}`;
};

const getDetailsForPaymentMethod = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const params = {
      payment_type_id: props.paymentMethod.id,
    };
    const response = await helper.http("order/flow/client-accounts", "get", {
      params,
    });
    const rawItems = Array.isArray(response.data?.response)
      ? response.data.response
      : [];

    try {
      itemsDetails.value = rawItems.map(
        (item: BankAccountClient | OtherAccountClient) => ({
          ...item,
          attributes: {
            ...item.attributes,
            name: titleSelect(item),
          },
        })
      );
      const favorite = itemsDetails.value.find((item) => item.attributes.is_favorite);
      if (favorite) valueSelect.value = favorite.id;
    } catch (mappingError) {
      console.error(
        "Error mapeando cuentas de pago para venta:",
        mappingError,
        rawItems
      );
      itemsDetails.value = [];
      errorMessage.value =
        "Recibimos tus cuentas, pero no pudimos mostrarlas correctamente. Intenta nuevamente o contacta soporte.";
    }
  } catch (error) {
    console.error("Error cargando cuentas de pago para venta:", error);
    itemsDetails.value = [];
    errorMessage.value =
      "No pudimos cargar tus cuentas disponibles en este momento. Intenta nuevamente.";
  } finally {
    loading.value = false;
  }
};

getDetailsForPaymentMethod();
</script>
