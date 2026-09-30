import { apiClient } from "@/services/apiClient";
import type {
  CryptoProviderAccount,
  CryptoProviderAccountPayload,
  CryptoProviderConfig,
  CryptoProviderConfigPayload,
} from "@/interfaces/Crypto/Crypto.model";

export interface CryptoProviderListParams {
  page?: number;
  per_page?: number;
  provider?: string;
  currency?: string;
  network?: string;
  enabled?: boolean | string;
}

export const listCryptoProviders = (params: CryptoProviderListParams = {}) =>
  apiClient.get<{ data: CryptoProviderConfig[]; meta?: unknown }>("admin/crypto/providers", { params });

export const listCryptoProviderAccounts = () =>
  apiClient.get<{ data: CryptoProviderAccount[] }>("admin/crypto/providers/accounts");

export const getCryptoProviderAccount = (provider: string) =>
  apiClient.get<{ data: CryptoProviderAccount }>(`admin/crypto/providers/accounts/${provider}`);

export const updateCryptoProviderAccount = (provider: string, payload: CryptoProviderAccountPayload) =>
  apiClient.patch<{ data: CryptoProviderAccount }>(`admin/crypto/providers/accounts/${provider}`, payload, {
    idempotent: true,
    financialScope: "finance.financial_configuration",
  });

export const getCryptoProvider = (id: string | number) =>
  apiClient.get<{ data: CryptoProviderConfig }>(`admin/crypto/providers/${id}`);

export const createCryptoProvider = (payload: CryptoProviderConfigPayload) =>
  apiClient.post<{ data: CryptoProviderConfig }>("admin/crypto/providers", payload, {
    idempotent: true,
    financialScope: "finance.financial_configuration",
  });

export const updateCryptoProvider = (id: string | number, payload: Partial<CryptoProviderConfigPayload>) =>
  apiClient.patch<{ data: CryptoProviderConfig }>(`admin/crypto/providers/${id}`, payload, {
    idempotent: true,
    financialScope: "finance.financial_configuration",
  });

export const testCryptoProviderConnection = (id: string | number) =>
  apiClient.post<{ data: unknown }>(`admin/crypto/providers/${id}/test-connection`, {}, {
    idempotent: true,
    financialScope: "finance.financial_configuration",
  });
