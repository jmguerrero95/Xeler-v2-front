<template>
  <VAlert
    v-if="operationsBlockedMessage"
    type="warning"
    variant="tonal"
    class="mb-4"
    :text="operationsBlockedMessage"
  />
  <VAlert
    v-else-if="manualModeMessage"
    type="info"
    variant="tonal"
    class="mb-4"
    :text="manualModeMessage"
  />
  <InitBuy
    v-if="!operationsBlockedMessage && !confirmatedOrder"
    @click:continue="nextStep"
    @currency="(c) => (transactionStore.currencyUsed = c)"
  >
  </InitBuy>
  <confirm-order v-else-if="!operationsBlockedMessage" @back="backStep" @confirmOrder="createOrder2">
  </confirm-order>
  <!-- {{ form }} -->
  <template v-if="!operationsBlockedMessage">
    <div class="text-table mt-7">
      La disponibilidad y las restricciones operativas se validan siempre contra el backend antes de crear la orden.
    </div>
    <PenaltyModal
      @have-penalization="(value) => (havePenalization = value)"
      :TypePenalty="PENALTY_TYPES.COMPRA"
    ></PenaltyModal>
  </template>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import InitBuy from "./InitBuy.vue";
import ConfirmOrder from "./ConfirmOrder.vue";
import { ConfirmOrderStore } from "./CompraStore";
import { PENALTY_TYPES } from "@/enums/PenaltyTypes.enum";
import PenaltyModal from "../components/Penalty/PenaltyModal.vue";
import { TransactionStore } from "@/stores/TransactionStore";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import { storeToRefs } from "pinia";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";
import { getPublicOperationsStatus } from "@/services/controlCenterApi";
import type { PublicOperationsStatus } from "@/interfaces/ControlCenter/ControlCenter.model";
import { helperStore } from "@/helper";
import { buildOperationsBlockedMessage } from "../operationsStatus";

const twoFactor = TwoFactorAuthStore();
const publicStatus = ref<PublicOperationsStatus | null>(null);
const helper = helperStore();
const operationsStatusLoading = ref(true);
const operationsStatusError = ref("");

const confirmOrderStore = ConfirmOrderStore();
const transactionStore = TransactionStore();
transactionStore.typeOrder = OrderTypes.COMPRA;
const { form } = storeToRefs(confirmOrderStore);
form.value.type = OrderTypes.COMPRA;
transactionStore.showPreviewOrder = false;

const backStep = () => {
  confirmatedOrder.value = false;
  transactionStore.showPreviewOrder = false;
};

const nextStep = () => {
  confirmatedOrder.value = true;
  transactionStore.showPreviewOrder = true;
};

const confirmatedOrder = ref(false);
const havePenalization = ref(false);
const refreshPublicOperationsStatus = async (): Promise<boolean> => {
  operationsStatusLoading.value = true;
  try {
    const res = await getPublicOperationsStatus();
    publicStatus.value = res.data.data;
    operationsStatusError.value = "";
    return true;
  } catch {
    publicStatus.value = null;
    operationsStatusError.value =
      "No fue posible verificar la disponibilidad operativa de compras. Intenta nuevamente en unos minutos.";
    return false;
  } finally {
    operationsStatusLoading.value = false;
  }
};

const createOrder2 = () => {
  if (operationsBlockedMessage.value) return;
  if (havePenalization.value) return;
  // if(localStorage.getItem('2fa')){
  twoFactor.modal = true;
  twoFactor.newFlow = true;
  twoFactor.callback = {
    fn: completeOrder,
  };
  // twoFactor.ejectFunction2(changePassword)
  // }
};
const completeOrder = async () => {
  transactionStore.showPreviewOrder = false;
  return await confirmOrderStore.createOrder(OrderTypes.COMPRA);
};

const operationsBlockedMessage = computed(() => {
  return buildOperationsBlockedMessage(
    "buy",
    publicStatus.value,
    operationsStatusLoading.value,
    operationsStatusError.value,
  );
});

const manualModeMessage = computed(() => {
  if (!publicStatus.value?.manual_mode || operationsBlockedMessage.value) return "";
  return publicStatus.value.public_message || "Esta operacion sera revisada manualmente y puede tardar mas.";
});

onMounted(async () => {
  await refreshPublicOperationsStatus();
});
</script>
