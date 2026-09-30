<template>
  <div class="d-flex justify-space-between flex-column flex-sm-row mb-8">
    <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
    <div>
      <VBtn @click="openModal" prepend-icon="mdi-plus" class="rounded-xl">
        {{ $t("buttons.add") }}
      </VBtn>
    </div>
  </div>

  <CrudComponent
    :singular="$t('views.wallets.title')"
    :rows="rows"
    :widthDialog="'700px'"
    
   require-two-factor financial-scope="finance.financial_destination"></CrudComponent>
  <TableComponentVue
    optionsHabilit
    icon-update
    icon-delete
    
    :headers="headers"
    @update="openUpdate"
    :items="helper.items"
   require-two-factor financial-scope="finance.financial_destination">
    <template #cel-attributes.username="{ data }">
      <span class="text-primary">
        {{ data.attributes.username }}
      </span>
    </template>
    <template #cel-attributes.is_favorite="{ data }">
      <VBtn size="small" variant="text" @click="toggleFavorite(data)">{{ data.attributes.is_favorite ? "★" : "☆" }}</VBtn>
    </template>
  </TableComponentVue>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CrudComponent from "@/components/global/CrudComponent.vue";
import TableComponentVue from "@/components/global/TableComponent.vue";
import { helperStore } from "@/helper";
import type { Row } from "@/interfaces/FormComponent.helper";
import type { Head } from "@/interfaces/TableComponent.helper";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import type { Wallet } from "@/interfaces/Wallet/Wallet.model";
import type { WalletCreate } from "@/interfaces/Wallet/Wallet.dto";
import SearchInputComponentVue from "@/components/global/SearchInputComponent.vue";
import * as validator from "@/validator";
import { WalletStore } from "@/stores/WalletStore";
import { destinationFavoritesApi } from "@/services/brebApi";
const helper = helperStore();
helper.url = "client/wallet";

helper.defaultParams = {
  company_payment_address: "0",
};
helper.initView();
helper.index();
const walletStore = WalletStore();
walletStore.getCurrencies();

const { currencies } = storeToRefs(walletStore);
const search = ref<string>("");
const getSearch = () => {
  helper.index({
    name: search.value,
  });
};
const toggleFavorite = async (item: Wallet & { attributes: { is_favorite?: boolean } }) => {
  await destinationFavoritesApi.wallet(item.id, !item.attributes.is_favorite);
  await helper.index();
};
const openUpdate = (item: Wallet) => {
  itemH.value = item;
  const itemUpdate: WalletCreate = {
    currency_id: item.relationships?.currency?.id || 0,
    address: item.attributes.address,
    alias: item.attributes.alias,
  };
  formCrud.value = itemUpdate;
  openModalCrud.value = true;
};

const openModal = async () => {
  itemH.value = {};
  formCrud.value = {};
  clickIn.value = "Create";
  openModalCrud.value = true;
};

const { t } = useI18n();
const { formCrud, openModalCrud, clickIn, item: itemH } = storeToRefs(helper);

const validateAddress = (value?: unknown): boolean | string => {
  const address =
    typeof value === "string"
      ? value
      : typeof formCrud.value.address === "string"
        ? formCrud.value.address
        : "";

  // Vuetify evaluates rules while the modal opens and again while the form is
  // being reset. Empty transient values are handled by the required rule and
  // must never throw into the browser console.
  if (address.trim() === "") return true;

  const currency = walletStore.currencies.find(
    (currencyIterable) => currencyIterable.id === formCrud.value.currency_id,
  );

  if (!currency) {
    return "Selecciona una moneda antes de validar la dirección";
  }

  return validator.addressValid(
    address,
    currency.attributes.abbreviation,
  );
};
const rows: Row[] = [
  {
    fields: [
      {
        label: t("views.wallets.alias"),
        type: "text",
        valueForm: "alias",
        rules: [validator.required],
      },
      {
        label: t("views.currencies.title"),
        type: "select",
        valueForm: "currency_id",
        rules: [validator.required],
        select: {
          items: currencies,
          itemTitle: "attributes.name",
          itemValue: "id",
        },
      },
    ],
  },
  {
    fields: [
      {
        label: t("views.wallets.address"),
        type: "text",
        valueForm: "address",
        rules: [validateAddress, validator.required],
      },
    ],
  },
];

const headers: Head[] = [
  { name: "Favorita", value: "attributes.is_favorite" },
  {
    name: t("views.currencies.title"),
    value: "relationships.currency.attributes.name",
  },
  {
    name: t("views.wallets.address"),
    value: "attributes.address",
  },
  {
    name: t("views.wallets.alias"),
    value: "attributes.alias",
  },
];
</script>
