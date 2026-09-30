import { apiClient } from "@/services/apiClient";
import type { AxiosResponse } from "axios";

export interface BrebKey {
  id: string;
  selection_id: number;
  key_type: "phone" | "email" | "document" | "alphanumeric";
  masked_value: string;
  owner_type: "user" | "company" | "platform";
  company_id?: number | null;
  bank_id?: number | null;
  owner_display?: string;
  holder_name: string;
  bank_name?: string | null;
  status: "draft" | "pending_review" | "verified" | "rejected" | "disabled";
  is_favorite: boolean;
  is_default: boolean;
  rejection_reason?: string | null;
  instructions?: string | null;
  daily_min_cop?: string | null;
  daily_max_cop?: string | null;
}

interface ResourceEnvelope<T> {
  data: T;
}

interface BrebResource {
  id: string;
  attributes?: Omit<BrebKey, "id">;
}

const unwrap = (resource: BrebResource): BrebKey => ({
  id: resource.id,
  ...(resource.attributes ?? {}),
} as BrebKey);
const collection = (
  response: AxiosResponse<ResourceEnvelope<BrebResource[]>>,
): BrebKey[] => response.data.data.map(unwrap);

export const brebApi = {
  list: async () => collection(await apiClient.get<ResourceEnvelope<BrebResource[]>>("breb/keys")),
  create: async (data: Record<string, unknown>) => unwrap((await apiClient.post<ResourceEnvelope<BrebResource>>("breb/keys", data, { idempotent: true, financialScope: "finance.financial_destination" })).data.data),
   update: async (id: string, data: Record<string, unknown>) => unwrap((await apiClient.put<ResourceEnvelope<BrebResource>>(`breb/keys/${id}`, data, { idempotent: true, financialScope: "finance.financial_destination" })).data.data),
  submit: (id: string) => apiClient.post(`breb/keys/${id}/submit`, {}, { idempotent: true, financialScope: "finance.financial_destination" }),
  disable: (id: string) => apiClient.post(`breb/keys/${id}/disable`, {}, { idempotent: true, financialScope: "finance.financial_destination" }),
  remove: (id: string) => apiClient.delete(`breb/keys/${id}`, { idempotent: true, financialScope: "finance.financial_destination" }),
  favorite: (id: string, active: boolean) => apiClient.post(`breb/keys/${id}/${active ? "set" : "clear"}-favorite`, {}, { idempotent: true }),
  pending: async () => collection(await apiClient.get<ResourceEnvelope<BrebResource[]>>("admin/breb/keys/pending")),
  adminShow: async (id: string) => (await apiClient.get<ResourceEnvelope<BrebResource>>(`admin/breb/keys/${id}`)).data.data,
  review: (id: string, decision: string, reason?: string) => apiClient.post(`admin/breb/keys/${id}/review`, { decision, reason }, { financialScope: "finance.financial_destination" }),
  platform: async () => collection(await apiClient.get<ResourceEnvelope<BrebResource[]>>("admin/breb/platform-keys")),
  createPlatform: (data: Record<string, unknown>) => apiClient.post("admin/breb/platform-keys", data, { financialScope: "finance.financial_destination" }),
  updatePlatform: (id: string, data: Record<string, unknown>) => apiClient.put(`admin/breb/platform-keys/${id}`, data, { financialScope: "finance.financial_destination" }),
};

export const destinationFavoritesApi = {
  wallet: (id: number, active: boolean) => apiClient.post(`client/wallet/${id}/${active ? "set" : "clear"}-favorite`, {}, { idempotent: true }),
  account: (id: number, active: boolean) => apiClient.post(`client/account/${id}/${active ? "set" : "clear"}-favorite`, {}, { idempotent: true }),
};
