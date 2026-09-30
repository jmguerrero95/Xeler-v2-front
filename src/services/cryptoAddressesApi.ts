import { apiClient } from "@/services/apiClient";
import type { CryptoAddress } from "@/interfaces/Crypto/Crypto.model";

export interface CryptoAddressListParams {
  page?: number;
  per_page?: number;
  provider?: string;
  currency?: string;
  network?: string;
  status?: string;
  address?: string;
  order_id?: string | number;
  user_id?: string | number;
  date_from?: string;
  date_to?: string;
}

export const listCryptoAddresses = (params: CryptoAddressListParams = {}) =>
  apiClient.get<{ data: CryptoAddress[]; meta?: unknown }>("admin/crypto/addresses", { params });

export const getCryptoAddress = (id: string | number) =>
  apiClient.get<{ data: CryptoAddress }>(`admin/crypto/addresses/${id}`);
