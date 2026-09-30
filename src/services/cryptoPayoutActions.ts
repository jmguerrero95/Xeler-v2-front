export type CryptoPayoutActionAttributes = {
  can_process_crypto_payout?: boolean;
  can_retry_crypto_payout?: boolean;
  can_register_manual_txid?: boolean;
  can_resolve_crypto_transaction?: boolean;
  can_resolve_crypto_reconciliation?: boolean;
  payout_status_label?: string | null;
  process_action_label?: string | null;
};

export const resolveCryptoPayoutActions = (
  attributes: CryptoPayoutActionAttributes | null | undefined,
  hasRequiredPermissions: boolean,
) => ({
  canProcess: hasRequiredPermissions && attributes?.can_process_crypto_payout === true,
  canRetry: hasRequiredPermissions && attributes?.can_retry_crypto_payout === true,
  canRegisterManualTxid: hasRequiredPermissions && attributes?.can_register_manual_txid === true,
  canResolveTransaction: hasRequiredPermissions && attributes?.can_resolve_crypto_transaction === true,
  canResolveReconciliation: hasRequiredPermissions && attributes?.can_resolve_crypto_reconciliation === true,
  statusLabel: attributes?.payout_status_label || null,
  processLabel: attributes?.process_action_label || "Procesar payout",
});
