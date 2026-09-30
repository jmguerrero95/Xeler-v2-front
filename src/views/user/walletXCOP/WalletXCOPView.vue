<template>
  <div class="xcop-wallet mx-auto">
    <div
      class="d-flex justify-center align-center flex-column text-primary font-weight-light"
    >
      <div class="xcop-balance my-3 font-30 d-flex">
        <VIcon :icon="XcopIcon"></VIcon>
        {{ availableBalance }}
      </div>
      <div class="xcop-summary d-flex ga-4 text-caption mb-3">
        <span>Pendiente: {{ pendingBalance }}</span>
        <span>Total: {{ totalBalance }}</span>
      </div>
    </div>
    <div class="xcop-actions d-flex gap-2 justify-center">
      <VBtnPrimary
        @click="clickInOption = IndexComponent"
        style="min-width: 80px"
      >
        <VIcon icon="mdi-clipboard-text" />Transac.
      </VBtnPrimary>
      <VBtnPrimary
        @click="clickInOption = ReceivedComponent"
        :disabled="xcopStore.summary?.transfers_enabled === false"
        style="min-width: 80px"
      >
        <VIcon icon="mdi-qrcode" />Recibir
      </VBtnPrimary>
      <VBtnPrimary
        @click="clickInOption = SendComponent"
        :disabled="xcopStore.summary?.transfers_enabled === false"
        style="min-width: 80px"
      >
        <VIcon icon="mdi-play" />Enviar
      </VBtnPrimary>
      <VBtnPrimary
        @click="clickInOption = SwapComponent"
        :disabled="xcopStore.summary?.withdrawals_enabled === false"
        style="min-width: 80px"
      >
        <VIcon>
          <svg
            width="16"
            height="17"
            viewBox="0 0 16 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 4.76051V4.08058C0 3.51731 0.319213 3.06069 0.712993 3.06069H11.4079V1.02091C11.4079 0.112908 12.1773 -0.340732 12.6251 0.299718L15.0017 3.69936C15.2801 4.09767 15.2801 4.74343 15.0017 5.1417L12.6251 8.54134C12.179 9.17928 11.4079 8.73197 11.4079 7.82019V5.7804H0.712993C0.319213 5.7804 0 5.32379 0 4.76051ZM14.4975 11.2198H3.80263V9.18004C3.80263 8.27429 3.03432 7.81679 2.58546 8.45885L0.208818 11.8585C-0.069606 12.2568 -0.069606 12.9026 0.208818 13.3008L2.58546 16.7005C3.03192 17.339 3.80263 16.8903 3.80263 15.9793V13.9395H14.4975C14.8913 13.9395 15.2105 13.4829 15.2105 12.9196V12.2397C15.2105 11.6764 14.8913 11.2198 14.4975 11.2198Z"
              fill="white"
            />
          </svg>
        </VIcon>
        Retiro
      </VBtnPrimary>
    </div>
    <div class="mt-7">
      <component @send="setSend" @changed="refreshXcop" :is="clickInOption" />
    </div>
    <MessageModal
      :dialog="openModal"
      @closeDialog="closeDialog"
      :date="send?.date ?? ''"
      :amount="send?.amount ?? '0'"
      :external="false"
      :user="send?.user ?? ''"
      :number_transaction="send?.number_transaction ?? ''"
      type="send"
    />
  </div>
</template>

<script setup lang="ts">
import XcopIcon from "@/assets/icons/XcopIcon.vue";
import { UserStore } from "@/stores/UserStore";
import { computed, ref } from "vue";
import type { Component } from "vue";
import SendComponent from "@/views/user/walletXCOP/Send/SendComponent.vue";
import MessageModal from "./MessageModal.vue";
import ReceivedComponent from "@/views/user/walletXCOP/Received/ReceivedComponent.vue";
import SwapComponent from "./Swap/SwapComponent.vue";
import IndexComponent from "@/views/user/walletXCOP/Index/IndexComponent.vue";
import { XcopStore } from "@/stores/XcopStore";
import { onMounted } from "vue";
import { formatDecimalForDisplay } from "@/utils/decimal";

const clickInOption = ref<Component | null>(null);
const userStore = UserStore();
const xcopStore = XcopStore();

userStore.updateUserAuth();
onMounted(() => xcopStore.refresh());

const displayBalance = (value?: string) =>
  `${formatDecimalForDisplay(value ?? "0", xcopStore.summary?.decimals ?? 2)} XCOP`;
const availableBalance = computed(() =>
  displayBalance(xcopStore.summary?.available_balance)
);
const pendingBalance = computed(() =>
  displayBalance(xcopStore.summary?.pending_withdrawals)
);
const totalBalance = computed(() =>
  displayBalance(xcopStore.summary?.total_balance)
);
const refreshXcop = () => xcopStore.refresh();

const openModal = ref(false);

const send = ref<Send>();

interface Send {
  user: string;
  amount: string;
  date: string;
  number_transaction: string;
}

const setSend = (value: Send) => {
  send.value = value;
  openModal.value = true;
  refreshXcop();
};

const closeDialog = () => {
  openModal.value = false;
  send.value = undefined;
};
</script>

<style scoped>
.xcop-wallet {
  max-width: 340px;
  min-width: 0;
  width: 100%;
}

.xcop-balance,
.xcop-summary span {
  max-width: 100%;
  overflow-wrap: anywhere;
}

.xcop-balance {
  align-items: center;
  text-align: center;
}

.xcop-summary,
.xcop-actions {
  flex-wrap: wrap;
}

.xcop-summary span {
  flex: 1 1 140px;
}

@media (max-width: 599px) {
  .xcop-actions :deep(.v-btn) {
    flex: 1 1 calc(50% - 8px);
  }
}
</style>
