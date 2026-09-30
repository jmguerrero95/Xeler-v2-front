import { apiClient } from "@/services/apiClient";

export interface RiskGuardStatus {
  enabled?: boolean;
  flags?: Record<string, unknown>;
  limits?: Record<string, unknown>;
  readiness?: Record<string, unknown>;
  open_high_critical_reconciliations?: number;
  blocked_conditions?: string[];
  generated_at?: string;
  [key: string]: unknown;
}

export const getRiskGuards = () =>
  apiClient.get<{ data: RiskGuardStatus }>("admin/risk/guards");

