<template>
  <div>
    <div class="my-3 text-primary font-weight-light text-center font-22">
      Movimientos XCOP
    </div>
    <div v-if="!xcop.movements.length" class="text-center text-table py-4">
      No hay movimientos para mostrar.
    </div>
    <div
      v-for="movement in xcop.movements"
      :key="movement.public_reference"
      class="d-flex justify-space-between align-center border-b-md py-2 ga-2"
    >
      <VIcon
        :icon="movement.direction === 'in' ? 'mdi-arrow-down' : 'mdi-arrow-up'"
        :color="movement.direction === 'in' ? 'success' : 'error'"
      />
      <div class="flex-grow-1">
        <div class="text-primary">{{ movementLabel(movement.type) }}</div>
        <div class="text-caption text-table">
          {{ movement.counterparty?.display_name || movement.counterparty?.username || movement.related_reference || movement.public_reference }}
        </div>
      </div>
      <div class="text-right">
        <div :class="movement.direction === 'in' ? 'text-success' : 'text-error'">
          {{ movement.direction === "in" ? "+" : "-" }}{{ formatDecimalForDisplay(movement.amount, xcop.summary?.decimals ?? 2) }}
        </div>
        <div class="text-caption text-disabled">
          {{ dayjs(movement.created_at).format("DD/MM/YYYY HH:mm") }}
        </div>
        <div class="text-caption">{{ statusLabel(movement.status) }}</div>
      </div>
    </div>

    <div class="my-4 text-primary font-weight-light text-center font-22">
      Retiros recientes
    </div>
    <div
      v-for="withdrawal in xcop.withdrawals"
      :key="withdrawal.public_reference"
      class="border-b-md py-3"
    >
      <div class="d-flex justify-space-between">
        <div>
          <div>{{ statusLabel(withdrawal.workflow_status) }}</div>
          <div class="text-caption text-table">
            {{ withdrawal.public_reference }}
          </div>
          <div class="text-caption">
            {{ withdrawal.destination.masked_account
              || withdrawal.destination.masked_address
              || "Destino pendiente de recaptura" }}
          </div>
        </div>
        <div class="text-right">
          <div>{{ formatDecimalForDisplay(withdrawal.amount, xcop.summary?.decimals ?? 2) }} XCOP</div>
          <div class="text-caption">Fee: {{ formatDecimalForDisplay(withdrawal.fee, xcop.summary?.decimals ?? 2) }}</div>
          <div class="text-caption">Total: {{ formatDecimalForDisplay(withdrawal.total_debit, xcop.summary?.decimals ?? 2) }}</div>
        </div>
      </div>
      <VBtn
        v-if="withdrawal.can_cancel"
        class="mt-2"
        size="small"
        color="warning"
        @click="requestCancel(withdrawal)"
      >
        Cancelar
      </VBtn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XcopStore } from "@/stores/XcopStore";
import dayjs from "dayjs";
import { statusLabel } from "@/utils/statusLabels";
import { onMounted } from "vue";
import { formatDecimalForDisplay } from "@/utils/decimal";
import type { XcopWithdrawal } from "@/stores/XcopStore";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";

const xcop = XcopStore();
const twoFactor = TwoFactorAuthStore();
let pendingCancellation: XcopWithdrawal | null = null;
const emit = defineEmits<{ (e: "changed"): void }>();
onMounted(() => xcop.refresh());

const movementLabel = (type: string) => ({
  transfer: "Transferencia",
  withdrawal: "Retiro",
  withdrawal_refund: "Devolución de retiro",
  adjustment: "Ajuste administrativo",
  reward: "Recompensa",
  fee: "Comisión",
}[type] ?? type);

const cancelWithdrawal = async (withdrawal: XcopWithdrawal) => {
  await xcop.cancelWithdrawal(withdrawal);
  pendingCancellation = null;
  emit("changed");
};

const requestCancel = (withdrawal: XcopWithdrawal) => {
  if (!withdrawal.can_cancel) return;
  pendingCancellation = withdrawal;
  twoFactor.modal = true;
  twoFactor.newFlow = true;
  twoFactor.callback = {
    fn: async () => {
      if (pendingCancellation) await cancelWithdrawal(pendingCancellation);
    },
  };
  twoFactor.requestedScope = "finance.xcop";
};
</script>
