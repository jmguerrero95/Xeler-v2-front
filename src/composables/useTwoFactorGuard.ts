import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";
import type { FinancialStepUpScope } from "@/services/securityStepUp";

type SensitiveAction = () => unknown | Promise<unknown>;

export const useTwoFactorGuard = () => {
  const twoFactor = TwoFactorAuthStore();

  const hasTwoFactorEnabled = (): boolean => {
    return !!localStorage.getItem("2fa");
  };

  const runWithTwoFactor = async (action: SensitiveAction, scope: FinancialStepUpScope): Promise<void> => {
    // `requireTwoFactor` means the action must never execute immediately.
    // Users without 2FA confirm their password; users with 2FA confirm the
    // authenticator code. TwoFactorAuthStore.ejectFunction2 chooses the
    // corresponding backend endpoint and invokes this callback only after
    // successful verification.
    twoFactor.code = "";
    twoFactor.password = "";
    twoFactor.requirePasswordAndTotp = false;
    twoFactor.passwordOnly = false;
    twoFactor.financialFlow = true;
    twoFactor.newFlow = true;
    twoFactor.callback = {
      fn: action,
    };
    twoFactor.requestedScope = scope;
    twoFactor.modal = true;
  };

  // Each awaited call acquires its own one-time grant. This also supports
  // beneficiary -> external account without sharing a consumed grant.
  const authorizeWithTwoFactor = <T>(action: () => Promise<T>, scope: FinancialStepUpScope): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      void runWithTwoFactor(async () => {
        try { const result = await action(); resolve(result); }
        catch (error) { reject(error); throw error; }
      }, scope);
      twoFactor.cancelAction = () => reject(new Error("Autorización cancelada."));
    });

  return {
    hasTwoFactorEnabled,
    runWithTwoFactor,
    authorizeWithTwoFactor,
  };
};
