import { apiClient } from "./apiClient";
import { createOperationKey, clearOperationKey } from "./idempotency";
import type { CryptoTransaction } from "@/interfaces/Crypto/Crypto.model";

export const createCryptoPayoutForOrder = async (
  orderId: number,
  twoFactorCode?: string,
): Promise<CryptoTransaction> => {
  const idempotencyPayload = { order_id: orderId };
  const payload = {
    ...idempotencyPayload,
    ...(twoFactorCode ? { two_factor_code: twoFactorCode } : {}),
  };
  const scope = `crypto-payout-order-${orderId}`;
  const response = await apiClient.post<{ data: CryptoTransaction }>(
    "admin/crypto/payouts",
    payload,
    {
      idempotent: true,
      financialScope: "finance.crypto_payout",
      idempotencyKey: createOperationKey(scope, idempotencyPayload),
    },
  );
  clearOperationKey(scope);

  return response.data.data;
};

export const approveCryptoPaymentProof = async (orderId: number): Promise<void> => {
  const payload = {};
  const scope = `crypto-payment-proof-approve-${orderId}`;
  await apiClient.post(
    `admin/crypto/orders/${orderId}/payment-proof/approve`,
    payload,
    {
      idempotent: true,
      financialScope: "finance.crypto_payout",
      idempotencyKey: createOperationKey(scope, { order_id: orderId }),
    },
  );
  clearOperationKey(scope);
};

export const retryCryptoPayoutForOrder = async (orderId: number, twoFactorCode?: string): Promise<void> => {
  const payload = twoFactorCode ? { two_factor_code: twoFactorCode } : {};
  const scope = `crypto-payout-retry-${orderId}`;
  await apiClient.post(`admin/crypto/orders/${orderId}/payout/retry`, payload, {
    idempotent: true,
    financialScope: "finance.crypto_payout",
    idempotencyKey: createOperationKey(scope, { order_id: orderId }),
  });
  clearOperationKey(scope);
};
