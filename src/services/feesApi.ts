import { apiClient } from "@/services/apiClient";

interface ResourceEnvelope<T> {
  data: T;
}

export type ResourceCollection = unknown[] | { data: unknown[] };

export const feesApi = {
  list: async () => (await apiClient.get<ResourceEnvelope<ResourceCollection>>("admin/fees")).data.data,
  create: (data: Record<string, unknown>) => apiClient.post("admin/fees", data, { financialScope: "finance.financial_configuration" }),
  update: (id: number, data: Record<string, unknown>) => apiClient.put(`admin/fees/${id}`, data, { financialScope: "finance.financial_configuration" }),
  toggle: (id: number, active: boolean, reason?: string) => apiClient.post(`admin/fees/${id}/toggle`, { active, reason }, { financialAction: true }),
  exemptions: async () => (await apiClient.get<ResourceEnvelope<ResourceCollection>>("admin/fees/exemptions/list")).data.data,
  userCatalog: async (query: string) => (await apiClient.get<ResourceEnvelope<unknown[]>>("admin/fees/catalog/users", { params: { query } })).data.data,
  companyCatalog: async (query: string) => (await apiClient.get<ResourceEnvelope<unknown[]>>("admin/fees/catalog/companies", { params: { query } })).data.data,
  createExemption: (data: Record<string, unknown>) => apiClient.post("admin/fees/exemptions", data, { financialAction: true }),
  updateExemption: (id: number, data: Record<string, unknown>) => apiClient.put(`admin/fees/exemptions/${id}`, data, { financialAction: true }),
  toggleExemption: (id: number, active: boolean, reason: string) => apiClient.post(`admin/fees/exemptions/${id}/toggle`, { active, reason }, { financialAction: true }),
  preview: async (data: Record<string, unknown>) => (await apiClient.post<ResourceEnvelope<Record<string, unknown>>>("admin/fees/preview", data)).data.data,
  adjustOrder: (orderId: number, data: Record<string, unknown>) => apiClient.post(`admin/fees/orders/${orderId}/adjustments`, data, { financialAction: true }),
};
