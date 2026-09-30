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
  <InitSell v-if="!operationsBlockedMessage" @click:continue="createOrder2"> </InitSell>
  <template v-if="!operationsBlockedMessage">
    <div class="text-table mt-7">
      La disponibilidad y las restricciones operativas se validan siempre contra el backend antes de crear la orden.
    </div>
    <PenaltyModal
      @have-penalization="(value) => (havePenalization = value)"
      :TypePenalty="PENALTY_TYPES.VENTA"
    ></PenaltyModal>
  </template>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import InitSell from "./InitSell.vue";
import { PENALTY_TYPES } from "@/enums/PenaltyTypes.enum";
import PenaltyModal from "../components/Penalty/PenaltyModal.vue";
import { TransactionStore } from "@/stores/TransactionStore";
import { ConfirmOrderStore } from "../Compra/CompraStore";
import { storeToRefs } from "pinia";
import { OrderTypes } from "@/enums/OrderTypes.enum";
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
const { form } = storeToRefs(confirmOrderStore);
form.value.type = OrderTypes.VENTA;

const transactionStore = TransactionStore();
transactionStore.showPreviewOrder = false;
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
      "No fue posible verificar la disponibilidad operativa de ventas. Intenta nuevamente en unos minutos.";
    return false;
  } finally {
    operationsStatusLoading.value = false;
  }
};

const createOrder2 = async () => {
  if (operationsBlockedMessage.value) return;
  if (havePenalization.value) return;

  // if(localStorage.getItem('2fa')){
  twoFactor.modal = true;
  twoFactor.newFlow = true;
  twoFactor.callback = {
    fn: completeOrder,
  };
  // twoFactor.ejectFunction2(changePassword)
  //   return;
  // }
  //   completeOrder();
};

const completeOrder = async () => {
  form.value.address_send = "";
  return await confirmOrderStore.createOrder(OrderTypes.VENTA);
};

const operationsBlockedMessage = computed(() => {
  return buildOperationsBlockedMessage(
    "sell",
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
