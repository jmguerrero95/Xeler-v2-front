import { apiClient } from "@/services/apiClient";
import type { CryptoTransaction } from "@/interfaces/Crypto/Crypto.model";
import type { PayoutReconciliationPayload } from "@/services/cryptoPayoutReconciliation";

export interface CryptoTransactionListParams {
  page?: number;
  per_page?: number;
  provider?: string;
  currency?: string;
  network?: string;
  status?: string;
  direction?: string;
  address?: string;
  txid?: string;
  order_id?: string | number;
  user_id?: string | number;
  date_from?: string;
  date_to?: string;
}

export const listCryptoTransactions = (params: CryptoTransactionListParams = {}) =>
  apiClient.get<{ data: CryptoTransaction[]; meta?: unknown }>("admin/crypto/transactions", { params });

export const getCryptoTransaction = (id: string | number) =>
  apiClient.get<{ data: CryptoTransaction }>(`admin/crypto/transactions/${id}`);

export const resolveCryptoTransaction = (
  id: string | number,
  payload: { action: "accept_confirmed" | "reject" | "manual_review"; note?: string },
) =>
  apiClient.post<{ data: CryptoTransaction }>(`admin/crypto/transactions/${id}/resolve`, payload, {
    idempotent: true,
    financialAction: true,
  });

export const resolveCryptoPayoutReconciliation = (
  id: string | number,
  payload: PayoutReconciliationPayload,
) =>
  apiClient.post<{ data: CryptoTransaction }>(
    `admin/crypto/transactions/${id}/resolve-reconciliation`,
    payload,
    { idempotent: true, financialAction: true },
  );
