// import { ROLES } from "@/interfaces/Role/Role.enum"
import type { RouteRecordRaw } from "vue-router";
import { checkedPermission, checkedRole } from "./middleware";
import { UserStore } from "@/stores/UserStore";
import {
  ROLES,
  KYC,
  KYC_BUSSINESS,
  ORDERS,
  USERS,
  WALLET_XCOP,
  COUNTRIES,
  DEPARTAMENTS,
  MUNICIPALITIES,
  SETTINGS,
  TYPE_DOCUMENTS,
  BANKS,
  CURRENCIES,
  CURRENCY_TYPES,
  METHOD_PAYMENTS,
  PAYMENT_SUBTYPE,
  TYPE_BANK_ACCOUNTS,
  SHIPPING_TYPES,
  PENALTY_TYPES,
  PAYMENT_NETWORKS,
  PLATFORM_CRYPTOS,
  ACCOUNTS,
  DEPOSIT_EXTERNAL,
  COMPANY_WALLETS,
  OUTBOX,
  LEDGER_RECONCILIATION,
  OPERABILITY,
  CRYPTO,
  CONTROL_CENTER,
  ADMIN_REPORTS,
  BREB_KEYS,
  FEES,
  OPERATIONAL_WALLETS,
  INTERNATIONAL_ACCOUNTS,
} from "@/enums/Permissions.enum";


const configurationLanding = async () => {
  const userStore = UserStore();
  await userStore.loadCurrentUser();
  userStore.uploadPermiss();
  const candidates: Array<[string, string[]]> = [
    ["admin-configurations-security-roles", ["roles.index", "roles.get"]],
    ["admin-configurations-generals", ["configurations.index", "configurations.get"]],
    ["admin-configurations-type-documents", ["type_documents.index", "type_documents.get"]],
    ["admin-configurations-generals-banks", ["banks.index", "banks.get"]],
    ["admin-configurations-generals-platforms", ["platform_cryptos.index", "platform_cryptos.get"]],
    ["admin-configurations-generals-currencies", ["currency.index", "currency.get"]],
    ["admin-configurations-generals-type-currencies", ["typeCurrency.index", "typeCurrency.get"]],
    ["admin-configurations-generals-payment-methods", ["paymentTypes.index", "paymentTypes.get"]],
    ["admin-configurations-generals-other-payments", ["subPaymentType.index", "subPaymentType.get"]],
    ["admin-configurations-generals-type-accounts", ["typeCompanyBankAccounts.index", "typeCompanyBankAccounts.get"]],
    ["admin-configurations-generals-shipping-types", ["shippingTypes.index", "shippingTypes.get"]],
    ["admin-configurations-generals-penalty-type", ["typePenalty.index", "typePenalty.get"]],
    ["admin-configurations-generals-network-types", ["red.index", "red.get"]],
    ["admin-configurations-banks-accounts", ["companyBankAccount.index", "companyBankAccount.get"]],
    ["admin-configurations-external-deposits", ["external_purchases.index", "external_purchases.get"]],
    ["admin-configurations-wallets", ["companyWallet.index", "companyWallet.get"]],
  ];

  const route = candidates.find(([, permissions]) =>
    permissions.some((permission) => userStore.hasPermission(permission)),
  );

  return { name: route?.[0] ?? "Forbidden" };
};

const supportChatGuard = (to: any, from: any, next: any) => {
  const store = UserStore();
  if (store.navigationContext() !== "admin") return next({ name: "user-buy" });
  return checkedPermission(to, from, next);
};

const generals: RouteRecordRaw[] = [
  {
    name: "admin-administrators",
    path: "/admin/administradores",
    component: () => import("@/views/admin/AdministratorsView.vue"),
    meta: { roles: ["Admin", "Superadmin"] },
    beforeEnter: checkedRole,
  },
  {
    name: "admin-international-accounts",
    path: "/admin/international-accounts",
    component: () => import("@/views/admin/international-accounts/InternationalAccountsAdminView.vue"),
    meta: { permissions: [INTERNATIONAL_ACCOUNTS.VIEW] },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-breb",
    path: "/admin/breb",
    component: () => import("@/views/admin/breb/BrebAdministrationView.vue"),
    meta: { anyPermissions: [BREB_KEYS.REVIEW, BREB_KEYS.PLATFORM_MANAGE] },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-fees",
    path: "/admin/fees",
    component: () => import("@/views/admin/fees/FeeRulesView.vue"),
    meta: { permissions: [FEES.INDEX] },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-support-chat",
    path: "/admin/chat-soporte",
    component: () => import("@/views/support/SupportChatAdminView.vue"),
    meta: { permissions: ["support_chat.access"] },
    beforeEnter: supportChatGuard,
  },
  {
    name: "admin-support-tickets",
    path: "/admin/support/tickets",
    redirect: { name: "admin-support-chat" },
  },
  {
    name: "admin-reports",
    path: "/admin/reports",
    component: () => import("@/views/admin/reports/AdminReportsView.vue"),
    meta: { permissions: [ADMIN_REPORTS.VIEW] },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-kyc",
    path: "/kyc",
    component: () => import("@/views/admin/kyc/Kyc.vue"),
    meta: {
      permissions: [KYC.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-kyc-bussiness",
    path: "/kyc-bussiness",
    component: () => import("@/views/admin/kycBussiness/Kyc.vue"),
    meta: {
      permissions: [KYC_BUSSINESS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-withdrawal-xcop",
    path: "/withdrawal-xcop",
    component: () =>
      import("@/views/admin/withdrawalXcop/WithdrawalXcopView.vue"),
    meta: {
      permissions: [WALLET_XCOP.ACCEPT],
      reference: WALLET_XCOP.REFERENCE,
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-users",
    path: "/users",
    component: () => import("@/views/admin/users/UsersView.vue"),
    meta: {
      permissions: [USERS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "Dashboard",
    path: "/dashboard",
    component: () => import("@/views/dashboard/Dashboard.vue"),
    meta: { reference: SETTINGS.REFERENCE, permissions: [SETTINGS.DASHBOARD] },
    beforeEnter: checkedPermission,
  },

  {
    name: "admin-transactions",
    path: "/admin/transactions",
    props: true,
    component: () => import("@/views/admin/transactions/TransactionView.vue"),
    meta: {
      permissions: [ORDERS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-control-center",
    path: "/admin/control-center",
    component: () => import("@/views/admin/control-center/ControlCenterView.vue"),
    meta: {
      anyPermissions: [
        CONTROL_CENTER.VIEW,
        CONTROL_CENTER.UPDATE,
        CONTROL_CENTER.OPERATIONS_VIEW,
        CONTROL_CENTER.OPERATIONS_UPDATE,
        CONTROL_CENTER.INTEGRATIONS_VIEW,
        CONTROL_CENTER.CRYPTO_VIEW,
      ],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-outbox",
    path: "/admin/outbox",
    component: () => import("@/views/admin/outbox/OutboxView.vue"),
    meta: {
      permissions: [OUTBOX.VIEW],
      reference: OUTBOX.REFERENCE,
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-outbox-show",
    path: "/admin/outbox/:id",
    props: true,
    component: () => import("@/views/admin/outbox/OutboxDetailView.vue"),
    meta: {
      permissions: [OUTBOX.VIEW],
      reference: OUTBOX.REFERENCE,
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-ledger-reconciliations",
    path: "/admin/ledger/reconciliations",
    component: () =>
      import("@/views/admin/ledger/reconciliations/ReconciliationsView.vue"),
    meta: {
      permissions: [LEDGER_RECONCILIATION.VIEW],
      reference: LEDGER_RECONCILIATION.REFERENCE,
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-ledger-reconciliation-show",
    path: "/admin/ledger/reconciliations/:id",
    props: true,
    component: () =>
      import(
        "@/views/admin/ledger/reconciliations/ReconciliationDetailView.vue"
      ),
    meta: {
      permissions: [LEDGER_RECONCILIATION.VIEW],
      reference: LEDGER_RECONCILIATION.REFERENCE,
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-operability-readiness",
    path: "/admin/operability/readiness",
    component: () => import("@/views/admin/operability/ReadinessView.vue"),
    meta: {
      anyPermissions: [
        OPERABILITY.LEDGER_READINESS_VIEW,
        OPERABILITY.SECURITY_PREFLIGHT_VIEW,
        OPERABILITY.LEDGER_FLOAT_USAGE_VIEW,
        OPERABILITY.LEDGER_SOURCE_MODE_VIEW,
      ],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-security-route-audit",
    path: "/admin/security/route-audit",
    component: () => import("@/views/admin/security/RouteAuditView.vue"),
    meta: {
      permissions: [OPERABILITY.SECURITY_ROUTE_AUDIT_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-ledger-audit-balances",
    path: "/admin/ledger/audit-balances",
    component: () => import("@/views/admin/ledger/audit/LedgerAuditBalancesView.vue"),
    meta: {
      permissions: [OPERABILITY.LEDGER_AUDIT_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-audit-logs",
    path: "/admin/audit/logs",
    component: () => import("@/views/admin/audit/AdminAuditLogsView.vue"),
    meta: {
      permissions: [OPERABILITY.ADMIN_AUDIT_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-audit-log-show",
    path: "/admin/audit/logs/:id",
    props: true,
    component: () => import("@/views/admin/audit/AdminAuditLogDetailView.vue"),
    meta: {
      permissions: [OPERABILITY.ADMIN_AUDIT_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-webhook-events",
    path: "/admin/integrations/webhooks",
    component: () => import("@/views/admin/integrations/webhooks/WebhookEventsView.vue"),
    meta: {
      permissions: [OPERABILITY.WEBHOOK_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-webhook-event-show",
    path: "/admin/integrations/webhooks/:id",
    props: true,
    component: () => import("@/views/admin/integrations/webhooks/WebhookEventDetailView.vue"),
    meta: {
      permissions: [OPERABILITY.WEBHOOK_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-gateway-status",
    path: "/admin/integrations/gateways",
    component: () => import("@/views/admin/integrations/gateways/GatewayStatusView.vue"),
    meta: {
      permissions: [OPERABILITY.GATEWAY_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-operational-wallets",
    path: "/admin/integrations/crypto/operational-wallets",
    component: () => import("@/views/admin/integrations/crypto/OperationalWalletsView.vue"),
    meta: {
      permissions: [OPERATIONAL_WALLETS.INDEX],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-crypto-providers",
    path: "/admin/integrations/crypto/providers",
    component: () => import("@/views/admin/integrations/crypto/CryptoProvidersView.vue"),
    meta: {
      permissions: [CRYPTO.PROVIDER_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-crypto-addresses",
    path: "/admin/integrations/crypto/addresses",
    component: () => import("@/views/admin/integrations/crypto/CryptoAddressesView.vue"),
    meta: {
      permissions: [CRYPTO.ADDRESS_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-crypto-address-show",
    path: "/admin/integrations/crypto/addresses/:id",
    props: true,
    component: () => import("@/views/admin/integrations/crypto/CryptoAddressDetailView.vue"),
    meta: {
      permissions: [CRYPTO.ADDRESS_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-crypto-transactions",
    path: "/admin/integrations/crypto/transactions",
    component: () => import("@/views/admin/integrations/crypto/CryptoTransactionsView.vue"),
    meta: {
      permissions: [CRYPTO.TRANSACTION_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-crypto-transaction-show",
    path: "/admin/integrations/crypto/transactions/:id",
    props: true,
    component: () => import("@/views/admin/integrations/crypto/CryptoTransactionDetailView.vue"),
    meta: {
      permissions: [CRYPTO.TRANSACTION_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-crypto-health",
    path: "/admin/integrations/crypto/health",
    component: () => import("@/views/admin/integrations/crypto/CryptoHealthView.vue"),
    meta: {
      permissions: [CRYPTO.HEALTH_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-risk-guards",
    path: "/admin/risk/guards",
    component: () => import("@/views/admin/risk/RiskGuardsView.vue"),
    meta: {
      permissions: [OPERABILITY.RISK_VIEW],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-transaction-show",
    path: "/admin/transactions/:numTransaction",
    props: true,
    component: () =>
      import("@/views/admin/transactions/TransactionDetailView.vue"),
    meta: {
      permissions: [ORDERS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
];

const security: RouteRecordRaw[] = [
  {
    name: "admin-configurations-security-roles",
    path: "/configurations/security/roles",
    component: () => import("@/views/admin/security/roles/RolesView.vue"),
    meta: {
      permissions: [ROLES.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
];

const ubications: RouteRecordRaw[] = [
  {
    name: "admin-configurations-ubications-countries",
    path: "/configurations/ubications/countries",
    component: () =>
      import("@/views/admin/configurations/countries/CountryView.vue"),
    meta: {
      permissions: [COUNTRIES.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-ubications-departaments",
    path: "/configurations/ubications/departaments",
    component: () =>
      import("@/views/admin/configurations/departaments/DepartamentsView.vue"),
    meta: {
      permissions: [DEPARTAMENTS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-ubications-municipalities",
    path: "/configurations/ubications/municipalities",
    component: () =>
      import(
        "@/views/admin/configurations/municipalities/MunicipalitiesView.vue"
      ),
    meta: {
      permissions: [MUNICIPALITIES.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
];

const generals_configurations: RouteRecordRaw[] = [
  {
    name: "admin-configurations-generals",
    path: "/configurations/generals",
    component: () =>
      import(
        "@/views/admin/configurations/Generals/ConfigurationGeneralView.vue"
      ),
    meta: {
      permissions: [SETTINGS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-type-documents",
    path: "/configurations/generals/type-documents",
    component: () =>
      import(
        "@/views/admin/configurations/type-documents/TypeDocumentsView.vue"
      ),
    meta: {
      permissions: [TYPE_DOCUMENTS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-generals-banks",
    path: "/configurations/generals/banks",
    component: () => import("@/views/admin/configurations/banks/BanksView.vue"),
    meta: {
      permissions: [BANKS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-generals-platforms",
    path: "/configurations/generals/platforms",
    component: () =>
      import("@/views/admin/configurations/platforms/PlatformView.vue"),
    meta: {
      permissions: [PLATFORM_CRYPTOS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-generals-currencies",
    path: "/configurations/generals/currencies",
    component: () =>
      import("@/views/admin/configurations/currencies/CurrencyView.vue"),
    meta: {
      permissions: [CURRENCIES.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-generals-type-currencies",
    path: "/configurations/generals/type-currencies",
    component: () =>
      import("@/views/admin/configurations/CurrencyType/CurrencyTypeView.vue"),
    meta: {
      permissions: [CURRENCY_TYPES.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-generals-payment-methods",
    path: "/configurations/generals/payment-methods",
    component: () =>
      import(
        "@/views/admin/configurations/PaymentMethod/PaymentMethodView.vue"
      ),
    meta: {
      permissions: [METHOD_PAYMENTS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-generals-other-payments",
    path: "/configurations/generals/other-payments",
    component: () =>
      import(
        "@/views/admin/configurations/OtherPayments/OtherPaymentsView.vue"
      ),
    meta: {
      permissions: [PAYMENT_SUBTYPE.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-generals-type-accounts",
    path: "/configurations/generals/type-accounts",
    component: () =>
      import(
        "@/views/admin/configurations/TypeBankAccount/TypeBankAccountView.vue"
      ),
    meta: {
      permissions: [TYPE_BANK_ACCOUNTS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-generals-shipping-types",
    path: "/configurations/generals/shipping-types",
    component: () =>
      import("@/views/admin/configurations/ShippingTypes/ShippingTypeView.vue"),
    meta: {
      permissions: [SHIPPING_TYPES.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-generals-penalty-type",
    path: "/configurations/generals/penalty-type",
    component: () =>
      import("@/views/admin/configurations/PenaltyTypes/PenaltyTypeView.vue"),
    meta: {
      permissions: [PENALTY_TYPES.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-generals-network-types",
    path: "/configurations/generals/network-types",
    component: () =>
      import("@/views/admin/configurations/NetworkType/NetworkTypeView.vue"),
    meta: {
      permissions: [PAYMENT_NETWORKS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
];

const accounts: RouteRecordRaw[] = [
  {
    name: "admin-configurations-banks-accounts",
    path: "/configurations/banks-accounts",
    component: () =>
      import(
        "@/views/admin/configurations/CompanyAccounts/Bank/BankAccountCompanyView.vue"
      ),
    meta: {
      permissions: [ACCOUNTS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-efecty-accounts",
    path: "/configurations/efecty-accounts",
    component: () =>
      import(
        "@/views/admin/configurations/CompanyAccounts/Efecty/EfectyAccountCompanyView.vue"
      ),
    meta: {
      permissions: [ACCOUNTS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-other-accounts",
    path: "/configurations/other-accounts",
    component: () =>
      import(
        "@/views/admin/configurations/CompanyAccounts/Other/OtherAccountCompanyView.vue"
      ),
    meta: {
      permissions: [ACCOUNTS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
  {
    name: "admin-configurations-external-deposits",
    path: "/configurations/external-deposits",
    component: () =>
      import(
        "@/views/admin/configurations/CompanyAccounts/ExternalDeposit/ExternalDeposit.vue"
      ),
    meta: {
      permissions: [DEPOSIT_EXTERNAL.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
];

const wallets: RouteRecordRaw[] = [
  {
    name: "admin-configurations-wallets",
    path: "/configurations/wallets",
    component: () =>
      import("@/views/admin/configurations/wallet/WalletView.vue"),
    meta: {
      permissions: [COMPANY_WALLETS.REFERENCE],
    },
    beforeEnter: checkedPermission,
  },
];

// ----------------------------------------------------
const configurations: RouteRecordRaw[] = [
  {
    name: "admin-configurations",
    path: "/configurations",
    beforeEnter: async (to) => to.name === "admin-configurations"
      ? await configurationLanding()
      : true,
    component: () =>
      import("@/views/admin/configurations/ConfigurationView.vue"),
    children: [
      ...security,
      ...ubications,
      ...generals_configurations,
      ...accounts,
      ...wallets,
    ],
  },
  {
    name: "admin-profile",
    path: "/admin/profile",
    component: () => import("@/views/admin/profile/ProfileView.vue"),
    meta: {
      roles: [
        "Admin",
        "Superadmin",
        "Admin operativo",
        "Admin financiero",
        "Admin KYC",
        "Soporte",
      ],
    },
    beforeEnter: checkedRole,
  },
  {
    name: "activities",
    path: "/activities",
    component: () => import("@/views/admin/activities/ActivitiesView.vue"),
  },
];
export default [
  // ...security,
  ...generals,
  ...configurations,
];
