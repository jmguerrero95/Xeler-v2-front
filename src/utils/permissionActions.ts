export type CrudAction =
  | "create"
  | "show"
  | "update"
  | "delete"
  | "restore"
  | "accept"
  | "reject"
  | "export"
  | "process";

export type ActionPermissions = Partial<Record<CrudAction, string>>;

const endpointReferenceMap: Record<string, string> = {
  users: "users",
  roles: "roles",
  permissions: "permissions",
  countrys: "countrys",
  departments: "departments",
  municipalitys: "municipalitys",
  "type/documents": "type_documents",
  images: "images",
  banks: "banks",
  "category/faq": "categoryFaq",
  faq: "faq",
  kyc: "kyc",
  currency: "currency",
  "type/company/accounts": "typeCompanyAccounts",
  "type/company/bank/accounts": "typeCompanyBankAccounts",
  "company/account": "companyBankAccount",
  "client/account": "clientAccount",
  "type/currency": "typeCurrency",
  "company/wallet": "companyWallet",
  "client/wallet": "clientWallet",
  "payment/types": "paymentTypes",
  "shipping/types": "shippingTypes",
  order: "orders",
  "sub/payment/type": "subPaymentType",
  "type/penalties": "typePenalty",
  penalties: "penalty",
  reds: "red",
  configurations: "configurations",
  "external/purchase": "external_purchases",
  bussiness: "bussiness",
  "withdrawal/xcop": "wallet_xcop",
  platform_cryptos: "platform_cryptos",
};

const actionSuffix: Record<CrudAction, string> = {
  create: "store",
  show: "show",
  update: "updated",
  delete: "delete",
  restore: "restore",
  accept: "accept",
  reject: "updated",
  export: "index",
  process: "accept",
};

export const getPermissionReferenceFromUrl = (
  url?: string | null,
): string | null => {
  if (!url) return null;
  const normalizedUrl = url.replace(/^\/+|\/+$/g, "");
  return endpointReferenceMap[normalizedUrl] ?? null;
};

export const buildActionPermission = (
  action: CrudAction,
  reference?: string | null,
): string | null => {
  if (!reference) return null;
  return `${reference}.${actionSuffix[action]}`;
};
