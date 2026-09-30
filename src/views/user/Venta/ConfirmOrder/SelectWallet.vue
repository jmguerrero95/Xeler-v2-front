<template>
  <dialog-global :dialog="dialog" @close-dialog="emits('closeDialog')">
    <template #title>
      {{ $t("views.buy.select-wallet.title") }}
    </template>
    <template #default>
      <p class="mb-5">
        {{ $t("views.buy.select-wallet.content") }}
      </p>
      <VRow>
        <v-radio-group v-model="walletSelect" :inline="mdAndUp">
          <v-radio
            color="primary"
            v-for="item in confirmOrderStore.wallets"
            :value="item"
            :key="item.id"
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
          Administrar Direcciones
        </div>
      </div>
    </template>
  </dialog-global>
</template>

<script setup lang="ts">
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import { useRouter } from "vue-router";
import type { Wallet } from "@/interfaces/Wallet/Wallet.model";
import { ref } from "vue";
import { useDisplay } from "vuetify";
import { ConfirmOrderStore } from "../../Compra/CompraStore";

const { mdAndUp } = useDisplay();
defineProps<{
  dialog: boolean;
}>();

const walletSelect = ref<Wallet | undefined>();
const confirmOrderStore = ConfirmOrderStore();
confirmOrderStore.getWallets();

const emits = defineEmits<{
  (e: "closeDialog"): void;
  (e: "selectWallet", value: Wallet): void;
}>();

const clickInOk = () => {
  if (walletSelect.value) {
    emits("selectWallet", walletSelect.value);
  }
  emits("closeDialog");
};
const router = useRouter();
</script>
