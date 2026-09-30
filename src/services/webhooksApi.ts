import { apiClient } from "@/services/apiClient";

export interface WebhookEventListParams {
  page?: number;
  per_page?: number;
  provider?: string;
  event_type?: string;
  status?: string;
  signature_valid?: boolean | string;
  replay_detected?: boolean | string;
  date_from?: string;
  date_to?: string;
}

export interface WebhookEvent {
  id: number;
  provider?: string | null;
  event_id?: string | null;
  event_type?: string | null;
  status?: string | null;
  signature_valid?: boolean;
  replay_detected?: boolean;
  replay_count?: number;
  last_replay_at?: string | null;
  last_replay_reason?: string | null;
  last_replay_ip?: string | null;
  payload_hash?: string | null;
  idempotency_key?: string | null;
  received_at?: string | null;
  processed_at?: string | null;
  failed_at?: string | null;
  attempts?: number;
  max_attempts?: number;
  last_error?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
}

export const listWebhookEvents = (params: WebhookEventListParams = {}) =>
  apiClient.get<{ data: WebhookEvent[]; meta?: unknown }>("admin/webhook-events", { params });

export const getWebhookEvent = (id: string | number) =>
  apiClient.get<{ data: WebhookEvent }>(`admin/webhook-events/${id}`);

export const reprocessWebhookEvent = (id: string | number) =>
  apiClient.post<{ data: WebhookEvent }>(`admin/webhook-events/${id}/reprocess`, {}, {
    financialAction: true,
    idempotent: true,
  });
