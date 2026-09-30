import { apiClient } from "@/services/apiClient";

export interface AdminAuditListParams {
  page?: number;
  per_page?: number;
  action?: string;
  user_id?: string | number;
  entity_type?: string;
  entity_id?: string | number;
  request_id?: string;
  date_from?: string;
  date_to?: string;
  timezone?: string;
}

export interface AdminAuditLog {
  id: number;
  user?: { id: number; name?: string; email?: string } | null;
  user_id?: number | null;
  action?: string | null;
  entity_type?: string | null;
  entity_id?: string | number | null;
  ip?: string | null;
  user_agent?: string | null;
  request_id?: string | null;
  reason?: string | null;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at?: string | null;
}

export const listAdminAuditLogs = (params: AdminAuditListParams = {}) =>
  apiClient.get<{ data: AdminAuditLog[]; meta?: unknown }>("admin/audit-logs", { params });

export const getAdminAuditLog = (id: string | number) =>
  apiClient.get<{ data: AdminAuditLog }>(`admin/audit-logs/${id}`);
