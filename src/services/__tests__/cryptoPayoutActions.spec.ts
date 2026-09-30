import { describe, expect, it } from "vitest";
import { resolveCryptoPayoutActions } from "../cryptoPayoutActions";

describe("admin crypto payout actions", () => {
  it("shows manual provider payout only when the backend enables it", () => {
    expect(resolveCryptoPayoutActions({ can_process_crypto_payout: true }, true).canProcess).toBe(true);
    expect(resolveCryptoPayoutActions({
      can_process_crypto_payout: false,
      // Operational reasons are display metadata and never grant an action.
      manual_review_reason: "insufficient_liquidity",
    } as any, true).canProcess).toBe(false);
  });

  it("uses the backend liquidity revalidation label without inferring from status", () => {
    const actions = resolveCryptoPayoutActions({
      can_process_crypto_payout: true,
      process_action_label: "Revalidar liquidez y procesar",
    }, true);

    expect(actions.processLabel).toBe("Revalidar liquidez y procesar");
  });

  it("shows retry only for the explicit backend retry flag", () => {
    expect(resolveCryptoPayoutActions({ can_retry_crypto_payout: true }, true).canRetry).toBe(true);
    expect(resolveCryptoPayoutActions({ can_retry_crypto_payout: false }, true).canRetry).toBe(false);
  });

  it("does not show manual TXID registration before the backend approves it", () => {
    expect(resolveCryptoPayoutActions({ can_register_manual_txid: false }, true).canRegisterManualTxid).toBe(false);
    expect(resolveCryptoPayoutActions({ can_register_manual_txid: true }, true).canRegisterManualTxid).toBe(true);
  });

  it("keeps every financial action hidden without both admin permissions", () => {
    const actions = resolveCryptoPayoutActions({
      can_process_crypto_payout: true,
      can_retry_crypto_payout: true,
      can_register_manual_txid: true,
    }, false);

    expect(actions).toEqual({
      canProcess: false,
      canRetry: false,
      canRegisterManualTxid: false,
      canResolveTransaction: false,
      canResolveReconciliation: false,
      statusLabel: null,
      processLabel: "Procesar payout",
    });
  });

  it("uses backend flags to isolate submission and reconciliation actions", () => {
    const submitting = resolveCryptoPayoutActions({
      can_process_crypto_payout: false,
      can_retry_crypto_payout: false,
      can_register_manual_txid: false,
      can_resolve_crypto_transaction: false,
      payout_status_label: "Envío en proceso",
    }, true);
    expect(submitting.statusLabel).toBe("Envío en proceso");
    expect(submitting.canProcess || submitting.canRetry || submitting.canRegisterManualTxid || submitting.canResolveTransaction).toBe(false);

    const reconciliation = resolveCryptoPayoutActions({
      can_resolve_crypto_transaction: false,
      can_resolve_crypto_reconciliation: true,
    }, true);
    expect(reconciliation.canResolveReconciliation).toBe(true);
    expect(reconciliation.canResolveTransaction).toBe(false);
  });
});
