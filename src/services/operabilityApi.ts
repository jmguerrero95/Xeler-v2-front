import { apiClient } from "@/services/apiClient";

export interface OperabilityListParams {
  page?: number;
  per_page?: number;
  severity?: string;
  method?: string;
  path?: string;
  type?: string;
  only_mismatches?: boolean;
  critical_only?: boolean;
  entity_type?: string;
  user_id?: string | number;
  account_id?: string | number;
  [key: string]: unknown;
}

export interface PreflightCheck {
  key: string;
  status: string;
  severity: string;
  message?: string;
}

export interface SecurityPreflight {
  status: string;
  preintegration_ready: boolean;
  checks: PreflightCheck[];
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  outbox_failed_dead_count: number;
  outbox_failure_threshold: number;
  route_audit?: Record<string, number>;
  webhook_replay_protection?: boolean;
  secret_scan?: Record<string, number>;
  generated_at?: string;
}

export interface LedgerReadiness {
  status: string;
  ready_for_source_of_truth: boolean;
  dataset_representative: boolean;
  source_mode_enabled: boolean;
  source_mode: string;
  decimal_engine?: string;
  source_entities_count: number;
  float_usage_detected: boolean;
  float_usage_summary?: Record<string, unknown>;
  outbox?: { failed_dead_count?: number };
  reconciliations?: { open_high_critical?: number };
  opening_missing?: number;
  opening_duplicates?: number;
  high_critical_open?: number;
  xcop_source_status?: string;
  pending_limit_source_status?: string;
  accumulated_limit_source_status?: string;
  not_ready_reasons?: string[];
  generated_at?: string;
}

export interface RouteAuditFinding {
  method?: string;
  uri?: string;
  path?: string;
  type?: string;
  severity?: string;
  recommendation?: string;
  message?: string;
  middleware?: string[];
  [key: string]: unknown;
}

export interface RouteAuditReport {
  summary: Record<string, number>;
  findings: RouteAuditFinding[];
  counts_by_severity?: Record<string, number>;
  generated_at?: string;
}

export interface FloatUsageReport {
  summary: Record<string, number>;
  findings: Array<Record<string, unknown>>;
  generated_at?: string;
}

export interface SourceModeStatus {
  ledger_use_as_source?: boolean;
  ledger_write_legacy?: boolean;
  ledger_auto_heal_legacy?: boolean;
  ledger_compare_balances?: boolean;
  ledger_strict_mode?: boolean;
  source_flags?: Record<string, boolean>;
  status_per_source?: Record<string, unknown>;
  last_source_events_summary?: Record<string, unknown>;
  open_drift_counts?: Record<string, unknown>;
  generated_at?: string;
  [key: string]: unknown;
}

export interface LedgerAuditBalancesReport {
  total_entities_checked: number;
  total_matches: number;
  total_mismatches: number;
  mismatches_by_severity?: Record<string, number>;
  high_critical_count: number;
  ready_for_source_of_truth: boolean;
  items: Array<Record<string, unknown>>;
  generated_at?: string;
}

export const getSecurityPreflight = () =>
  apiClient.get<{ data: SecurityPreflight }>("admin/security/preflight");

export const getRouteAudit = (params: OperabilityListParams = {}) =>
  apiClient.get<{ data: RouteAuditReport; meta?: unknown }>("admin/security/route-audit", { params });

export const getSecurityFloatUsage = (params: OperabilityListParams = {}) =>
  apiClient.get<{ data: FloatUsageReport; meta?: unknown }>("admin/security/float-usage", { params });

export const getLedgerFloatUsage = (params: OperabilityListParams = {}) =>
  apiClient.get<{ data: FloatUsageReport; meta?: unknown }>("admin/ledger/float-usage", { params });

export const getLedgerReadiness = () =>
  apiClient.get<{ data: LedgerReadiness }>("admin/ledger/readiness");

export const getLedgerAuditBalances = (params: OperabilityListParams = {}) =>
  apiClient.get<{ data: LedgerAuditBalancesReport; meta?: unknown }>("admin/ledger/audit-balances", { params });

export const getLedgerSourceMode = () =>
  apiClient.get<{ data: SourceModeStatus }>("admin/ledger/source-mode");

export const getSourceModeStatus = () =>
  apiClient.get<{ data: SourceModeStatus }>("admin/source-mode/status");

