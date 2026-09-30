import { apiClient } from "@/services/apiClient";
import type {
  InternationalAccountAccess,
  InternationalAccountAdminList,
  InternationalAccountCandidate,
  InternationalAccountClientState,
  InternationalAccountFakeScenario,
  InternationalAccountFakeTarget,
  InternationalAccountOnboardingStart,
  InternationalAccountOnboardingState,
  InternationalAccountProviderState,
  InternationalAccountFiatAccount,
  InternationalAccountFiatAccountDetail,
  InternationalAccountActivity,
  AdminInternationalAccount,
  AdminInternationalAccountDeposit,
  InternationalAccountOperationsSummary,
  InternationalAccountFakeDepositScenario,
  InternationalBeneficiary,
  InternationalExternalAccount,
  InternationalTransferPreview,
  InternationalTransfer,
  AdminInternationalExternalAccount,
  AdminInternationalTransfer,
  InternationalServiceFeeRule,
} from "@/interfaces/InternationalAccounts/InternationalAccounts.model";

export const getInternationalAccountAccess = () =>
  apiClient.get<{ data: InternationalAccountClientState }>(
    "international-accounts/access",
  );

export const isInternationalAccountsMenuAvailable = (
  featureEnabled: boolean,
  context: "admin" | "user",
  canView: boolean,
): boolean => featureEnabled && context === "user" && canView;

export const requestInternationalAccountAccess = (payload: {
  requested_products: Array<"usd" | "eur">;
  use_case: string;
  expected_monthly_volume: string;
  expected_monthly_volume_currency: "usd" | "eur";
}) =>
  apiClient.post<{ data: InternationalAccountAccess }>(
    "international-accounts/access/request",
    payload,
    { idempotent: true },
  );

export const addInternationalAccountProducts = (
  requestedProducts: Array<"usd" | "eur">,
) =>
  apiClient.post<{ data: InternationalAccountAccess }>(
    "international-accounts/access/products",
    { requested_products: requestedProducts },
    { idempotent: true },
  );

export const getInternationalAccountOnboarding = () =>
  apiClient.get<{ data: InternationalAccountOnboardingState }>(
    "international-accounts/onboarding",
    { silent: true },
  );

export const startInternationalAccountOnboarding = () =>
  apiClient.post<{ data: InternationalAccountOnboardingStart }>(
    "international-accounts/onboarding/start",
    {},
    { idempotent: true },
  );

export const refreshInternationalAccountOnboarding = () =>
  apiClient.post<{ data: InternationalAccountOnboardingState }>(
    "international-accounts/onboarding/sync",
    {},
    { idempotent: true, silent: true },
  );

export const getAdminInternationalAccounts = (
  params: Record<string, unknown> = {},
) =>
  apiClient.get<{
    data: InternationalAccountAdminList;
    meta: Record<string, number>;
  }>("admin/international-accounts", { params });

export const markInternationalAccountEligible = (
  userId: number,
  reason: string,
) =>
  apiClient.post<{ data: InternationalAccountAccess }>(
    `admin/international-accounts/users/${userId}/eligibility`,
    { reason },
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const searchInternationalAccountCandidates = (search: string) =>
  apiClient.get<{ data: InternationalAccountCandidate[] }>(
    "admin/international-accounts/users/candidates",
    { params: { search } },
  );

export type InternationalAccountAdminAction =
  | "take-review"
  | "approve"
  | "reject"
  | "suspend";

export const transitionInternationalAccount = (
  accessId: number,
  action: InternationalAccountAdminAction,
  reason: string,
) =>
  apiClient.post<{ data: InternationalAccountAccess }>(
    `admin/international-accounts/${accessId}/${action}`,
    { reason },
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const getInternationalAccountProvider = (accessId: number) =>
  apiClient.get<{ data: InternationalAccountProviderState | null }>(
    `admin/international-accounts/${accessId}/provider`,
  );

export const syncInternationalAccountProvider = (
  accessId: number,
  reason: string,
) =>
  apiClient.post<{ data: InternationalAccountProviderState }>(
    `admin/international-accounts/${accessId}/provider/sync`,
    { reason },
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const simulateInternationalAccountProvider = (
  accessId: number,
  scenario: InternationalAccountFakeScenario,
  reason: string,
  product: InternationalAccountFakeTarget = null,
) =>
  apiClient.post<{ data: InternationalAccountProviderState }>(
    `admin/international-accounts/${accessId}/provider/fake-state`,
    { scenario, reason, product },
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const simulateSandboxKycApproval = (accessId: number, reason: string) =>
  apiClient.post<{ data: InternationalAccountProviderState }>(
    `admin/international-accounts/${accessId}/provider/sandbox-kyc-approval`,
    { reason },
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const getInternationalFiatAccounts = () =>
  apiClient.get<{ data: InternationalAccountFiatAccount[] }>(
    "international-accounts/accounts",
  );

export const activateInternationalFiatAccount = (product: "usd" | "eur") =>
  apiClient.post<{ data: InternationalAccountFiatAccountDetail }>(
    `international-accounts/accounts/${product}/activate`,
    {},
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const getInternationalFiatAccount = (accountId: number) =>
  apiClient.get<{ data: InternationalAccountFiatAccountDetail }>(
    `international-accounts/accounts/${accountId}`,
  );

export const getInternationalFiatAccountActivity = (
  accountId: number,
  params: Record<string, unknown> = {},
) =>
  apiClient.get<{
    data: InternationalAccountActivity[];
    meta: Record<string, number>;
  }>(`international-accounts/accounts/${accountId}/activity`, { params });

export const getAdminInternationalFiatAccounts = (
  params: Record<string, unknown> = {},
) =>
  apiClient.get<{
    data: AdminInternationalAccount[];
    meta: Record<string, unknown> & {
      summary?: InternationalAccountOperationsSummary;
    };
  }>("admin/international-accounts/accounts", { params });

export const syncAdminInternationalFiatAccount = (
  accountId: number,
  reason: string,
) =>
  apiClient.post<{ data: AdminInternationalAccount }>(
    `admin/international-accounts/accounts/${accountId}/sync`,
    { reason },
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const transitionAdminInternationalFiatAccount = (
  accountId: number,
  action: "deactivate" | "reactivate",
  reason: string,
) =>
  apiClient.post<{ data: AdminInternationalAccount }>(
    `admin/international-accounts/accounts/${accountId}/${action}`,
    { reason },
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const getAdminInternationalAccountDeposits = (
  params: Record<string, unknown> = {},
) =>
  apiClient.get<{
    data: AdminInternationalAccountDeposit[];
    meta: Record<string, number>;
  }>("admin/international-accounts/deposits", { params });

export const createFakeInternationalAccountDeposit = (
  accountId: number,
  payload: {
    amount: string;
    scenario: InternationalAccountFakeDepositScenario;
    reason: string;
  },
) =>
  apiClient.post<{ data: AdminInternationalAccountDeposit | null }>(
    `admin/international-accounts/accounts/${accountId}/fake-deposit`,
    payload,
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const advanceFakeInternationalAccountDeposit = (
  depositId: number,
  state: Exclude<InternationalAccountFakeDepositScenario, "complete">,
  reason: string,
) =>
  apiClient.post<{ data: AdminInternationalAccountDeposit }>(
    `admin/international-accounts/deposits/${depositId}/fake-state`,
    { state, reason },
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const reconcileInternationalProviderWallet = (
  walletId: number,
  reason: string,
) =>
  apiClient.post<{ data: unknown[] }>(
    `admin/international-accounts/wallets/${walletId}/reconcile`,
    { reason },
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const getInternationalBeneficiaries = () =>
  apiClient.get<{ data: InternationalBeneficiary[] }>(
    "international-accounts/beneficiaries",
  );

export const createInternationalBeneficiary = (
  payload: Record<string, unknown>,
) =>
  apiClient.post<{ data: InternationalBeneficiary }>(
    "international-accounts/beneficiaries",
    payload,
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const createInternationalExternalAccount = (
  beneficiaryId: number,
  payload: Record<string, unknown>,
) =>
  apiClient.post<{ data: InternationalExternalAccount }>(
    `international-accounts/beneficiaries/${beneficiaryId}/external-accounts`,
    payload,
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const getInternationalExternalAccounts = () =>
  apiClient.get<{ data: InternationalExternalAccount[] }>(
    "international-accounts/external-accounts",
  );

export const previewInternationalTransfer = (
  payload: Record<string, unknown>,
) =>
  apiClient.post<{ data: InternationalTransferPreview }>(
    "international-accounts/transfers/preview",
    payload,
  );

export const createInternationalTransfer = (payload: Record<string, unknown>) =>
  apiClient.post<{ data: InternationalTransfer }>(
    "international-accounts/transfers",
    payload,
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const getInternationalTransfers = (
  params: Record<string, unknown> = {},
) =>
  apiClient.get<{
    data: InternationalTransfer[];
    meta: Record<string, number>;
  }>("international-accounts/transfers", { params, silent: true });

export const getInternationalTransfer = (transferId: number) =>
  apiClient.get<{ data: InternationalTransfer }>(
    `international-accounts/transfers/${transferId}`,
    { silent: true },
  );

export const getAdminInternationalBeneficiaries = (
  params: Record<string, unknown> = {},
) =>
  apiClient.get<{
    data: Array<Record<string, unknown>>;
    meta: Record<string, number>;
  }>("admin/international-accounts/beneficiaries", { params });

export const getAdminInternationalExternalAccounts = (
  params: Record<string, unknown> = {},
) =>
  apiClient.get<{
    data: AdminInternationalExternalAccount[];
    meta: Record<string, number>;
  }>("admin/international-accounts/external-accounts", { params });

export const transitionAdminInternationalExternalAccount = (
  accountId: number,
  action: "sync" | "deactivate" | "reactivate",
  reason: string,
) =>
  apiClient.post<{ data: AdminInternationalExternalAccount }>(
    `admin/international-accounts/external-accounts/${accountId}/${action}`,
    { reason },
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const getAdminInternationalTransfers = (
  params: Record<string, unknown> = {},
) =>
  apiClient.get<{
    data: AdminInternationalTransfer[];
    meta: Record<string, unknown>;
  }>("admin/international-accounts/transfers", { params });

export const mutateAdminInternationalTransfer = (
  transferId: number,
  action: "sync" | "submit" | "cancel" | "fake-state",
  payload: Record<string, unknown>,
) =>
  apiClient.post<{ data: AdminInternationalTransfer }>(
    `admin/international-accounts/transfers/${transferId}/${action}`,
    payload,
    { idempotent: true, financialScope: "finance.international_accounts" },
  );

export const getInternationalServiceFees = () =>
  apiClient.get<{ data: InternationalServiceFeeRule[] }>(
    "admin/international-accounts/fees",
  );

export const updateInternationalServiceFee = (
  ruleId: number,
  payload: Record<string, unknown>,
) =>
  apiClient.patch<{ data: InternationalServiceFeeRule }>(
    `admin/international-accounts/fees/${ruleId}`,
    payload,
    { idempotent: true, financialScope: "finance.international_accounts" },
  );
