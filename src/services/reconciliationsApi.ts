import { apiClient } from "@/services/apiClient";

export interface LedgerReconciliation {
  id: number | string;
  uuid?: string | null;
  entity_type?: string | null;
  entity_id?: string | number | null;
  balance_type?: string | null;
  legacy_balance?: string | null;
  ledger_balance?: string | null;
  difference?: string | null;
  currency?: string | null;
  status?: string | null;
  severity?: string | null;
  detected_by?: string | null;
  operation_key?: string | null;
  metadata?: Record<string, unknown> | null;
  reconciled_at?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | number | null;
  resolution_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ReconciliationListParams {
  page?: number;
  per_page?: number;
  severity?: string;
  status?: string;
  entity_type?: string;
  entity_id?: string;
  balance_type?: string;
  operation_key?: string;
  unresolved?: boolean;
}

export const listReconciliations = (
  params: ReconciliationListParams = {},
) =>
  apiClient.get<{ data: LedgerReconciliation[]; meta?: unknown }>(
    "admin/ledger/reconciliations",
    { params },
  );

export const getReconciliation = (id: string | number) =>
  apiClient.get<{ data: LedgerReconciliation }>(
    `admin/ledger/reconciliations/${id}`,
  );

export const resolveReconciliation = (id: string | number, notes: string) =>
  apiClient.post<{ data: LedgerReconciliation }>(
    `admin/ledger/reconciliations/${id}/resolve`,
    { notes },
    { financialScope: "finance.financial_configuration" },
  );

export const ignoreReconciliation = (id: string | number, notes: string) =>
  apiClient.post<{ data: LedgerReconciliation }>(
    `admin/ledger/reconciliations/${id}/ignore`,
    { notes },
    { financialScope: "finance.financial_configuration" },
  );

export const reopenReconciliation = (id: string | number, notes?: string) =>
  apiClient.post<{ data: LedgerReconciliation }>(
    `admin/ledger/reconciliations/${id}/reopen`,
    notes ? { notes } : {},
    { financialScope: "finance.financial_configuration" },
  );
