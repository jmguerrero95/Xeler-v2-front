export type PayoutReconciliationAction = "transmitted" | "not_transmitted";

export type PayoutReconciliationPayload = {
  action: PayoutReconciliationAction;
  txid?: string;
  provider_reference?: string;
  reason: string;
  evidence?: string;
  confirmation?: boolean;
  two_factor_code?: string;
};

export const validatePayoutReconciliation = (payload: PayoutReconciliationPayload): string | null => {
  if (!payload.reason.trim()) return "Debes registrar el motivo de la conciliacion.";
  if (payload.action === "transmitted" && !payload.txid?.trim()) {
    return "Debes registrar el TXID confirmado por el proveedor.";
  }
  if (payload.action === "not_transmitted" && payload.confirmation !== true) {
    return "Debes confirmar que verificaste que el proveedor no transmitio el envio.";
  }

  return null;
};
