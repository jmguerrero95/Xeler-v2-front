<template>
  <VCard class="v-text-field__slot d-flex flex-column">
    <div class="mt-5 mb-0 text-center text-primary mx-0 pb-0 px-0" style="font-size: 23px">
      {{ $t("views.menu-right.preview-order.title") }}
    </div>
    <VCardText class="px-3 pt-0 my-auto text-left text-table text-18">
      <div class="my-6 d-flex" style="justify-content: space-between">
        <span>Cantidad:</span>
        <span>
          {{ confirmOrderStore.form.amount_currency }}
          {{ selectedCurrency.attributes.abbreviation.toLocaleUpperCase() }}
        </span>
      </div>
      <div class="my-6 d-flex align-center" style="justify-content: space-between">
        <span>Dólares:</span>
        <div class="align-center justify-center d-flex">
          <VTooltip text="Valor aproximado">
            <template #activator="{ props }">
              <VIcon v-bind="props" class="mt-0 pt-0 mr-1" size="20" :icon="InformationIcon" color="primary" />
            </template>
          </VTooltip>
          <span>{{ confirmOrderStore.form.total_exchange_reference }} USD</span>
        </div>
      </div>
    </VCardText>
    <VCardActions class="bg-primary text-white py-4 px-3">
      <VImg v-if="getIconOfCurrency" :src="getIconOfCurrency" width="60" height="60" />
      <VIcon v-else :icon="BtcIcon" size="60" />
      <VSpacer />
      <p class="text-h5 font-weight-bold ml-1">
        {{ confirmOrderStore.form.amount_currency }}
        {{ selectedCurrency.attributes.abbreviation.toLocaleUpperCase() }}
      </p>
    </VCardActions>
  </VCard>
</template>

<script setup lang="ts">
import BtcIcon from "@/views/Home/PricingCards/BtcIcon.vue";
import { ConfirmOrderStore } from "@/views/user/Compra/CompraStore";
import { WalletStore } from "@/stores/WalletStore";
import { computed } from "vue";
import InformationIcon from "@/assets/icons/InformationIcon.vue";

const confirmOrderStore = ConfirmOrderStore();
const walletStore = WalletStore();

const selectedCurrency = computed(() => {
  return walletStore.currencies.find(
    (currency) => currency.id == confirmOrderStore.form.currency_id,
  )!;
});

const getIconOfCurrency = computed(() => {
  const images = selectedCurrency.value.relationships?.images ?? [];
  return images.length > 0 ? images[0].attributes.aws_url : false;
});
</script>

<style>
label.v-label {
  opacity: 1 !important;
}
</style>
