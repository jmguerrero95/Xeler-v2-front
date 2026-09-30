import { apiClient } from "@/services/apiClient";
import type {
  ControlCenterStatus,
  CryptoOperationControl,
  EmergencyStopEvent,
  PublicOperationsStatus,
  SystemOperationControl,
  InternationalAccountOperationControl,
} from "@/interfaces/ControlCenter/ControlCenter.model";

export const getControlCenterStatus = () =>
  apiClient.get<{ data: ControlCenterStatus }>("admin/control-center/status");

export const updateSystemControl = (payload: Partial<SystemOperationControl>) =>
  apiClient.patch<{ data: SystemOperationControl }>("admin/control-center/system", payload, {
    idempotent: true,
    financialScope: "finance.financial_configuration",
  });

export const getCurrencyOperationControls = () =>
  apiClient.get<{ data: CryptoOperationControl[] }>("admin/control-center/currencies");

export const updateInternationalAccountControl = (payload: Partial<InternationalAccountOperationControl> & { reason: string }) =>
  apiClient.patch<{ data: InternationalAccountOperationControl }>(
    "admin/control-center/international-accounts",
    payload,
    { idempotent: true, financialScope: "finance.financial_configuration" },
  );

export const updateCurrencyOperationControl = (
  id: string | number,
  payload: Partial<CryptoOperationControl>,
) =>
  apiClient.patch<{ data: CryptoOperationControl }>(`admin/control-center/currencies/${id}`, payload, {
    idempotent: true,
    financialScope: "finance.financial_configuration",
  });

export const updateManualMode = (payload: {
  enabled: boolean;
  reason?: string | null;
  public_message?: string | null;
}) =>
  apiClient.post<{ data: SystemOperationControl }>("admin/control-center/manual-mode", payload, {
    idempotent: true,
    financialScope: "finance.financial_configuration",
  });

export const activateEmergencyStop = (payload: { reason: string; public_message?: string | null }) =>
  apiClient.post<{ data: EmergencyStopEvent }>("admin/control-center/emergency/activate", payload, {
    idempotent: true,
    financialScope: "finance.financial_configuration",
  });

export const requestEmergencyUnlock = (payload: { email?: string | null; phone?: string | null }) =>
  apiClient.post<{ data: EmergencyStopEvent }>("admin/control-center/emergency/request-unlock", payload, {
    idempotent: true,
    financialScope: "finance.financial_configuration",
  });

export const confirmEmergencyUnlock = (payload: { email_code: string; sms_code: string }) =>
  apiClient.post<{ data: EmergencyStopEvent }>("admin/control-center/emergency/confirm-unlock", payload, {
    idempotent: true,
    financialScope: "finance.financial_configuration",
  });

export const syncCryptoProvidersFromConfig = () =>
  apiClient.post<{ data: {
    accounts_created: number;
    accounts_updated: number;
    configs_created: number;
    configs_updated: number;
    skipped: number;
    details: Record<string, unknown>[];
  } }>(
    "admin/control-center/crypto-providers/sync-from-config",
    {},
    { idempotent: true, financialScope: "finance.financial_configuration" },
  );

export const getPublicOperationsStatus = () =>
  apiClient.get<{ data: PublicOperationsStatus }>("operations/status");
