export const financialStepUpScopes = [
  "finance.xcop", "finance.crypto_payout", "finance.financial_destination",
  "finance.financial_configuration", "finance.order_admin",
  "finance.international_accounts", "admin.security",
] as const;
export type FinancialStepUpScope = typeof financialStepUpScopes[number];
export const financialScopeForPath = (path: string): FinancialStepUpScope => {
  const normalized = path.replace(/^https?:\/\/[^/]+\//, "").replace(/^\/?api\//, "").replace(/^\//, "");
  if (/^(xcop|admin\/xcop|withdrawal\/xcop|users\/send\/xcop)/.test(normalized)) return "finance.xcop";
  if (/^admin\/crypto\/(?!providers(?:\/|$))/.test(normalized)) return "finance.crypto_payout";
  if (/^(company\/(account|wallet)|client\/(account|wallet)|breb\/keys|admin\/breb)/.test(normalized)) return "finance.financial_destination";
  if (/^(international-accounts|admin\/international-accounts)/.test(normalized)) return "finance.international_accounts";
  if (/^(admin\/administrators|admin\/users|users|roles|permissions)/.test(normalized)) return "admin.security";
  if (/^(order|admin\/orders|admin\/backoffice\/orders)/.test(normalized)) return "finance.order_admin";
  return "finance.financial_configuration";
};
const grants = new Map<FinancialStepUpScope, string>();

export const storeFinancialStepUp = (scope: FinancialStepUpScope, value: string): void => { grants.set(scope, value); };
export const takeFinancialStepUp = (scope: FinancialStepUpScope): string | null => {
  const value = grants.get(scope) ?? null;
  grants.delete(scope);
  return value;
};
export const clearFinancialStepUp = (): void => { grants.clear(); };
