<template>
  <dialog-global :dialog="dialog" @close-dialog="emits('closeDialog')">
    <template #title>
      {{ $t("views.buy.select-wallet.title") }}
    </template>
    <template #default>
      <p class="mb-5">
        {{ $t("views.buy.select-wallet.content") }}
      </p>
      <div
        v-if="!form.currency_id"
        class="text-table rounded-lg pa-4 mb-4"
        style="background-color: rgba(239, 93, 168, 0.08)"
      >
        Primero selecciona la moneda que quieres comprar para cargar tus
        billeteras cripto compatibles.
      </div>
      <div
        v-else-if="confirmOrderStore.walletsLoading"
        class="text-table rounded-lg pa-4 mb-4"
        style="background-color: rgba(239, 93, 168, 0.08)"
      >
        Cargando billeteras cripto registradas...
      </div>
      <div
        v-else-if="confirmOrderStore.walletsError"
        class="text-table rounded-lg pa-4 mb-4"
        style="background-color: rgba(239, 93, 168, 0.08)"
      >
        {{ confirmOrderStore.walletsError }}
      </div>
      <div
        v-else-if="confirmOrderStore.wallets.length === 0"
        class="text-table rounded-lg pa-4 mb-4"
        style="background-color: rgba(239, 93, 168, 0.08)"
      >
        No tienes billeteras cripto registradas para esta moneda. Puedes agregar
        una en tu perfil o escribir una dirección manualmente.
      </div>
      <VRow v-else>
        <v-radio-group v-model="walletSelect" :inline="mdAndUp">
          <v-radio
            color="primary"
            v-for="item in confirmOrderStore.wallets"
            :key="item.id"
            :value="item"
          >
            <template #label>
              <div>
                <div class="text-black font-weight-bold">
                  {{ item.attributes.alias }} ({{
                    item.relationships?.currency?.attributes?.abbreviation ?? "N/A"
                  }})
                </div>
                <div class="text-table font-weight-bold">
                  {{ item.attributes.address }}
                </div>
              </div>
            </template>
          </v-radio>
        </v-radio-group>
      </VRow>
      <VRow>
        <VCol class="text-center">
          <VBtnPrimary
            style="width: 33px !important"
            class="text-uppercase font-weight-bold"
            :disabled="!walletSelect"
            @click="clickInOk"
          >
            Ok
          </VBtnPrimary>
        </VCol>
      </VRow>
      <div class="d-flex justify-center mt-3">
        <div
          class="text-primary cursor-pointer"
          @click="router.push({ name: 'user-profile' })"
        >
          Administrar billeteras cripto
        </div>
      </div>
    </template>
  </dialog-global>
</template>

<script setup lang="ts">
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import { ConfirmOrderStore } from "../CompraStore";
import { useRouter } from "vue-router";
import type { Wallet } from "@/interfaces/Wallet/Wallet.model";
import { parseIntegerString } from "@/utils/decimal";
import { ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { storeToRefs } from "pinia";

const { mdAndUp } = useDisplay();
const dialog = ref(false);

const walletSelect = ref<Wallet | undefined>();
const confirmOrderStore = ConfirmOrderStore();
const { form } = storeToRefs(confirmOrderStore);

const loadWallets = async (currencyId?: number | string | null) => {
  const normalizedCurrencyId =
    typeof currencyId === "number"
      ? currencyId
      : typeof currencyId === "string" && currencyId.trim() !== ""
      ? parseIntegerString(currencyId)
      : null;

  if (!normalizedCurrencyId || Number.isNaN(normalizedCurrencyId)) {
    confirmOrderStore.wallets = [];
    confirmOrderStore.walletsLoading = false;
    confirmOrderStore.walletsError = "";
    return;
  }

  await confirmOrderStore.getWallets(normalizedCurrencyId);
  const favorite = confirmOrderStore.wallets.find((wallet) => wallet.attributes.is_favorite);
  if (favorite) walletSelect.value = favorite;
};

loadWallets(form.value.currency_id);
watch(
  () => form.value.currency_id,
  async (currencyId) => {
    walletSelect.value = undefined;
    await loadWallets(currencyId);
  }
);

const emits = defineEmits<{
  (e: "closeDialog"): void;
  (e: "selectWallet", value: Wallet): void;
}>();

const clickInOk = () => {
  if (walletSelect.value) {
    emits("selectWallet", walletSelect.value);
    emits("closeDialog");
  }
};
const router = useRouter();
</script>
