import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { helperStore } from "@/helper";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";

export interface XcopSummary {
  available_balance: string;
  pending_withdrawals: string;
  total_balance: string;
  currency: "XCOP";
  decimals: number;
  transfers_enabled: boolean;
  withdrawals_enabled: boolean;
  polygon_enabled: boolean;
  minimum_transfer: string;
  minimum_withdrawal: string;
  withdrawal_fee: string;
}

export interface XcopMovement {
  public_reference: string;
  type: string;
  direction: "in" | "out";
  amount: string;
  currency: "XCOP";
  balance_effect: string;
  status: string;
  counterparty: {
    username: string;
    display_name: string;
  } | null;
  related_reference: string | null;
  description: string | null;
  created_at: string;
}

export interface XcopWithdrawal {
  public_reference: string;
  workflow_status: string;
  amount: string;
  fee: string;
  total_debit: string;
  destination: {
    available: boolean;
    destination_type: "bank_account" | "polygon" | "legacy_crypto";
    masked_account: string | null;
    masked_address: string | null;
    legacy_pending_recapture: boolean;
  };
  requested_at: string;
  can_cancel: boolean;
}

export const XcopStore = defineStore("xcop", () => {
  const helper = helperStore();
  const summary = ref<XcopSummary | null>(null);
  const movements = ref<XcopMovement[]>([]);
  const withdrawals = ref<XcopWithdrawal[]>([]);
  const loading = ref(false);
  const summaryLoading = ref(false);
  const summaryError = ref("");

  const fee = computed(() => summary.value?.withdrawal_fee ?? "0");

  const loadSummary = async (): Promise<void> => {
    summaryLoading.value = true;
    summaryError.value = "";
    try {
      const response = await helper.http("xcop/summary", "get", {}, "", true);
      summary.value = response.data;
    } catch {
      summary.value = null;
      summaryError.value = "No fue posible consultar el saldo XCOP.";
      throw new Error(summaryError.value);
    } finally {
      summaryLoading.value = false;
    }
  };

  const refresh = async (): Promise<void> => {
    loading.value = true;
    try {
      const [summaryResponse, movementResponse, withdrawalResponse] = await Promise.all([
        helper.http("xcop/summary", "get", {}, "", true),
        helper.http("xcop/movements", "get", { params: { per_page: 8 } }, "", true),
        helper.http("xcop/withdrawals", "get", {}, "", true),
      ]);
      summary.value = summaryResponse.data;
      movements.value = movementResponse.data.data ?? [];
      withdrawals.value = withdrawalResponse.data.data ?? [];
    } finally {
      loading.value = false;
    }
  };

  const cancelWithdrawal = async (withdrawal: XcopWithdrawal): Promise<void> => {
    if (!withdrawal.can_cancel) return;
    const data = { public_reference: withdrawal.public_reference };
    const scope = `xcop-withdrawal-cancel-${withdrawal.public_reference}`;
    await helper.http(
      `xcop/withdrawals/${withdrawal.public_reference}/cancel`,
      "post",
      { data },
      "",
      false,
      {
        idempotent: true,
        idempotencyKey: createOperationKey(scope, data),
        financialScope: "finance.xcop",
      },
    );
    clearOperationKey(scope);
    await refresh();
  };

  return {
    summary,
    movements,
    withdrawals,
    loading,
    summaryLoading,
    summaryError,
    fee,
    loadSummary,
    refresh,
    cancelWithdrawal,
  };
});
