import { apiClient } from "@/services/apiClient";

export interface GatewayStatusParams {
  provider?: string;
  action?: string;
}

export interface GatewayStatus {
  provider?: string | null;
  action?: string | null;
  state?: string | null;
  healthy?: boolean;
  configured?: boolean | null;
  external_calls_enabled?: boolean | null;
  driver?: string | null;
  operational_status?: string | null;
  consecutive_failures?: number;
  opened_at?: string | null;
  next_attempt_at?: string | null;
  last_error?: string | null;
  circuit_breaker_enabled?: boolean;
  timeout_seconds?: number;
  retry_attempts?: number;
  checked_at?: string | null;
}

export const listGatewayStatus = (params: GatewayStatusParams = {}) =>
  apiClient.get<{ data: GatewayStatus[]; meta?: unknown }>(
    "admin/gateways/status",
    { params },
  );

export const getGatewayStatus = (
  provider: string,
  params: GatewayStatusParams = {},
) =>
  apiClient.get<{ data: GatewayStatus[]; meta?: unknown }>(
    `admin/gateways/status/${provider}`,
    { params },
  );
