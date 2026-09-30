<template>
  <div>
    <VMenu>
      <template #activator="{ props }">
        <div
          class="d-flex align-center justify-space-between gap-2 px-3 py-2 border rounded-lg bg-grey-lighten-4 cursor-pointer"
          v-bind="props"
          style="min-height: 40px"
        >
          <div class="text-table d-flex align-center gap-2">
            <span class="font-weight-light">Tipo de Pago:</span>
            <span class="font-weight-medium text-primary">
              {{ paymentMethod ? paymentMethodName[paymentMethod - 1] : 'Seleccione...' }}
            </span>
          </div>

          <VBtn
            icon
            size="x-small"
            color="primary"
            class="elevation-0"
            aria-label="Cambiar tipo de pago"
          >
            <VIcon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="16"
                viewBox="0 0 14 16"
                fill="none"
              >
                <path
                  d="M3.81233 15.0222H3.26782C2.81674 15.0222 2.45107 14.707 2.45107 14.3181L2.45107 3.75555H0.817567C0.090419 3.75555 -0.272866 2.99567 0.240021 2.55345L2.96253 0.206227C3.2815 -0.0687504 3.79864 -0.0687504 4.11759 0.206227L6.84009 2.55345C7.35097 2.99399 6.99276 3.75555 6.26258 3.75555H4.62908L4.62908 14.3181C4.62908 14.707 4.26341 15.0222 3.81233 15.0222ZM8.98509 0.704161V11.2667H7.35159C6.62624 11.2667 6.25986 12.0255 6.77404 12.4688L9.49655 14.816C9.81552 15.091 10.3327 15.091 10.6516 14.816L13.3741 12.4688C13.8855 12.0278 13.5261 11.2667 12.7966 11.2667H11.1631V0.704161C11.1631 0.315255 10.7974 -5.72205e-06 10.3463 -5.72205e-06H9.80184C9.35076 -5.72205e-06 8.98509 0.315255 8.98509 0.704161Z"
                  fill="currentColor"
                />
              </svg>
            </VIcon>
          </VBtn>
        </div>
      </template>

      <VList elevation="10" class="border-primary rounded-xl text-primary" id="list">
        <VListItem
          v-for="(item, index) in paymentMethodName"
          :key="index"
          @click="paymentMethod = index + 1"
        >
          {{ item }}
        </VListItem>
      </VList>
    </VMenu>

    <div
      class="border mt-3 custom-border-primary rounded-lg d-flex align-center py-1 pl-3 pr-6 gap-2"
    >
      <div>
        <VIcon icon="mdi-account" />
      </div>
      <div class="w-100 d-flex justify-end">
        <select
          class="w-100 border-none text-center px-3"
          single-line
          id="xcop-input"
          name="xcop-input"
          hide-details
          v-model="vModel"
        >
          <option value="">Seleccione...</option>
          <option v-for="(item, i) in accounts" :key="i" :value="item.id">
            {{ getText(item) }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PAYMENT_METHODS_AVAILABLE } from "@/enums/PaymentMethod.enum";
import { helperStore } from "@/helper";
import type { BankAccountClient } from "@/interfaces/CompanyAccount/BankAccount/BankAccount.model";
import type { EfectyAccount } from "@/interfaces/CompanyAccount/EfectyAccount/EfectyAccount.model";
import type { OtherAccountClient } from "@/interfaces/CompanyAccount/OtherAccount/OtherAccount.model";
import { watch, ref } from "vue";

const helper = helperStore();
const vModel = ref<number | "">("");
const emits = defineEmits<(e: "update:modelValue", value: number | "") => void>();

const paymentMethod = ref<PAYMENT_METHODS_AVAILABLE>();
const paymentMethodName = ["Efectivo", "Banco", "Otro"];

watch(vModel, () => emits("update:modelValue", vModel.value));
watch(paymentMethod, async () => await getAccounts());

const getAccounts = async () => {
  const url = "client/account";
  const params = {
    payment_type_id: paymentMethod.value ? paymentMethod.value : 0,
  };
  const res = await helper.http(url, "get", { params });
  accounts.value = res.data.response;
};

const getText = (
  item: BankAccountClient | OtherAccountClient | EfectyAccount
): string => {
  const accountNumber = item.attributes.account_number;
  let name = "";
  if ((item as BankAccountClient).relationships?.bank) {
    name =
      (item as BankAccountClient).relationships?.bank?.attributes?.name || "";
  } else if ((item as OtherAccountClient).relationships?.typePayment) {
    name =
      (item as OtherAccountClient).relationships?.typePayment?.attributes?.name ||
      "";
  }
  return `${accountNumber} - ${name}`;
};

const accounts = ref<
  BankAccountClient[] | OtherAccountClient[] | EfectyAccount[]
>([]);
</script>

<style scoped>
#list > div:hover {
  background-color: rgba(236, 236, 236, 0.301);
  cursor: pointer;
}
#xcop-input {
  outline: none;
}
option:hover {
  background-color: rgba(236, 236, 236, 0.301);
}
</style>
