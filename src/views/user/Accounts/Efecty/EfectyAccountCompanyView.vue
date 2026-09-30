<template>
  <div class="d-flex justify-space-between">
    <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
  </div>
  <div
    v-if="helper.items.length === 0"
    class="text-table rounded-lg pa-4 mt-4"
    style="background-color: rgba(239, 93, 168, 0.08)"
  >
    No hay puntos de efectivo disponibles para este método en este momento.
  </div>
  <TableComponentVue
    v-else
    :optionsHabilit="false"
    :headers="headers"
    :items="helper.items"
  >
    <template #cel-attributes.username="{ data }">
      <span class="text-primary">
        {{ data.attributes.username }}
      </span>
    </template>
  </TableComponentVue>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import TableComponentVue from "@/components/global/TableComponent.vue";
import { helperStore } from "@/helper";
import type { Head } from "@/interfaces/TableComponent.helper";
import { useI18n } from "vue-i18n";
import SearchInputComponentVue from "@/components/global/SearchInputComponent.vue";
import { CompanyAccountStore } from "@/stores/CompanyAccountStore";
import { requirePaymentMethod } from "@/utils/paymentMethodSemantics";
const helper = helperStore();
helper.url = "order/flow/company-payment-accounts";
const companyAccounts = CompanyAccountStore();
onMounted(async () => {
  await companyAccounts.getPaymentMethods();
  const cash = requirePaymentMethod(companyAccounts.paymentMethods, "cash", message => helper.showNotify(message, { type: "error" }));
  helper.defaultParams.payment_type_id = cash.id;
  helper.defaultParamsByCrud.payment_type_id = cash.id;
  await helper.index();
});

const search = ref<string>("");
const getSearch = () => {
  helper.index({
    name: search.value,
  });
};

const { t } = useI18n();

const headers: Head[] = [
  {
    name: t("views.currencies.title"),
    value: "relationships.currency.attributes.abbreviation",
  },
  {
    name: t("views.company-accounts.bank.beneficiary"),
    value: "attributes.beneficiary",
  },
  {
    name: t("views.company-accounts.bank.account-number"),
    value: "attributes.account_number",
  },
  {
    name: t("views.company-accounts.bank.limit"),
    value: "attributes.limit",
  },
];
</script>
