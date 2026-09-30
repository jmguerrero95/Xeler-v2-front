export enum COMMONS_PERMISSIONS {
    INDEX = 'index',
    SHOW = 'show',
    STORE = 'store',
    UPDATE = 'updated',
    DELETE = 'delete',
    RESTORE = 'restore',
    GET = "get",
}
export enum USERS {
    TITLE = 'Usuarios',
    REFERENCE = 'users',
    REFERREDS= "referreds",
    WALLETS= "wallets",
    PERSONAL_DATA= "personal_data",
    ACCOUNTS= "accounts",
    BANK_ACCOUNTS= "bank_accounts",
    OTHER_ACCOUNTS= "other_accounts",
    SEND_EMAIL= "send_email",
    SEND_SMS= "send_sms",
}

export enum COUNTRIES {
    TITLE = 'Paises',
    REFERENCE = 'countrys'
}

export enum DEPARTAMENTS {
    TITLE = 'Departamentos',
    REFERENCE = 'departments'
}

export enum MUNICIPALITIES {
    TITLE = 'Municipios',
    REFERENCE = 'municipalitys'
}
export enum TYPE_DOCUMENTS {
    TITLE = 'Tipos de documento de usuario',
    REFERENCE = 'type_documents'
}
export enum IMAGES {
    TITLE = 'Imagenes',
    REFERENCE = 'images'
}
export enum BANKS {
    TITLE = 'Bancos',
    REFERENCE = 'banks'
}
export enum FAQ_CATEGORIES {
    TITLE = 'Categoria de FAQ',
    REFERENCE = 'categoryFaq'
}
export enum KYC {
    TITLE = 'Kyc',
    REFERENCE = 'kyc'
}
export enum TICKET_CATEGORIES {
    TITLE = 'Categoria de tickes',
    REFERENCE = 'category_tickets'
}
export enum FAQ {
    TITLE = 'FAQ',
    REFERENCE = 'faq'
}
export enum CURRENCIES {
    TITLE = 'Monedas',
    REFERENCE = 'currency'
}
export enum TYPE_ACCOUNTS {
    TITLE = 'Tipos de Cuentas de la compañía',
    REFERENCE = 'typeCompanyAccounts'
}
export enum ACCOUNTS {
    TITLE = 'Cuentas de la compañía',
    REFERENCE = 'companyBankAccount'
}
export enum TYPE_BANK_ACCOUNTS {
    TITLE = 'Tipos de Cuentas de banco',
    REFERENCE = 'typeCompanyBankAccounts'
}
export enum FINANCIAL_ACTIONS {
    TRANSACTION_RESOLVE = 'crypto.transaction.resolve',
    PAYOUT_PROCESS = 'crypto.payout.process',
    SELL_FIAT_PAYOUT_PROCESS = 'sell.fiat-payout.process',
    SELL_INCOMING_RECONCILE = 'sell.incoming.reconcile',
    SELL_VARIANCE_RESOLVE = 'sell.variance.resolve',
    SELL_LATE_DEPOSIT_RESOLVE = 'sell.late-deposit.resolve',
    SELL_ORDER_COMPLETE = 'sell.order.complete',
}
export enum CLIENT_ACCOUNTS {
    TITLE = 'Cuentas de el cliente',
    REFERENCE = 'clientAccount'
}
export enum CURRENCY_TYPES {
    TITLE = 'Tipos de moneda',
    REFERENCE = 'typeCurrency'
}
export enum COMPANY_WALLETS {
    TITLE = 'Wallets de la compañia',
    REFERENCE = 'companyWallet'
}
export enum CLIENT_WALLETS {
    TITLE = 'Wallets de el cliente',
    REFERENCE = 'clientWallet'
}
export enum METHOD_PAYMENTS {
    TITLE = 'Tipos de pago',
    REFERENCE = 'paymentTypes'
}
export enum SHIPPING_TYPES {
    TITLE = 'Tipos de envio',
    REFERENCE = 'shippingTypes'
}
export enum ORDERS {
    TITLE = 'Ordenes',
    REFERENCE = 'orders',
    ONLY_USER = "only_user",
    BUY = "buy",
    SELL = "sell",
    ACCEPT = "accept",
    BLOCKED = "blocked",
    EXTERNAL_PURCHASE = "external_purchase",
}
export enum PAYMENT_SUBTYPE {
    TITLE = 'Subtipos de pago',
    REFERENCE = 'subPaymentType'
}
export enum PENALTY_TYPES {
    TITLE = 'Tipo de penalizacion',
    REFERENCE = 'typePenalty'
}
export enum PENALTIES {
    TITLE = 'Penalizacion',
    REFERENCE = 'penalty'
}
export enum PERMISS_CATEGORIES {
    TITLE = 'Categoria de permisos',
    REFERENCE = 'permissionCategory'
}
export enum PAYMENT_NETWORKS {
    TITLE = 'Redes de pago',
    REFERENCE = 'red'
}
export enum PLATFORM_CRYPTOS {
    TITLE = 'Plataformas crypto',
    REFERENCE = 'platform_cryptos'
}
export enum ROLES {
    TITLE = 'Roles',
    REFERENCE = 'roles'
}
export enum PERMISSIONS {
    TITLE = 'Permisos',
    REFERENCE = 'permissions'
}
export enum SETTINGS {
    TITLE = 'configuracion general',
    REFERENCE = 'configurations',
    DASHBOARD= 'dashboard',
    CURRENCY_STADISTIC= 'currency_stadistic'
}
export enum DEPOSIT_EXTERNAL {
    TITLE = 'Compras externas',
    REFERENCE = 'external_purchases'
}
export enum BUSSINESS {
    TITLE = 'Empresas',
    REFERENCE = 'bussiness'
}
export enum KYC_BUSSINESS {
    TITLE = 'KYC Empresas',
    REFERENCE = 'kyc_bussiness'
}
export enum WALLET_XCOP {
    TITLE = 'WALLET_XCOP',
    REFERENCE = 'wallet_xcop',
    RECEIVED = "received",
    SEND = "send",
    WITHDRAWAL = "withdrawal",
    ACCEPT = "accept",
}
export enum OUTBOX {
    TITLE = 'Outbox',
    REFERENCE = 'outbox',
    VIEW = 'view',
    STATS = 'stats',
    RETRY = 'retry',
    REQUEUE = 'requeue',
    MARK_DEAD = 'mark-dead',
}
export enum LEDGER_RECONCILIATION {
    TITLE = 'Reconciliaciones ledger',
    REFERENCE = 'ledger.reconciliation',
    VIEW = 'view',
    RESOLVE = 'resolve',
    IGNORE = 'ignore',
    REOPEN = 'reopen',
}
export enum OPERABILITY {
    SECURITY_PREFLIGHT_VIEW = 'security.preflight.view',
    SECURITY_ROUTE_AUDIT_VIEW = 'security.route-audit.view',
    LEDGER_READINESS_VIEW = 'ledger.readiness.view',
    LEDGER_AUDIT_VIEW = 'ledger.audit.view',
    LEDGER_FLOAT_USAGE_VIEW = 'ledger.float-usage.view',
    LEDGER_SOURCE_MODE_VIEW = 'ledger.source-mode.view',
    ADMIN_AUDIT_VIEW = 'admin.audit.view',
    WEBHOOK_VIEW = 'webhook.view',
    GATEWAY_VIEW = 'gateway.view',
    RISK_VIEW = 'risk.view',
}
export enum CRYPTO {
    PROVIDER_VIEW = 'crypto.provider.view',
    PROVIDER_STORE = 'crypto.provider.store',
    PROVIDER_UPDATE = 'crypto.provider.update',
    PROVIDER_TEST = 'crypto.provider.test',
    ADDRESS_VIEW = 'crypto.address.view',
    TRANSACTION_VIEW = 'crypto.transaction.view',
    TRANSACTION_RESOLVE = 'crypto.transaction.resolve',
    HEALTH_VIEW = 'crypto.health.view',
    PAYOUT_VIEW = 'crypto.payout.view',
    PAYOUT_PROCESS = 'crypto.payout.process',
}
export enum CONTROL_CENTER {
    VIEW = 'control-center.view',
    UPDATE = 'control-center.update',
    EMERGENCY_ACTIVATE = 'control-center.emergency.activate',
    EMERGENCY_UNLOCK = 'control-center.emergency.unlock',
    EMERGENCY_UNLOCK_OVERRIDE_DESTINATION = 'control-center.emergency.unlock.override-destination',
    INTEGRATIONS_VIEW = 'control-center.integrations.view',
    INTEGRATIONS_UPDATE = 'control-center.integrations.update',
    INTEGRATIONS_TEST = 'control-center.integrations.test',
    CRYPTO_VIEW = 'control-center.crypto.view',
    CRYPTO_UPDATE = 'control-center.crypto.update',
    OPERATIONS_VIEW = 'control-center.operations.view',
    OPERATIONS_UPDATE = 'control-center.operations.update',
    MANUAL_MODE_UPDATE = 'control-center.manual-mode.update',
    INTERNATIONAL_ACCOUNTS_VIEW = 'control-center.international-accounts.view',
    INTERNATIONAL_ACCOUNTS_UPDATE = 'control-center.international-accounts.update',
}
export enum INTERNATIONAL_ACCOUNTS {
    VIEW_OWN = 'international-accounts.view-own',
    REQUEST = 'international-accounts.request',
    ONBOARDING_OWN = 'international-accounts.onboarding-own',
    VIEW = 'international-accounts.view',
    ELIGIBILITY = 'international-accounts.eligibility',
    REVIEW = 'international-accounts.review',
    APPROVE = 'international-accounts.approve',
    REJECT = 'international-accounts.reject',
    SUSPEND = 'international-accounts.suspend',
    PROVIDER_VIEW = 'international-accounts.provider.view',
    PROVIDER_SYNC = 'international-accounts.provider.sync',
    PROVIDER_SIMULATE = 'international-accounts.provider.simulate',
    ACCOUNTS_VIEW_OWN = 'international-accounts.accounts.view-own',
    ACCOUNTS_ACTIVATE_OWN = 'international-accounts.accounts.activate-own',
    ACCOUNTS_VIEW = 'international-accounts.accounts.view',
    ACCOUNTS_MANAGE = 'international-accounts.accounts.manage',
    ACCOUNTS_SYNC = 'international-accounts.accounts.sync',
    DEPOSITS_VIEW = 'international-accounts.deposits.view',
    RECONCILIATION_VIEW = 'international-accounts.reconciliation.view',
    RECONCILIATION_RUN = 'international-accounts.reconciliation.run',
    BENEFICIARIES_VIEW_OWN = 'international-accounts.beneficiaries.view-own',
    BENEFICIARIES_MANAGE_OWN = 'international-accounts.beneficiaries.manage-own',
    TRANSFERS_VIEW_OWN = 'international-accounts.transfers.view-own',
    TRANSFERS_CREATE_OWN = 'international-accounts.transfers.create-own',
    BENEFICIARIES_VIEW = 'international-accounts.beneficiaries.view',
    BENEFICIARIES_MANAGE = 'international-accounts.beneficiaries.manage',
    TRANSFERS_VIEW = 'international-accounts.transfers.view',
    TRANSFERS_MANAGE = 'international-accounts.transfers.manage',
    TRANSFERS_SYNC = 'international-accounts.transfers.sync',
    FEES_VIEW = 'international-accounts.fees.view',
    FEES_UPDATE = 'international-accounts.fees.update',
}
export enum SUPPORT_TICKETS {
    VIEW_OWN = 'support-tickets.view-own',
    MANAGE = 'support-tickets.manage',
}
export enum SUPPORT_CHAT {
    ACCESS = 'support_chat.access', VIEW_ALL = 'support_chat.view_all', REPLY = 'support_chat.reply',
    INITIATE = 'support_chat.initiate', ASSIGN = 'support_chat.assign', CLOSE = 'support_chat.close', BLOCK = 'support_chat.block',
}
export enum ADMIN_REPORTS {
    VIEW = 'admin.reports.view',
}
export enum BREB_KEYS {
    VIEW_OWN = 'breb-keys.view-own',
    REVIEW = 'breb-keys.review',
    PLATFORM_MANAGE = 'breb-platform.manage',
}
export enum FEES {
    INDEX = 'fees.index',
    STORE = 'fees.store',
    UPDATE = 'fees.updated',
    TOGGLE = 'fees.toggle',
    EXEMPTIONS = 'fees.exemptions',
    ORDER_ADJUSTMENTS = 'fees.order-adjustments',
}

export enum OPERATIONAL_WALLETS {
    INDEX = 'operational-wallets.index',
    SHOW = 'operational-wallets.show',
    STORE = 'operational-wallets.store',
    UPDATE = 'operational-wallets.updated',
}

export type PERMISSION_ENUM = 
COMMONS_PERMISSIONS |
USERS |
COUNTRIES |
DEPARTAMENTS |
MUNICIPALITIES |
TYPE_DOCUMENTS |
IMAGES |
BANKS |
FAQ_CATEGORIES |
KYC |
TICKET_CATEGORIES |
FAQ |
CURRENCIES |
TYPE_ACCOUNTS |
ACCOUNTS |
TYPE_BANK_ACCOUNTS |
CLIENT_ACCOUNTS |
CURRENCY_TYPES |
COMPANY_WALLETS |
CLIENT_WALLETS |
METHOD_PAYMENTS |
SHIPPING_TYPES |
ORDERS |
PAYMENT_SUBTYPE |
PENALTY_TYPES |
PENALTIES |
PERMISS_CATEGORIES |
PAYMENT_NETWORKS |
PLATFORM_CRYPTOS |
ROLES |
PERMISSIONS |
SETTINGS |
DEPOSIT_EXTERNAL  |
BUSSINESS |
KYC_BUSSINESS |
WALLET_XCOP |
OUTBOX |
LEDGER_RECONCILIATION |
OPERABILITY |
CRYPTO |
CONTROL_CENTER |
SUPPORT_TICKETS |
SUPPORT_CHAT |
ADMIN_REPORTS
| BREB_KEYS
| FEES
| FINANCIAL_ACTIONS
| OPERATIONAL_WALLETS
| INTERNATIONAL_ACCOUNTS
