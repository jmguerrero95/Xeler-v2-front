<template>
  <div style="width: 300px" class="mx-auto">
    <VSelect
      v-model="form.destination_type"
      :items="destinationOptions"
      item-title="title"
      item-value="value"
      label="Destino"
      rounded="lg"
      @update:model-value="clearDestination"
    />

    <VSelect
      v-if="form.destination_type === 'bank_account'"
      v-model="form.account_id"
      :items="accounts"
      :item-title="accountLabel"
      item-value="id"
      label="Cuenta bancaria"
      rounded="lg"
    />
    <VSelect
      v-else
      v-model="form.wallet_id"
      :items="polygonWallets"
      :item-title="walletLabel"
      item-value="id"
      label="Wallet Polygon"
      rounded="lg"
    />

    <div class="border custom-border-primary rounded-lg d-flex align-center pa-3 ga-2">
      <VIcon :icon="XcopIcon" />
      <div>
        <div class="text-table text-10">Retirar</div>
        <div>XCOP</div>
      </div>
      <input
        id="xcop-input"
        v-model="form.amount"
        class="w-100 text-right"
        @keypress="eventsXcop.keypress"
        @keyup="eventsXcop.keyup"
      />
    </div>

    <VList density="compact" class="mt-2">
      <VListItem title="Monto" :subtitle="`${normalizedAmount} XCOP`" />
      <VListItem title="Fee del backend" :subtitle="`${xcop.fee} XCOP`" />
      <VListItem title="Total a debitar" :subtitle="`${totalDebit} XCOP`" />
    </VList>

    <VAlert v-if="!xcop.summary?.withdrawals_enabled" type="warning" density="compact">
      Los retiros XCOP no están habilitados.
    </VAlert>
    <div class="text-center mt-3">
      <VBtnPrimary :disabled="!isValid" @click="requestTwoFactor">Retirar</VBtnPrimary>
    </div>
  </div>
</template>

<script setup lang="ts">
import XcopIcon from "@/assets/icons/XcopIcon.vue";
import { computed, onMounted, reactive, ref } from "vue";
import { helperStore } from "@/helper";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";
import {
  addDecimals,
  greaterThanDecimal,
  normalizeDecimalStrict,
  normalizeUnsignedDecimalInput,
} from "@/utils/decimal";
import { XcopStore } from "@/stores/XcopStore";
import { CompanyAccountStore } from "@/stores/CompanyAccountStore";
import { requirePaymentMethod } from "@/utils/paymentMethodSemantics";

interface Destination {
  id: number;
  attributes: Record<string, any>;
  relationships?: Record<string, any>;
}

const emit = defineEmits<{ (e: "changed"): void }>();
const helper = helperStore();
const twoFactor = TwoFactorAuthStore();
const xcop = XcopStore();
const companyAccounts = CompanyAccountStore();
const accounts = ref<Destination[]>([]);
const wallets = ref<Destination[]>([]);
const form = reactive({
  destination_type: "bank_account" as "bank_account" | "polygon",
  account_id: null as number | null,
  wallet_id: null as number | null,
  amount: "",
});

const destinationOptions = computed(() => [
  { title: "Cuenta bancaria", value: "bank_account" },
  ...(xcop.summary?.polygon_enabled
    ? [{ title: "Polygon", value: "polygon" }]
    : []),
]);
const polygonWallets = computed(() =>
  wallets.value.filter((wallet) =>
    ["POL", "MATIC", "XCOP"].includes(
      String(wallet.relationships?.currency?.attributes?.abbreviation ?? "").toUpperCase()
    )
  )
);
const normalizedAmount = computed(() => {
  try {
    return normalizeDecimalStrict(form.amount || "0");
  } catch {
    return "0";
  }
});
const totalDebit = computed(() => addDecimals(normalizedAmount.value, xcop.fee));
const isValid = computed(() =>
  Boolean(
    xcop.summary?.withdrawals_enabled &&
    greaterThanDecimal(normalizedAmount.value, "0") &&
    (form.destination_type === "bank_account" ? form.account_id : form.wallet_id)
  )
);

onMounted(async () => {
  await xcop.refresh();
  await companyAccounts.getPaymentMethods();
  const bank = requirePaymentMethod(companyAccounts.paymentMethods, "bank", message => helper.showNotify(message, { type: "error" }));
  const [accountResponse, walletResponse] = await Promise.all([
    helper.http(
      "client/account",
      "get",
      { params: { payment_type_id: bank.id } },
      "",
      true,
    ),
    helper.http("client/wallet", "get", {}, "", true),
  ]);
  accounts.value = accountResponse.data.response?.data ?? accountResponse.data.response ?? [];
  wallets.value = walletResponse.data.response?.data ?? walletResponse.data.response ?? [];
});

const clearDestination = () => {
  form.account_id = null;
  form.wallet_id = null;
};
const accountLabel = (item: Destination) =>
  `${item.attributes.account_number ?? "Cuenta"} · ${item.relationships?.bank?.attributes?.name ?? ""}`;
const walletLabel = (item: Destination) =>
  `${item.attributes.alias ?? "Wallet"} · ${item.attributes.address ?? ""}`;

const requestTwoFactor = () => {
  twoFactor.modal = true;
  twoFactor.newFlow = true;
  twoFactor.callback = { fn: completeWithdrawal };
  twoFactor.requestedScope = "finance.xcop";
};

const completeWithdrawal = async () => {
  const data = {
    destination_type: form.destination_type,
    amount: normalizeDecimalStrict(form.amount),
    ...(form.destination_type === "bank_account"
      ? { account_id: form.account_id }
      : { wallet_id: form.wallet_id }),
  };
  const scope = "withdrawal-create";
  await helper.http("withdrawal/xcop", "post", { data }, "Solicitud registrada", false, {
    idempotent: true,
    idempotencyKey: createOperationKey(scope, data),
    financialScope: "finance.xcop",
  });
  clearOperationKey(scope);
  form.amount = "";
  clearDestination();
  await xcop.refresh();
  emit("changed");
};

const eventsXcop = {
  keypress: (event: KeyboardEvent) => {
    if (!/^\d$/.test(event.key)
      && !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", ".", ","].includes(event.key)) {
      event.preventDefault();
    }
  },
  keyup: () => {
    form.amount = normalizeUnsignedDecimalInput(
      form.amount,
      xcop.summary?.decimals ?? 18,
    );
  },
};
</script>

<style scoped>
#xcop-input {
  border: none;
  outline: none;
}
</style>
