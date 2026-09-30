import { apiClient } from "@/services/apiClient";

export interface OutboxEvent {
  id: number | string;
  uuid?: string | null;
  event_type?: string | null;
  status?: string | null;
  attempts?: number | null;
  max_attempts?: number | null;
  available_at?: string | null;
  locked_until?: string | null;
  processed_at?: string | null;
  failed_at?: string | null;
  dead_at?: string | null;
  last_error?: string | null;
  operation_key?: string | null;
  idempotency_key?: string | null;
  aggregate?: {
    type?: string | null;
    id?: string | number | null;
  } | null;
  related?: {
    type?: string | null;
    id?: string | number | null;
  } | null;
  channel?: string | null;
  destination?: string | null;
  created_by?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
  payload?: unknown;
  headers?: unknown;
}

export interface OutboxStats {
  totals?: Record<string, number>;
  counts_by_status?: Record<string, number>;
  pending_by_event_type?: Record<string, number>;
  failed_by_event_type?: Record<string, number>;
  oldest_pending?: string | null;
  average_pending_seconds?: number | null;
  total?: number;
}

export interface OutboxListParams {
  page?: number;
  per_page?: number;
  status?: string;
  event_type?: string;
  aggregate_type?: string;
  aggregate_id?: string;
  operation_key?: string;
  created_from?: string;
  created_to?: string;
  available_from?: string;
  available_to?: string;
}

export const listOutboxEvents = (params: OutboxListParams = {}) =>
  apiClient.get<{ data: OutboxEvent[]; meta?: unknown }>("admin/outbox", {
    params,
  });

export const getOutboxStats = (params: Record<string, unknown> = {}) =>
  apiClient.get<{ data: OutboxStats }>("admin/outbox/stats", { params });

export const getOutboxEvent = (id: string | number) =>
  apiClient.get<{ data: OutboxEvent }>(`admin/outbox/${id}`);

export const retryOutboxEvent = (
  id: string | number,
  payload: { reset_attempts?: boolean; dispatch?: boolean } = {},
) =>
  apiClient.post<{ data: OutboxEvent }>(`admin/outbox/${id}/retry`, {
    reset_attempts: payload.reset_attempts ?? true,
    dispatch: payload.dispatch ?? true,
  }, { financialScope: "finance.financial_configuration" });

export const requeueOutboxEvent = (
  id: string | number,
  payload: { dispatch?: boolean } = {},
) =>
  apiClient.post<{ data: OutboxEvent }>(`admin/outbox/${id}/requeue`, {
    dispatch: payload.dispatch ?? true,
  }, { financialScope: "finance.financial_configuration" });

export const markOutboxEventDead = (
  id: string | number,
  payload: Record<string, unknown> = {},
) => apiClient.post<{ data: OutboxEvent }>(`admin/outbox/${id}/mark-dead`, payload, { financialScope: "finance.financial_configuration" });
