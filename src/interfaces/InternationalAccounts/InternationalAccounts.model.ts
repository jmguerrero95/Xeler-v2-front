export type InternationalAccountStatus =
  | "not_eligible"
  | "eligible"
  | "requested"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended";

export interface InternationalAccountAccess {
  id: number;
  status: Exclude<InternationalAccountStatus, "not_eligible">;
  requested_products: Array<"usd" | "eur">;
  use_case?: string | null;
  expected_monthly_volume?: string | null;
  expected_monthly_volume_currency?: "usd" | "eur" | null;
  source?: string;
  admin_reason?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    kyc_status: string;
  };
  reviewer?: { id: number; name: string } | null;
  eligible_at?: string | null;
  requested_at?: string | null;
  under_review_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  suspended_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface InternationalAccountClientState {
  feature_enabled: boolean;
  status: InternationalAccountStatus;
  can_request: boolean;
  available_products: Array<"usd" | "eur">;
  requested_products: Array<"usd" | "eur">;
  missing_products: Array<"usd" | "eur">;
  can_add_products: boolean;
  public_message?: string | null;
  access?: InternationalAccountAccess | null;
}

export interface InternationalAccountAdminList {
  items: InternationalAccountAccess[];
  summary: Record<Exclude<InternationalAccountStatus, "not_eligible">, number>;
}

export interface InternationalAccountCandidate {
  id: number;
  name: string;
  email: string;
  kyc_status: string;
}

export interface InternationalAccountProductState {
  product: "usd" | "eur";
  status: string;
  requirement_codes: string[];
  future_requirement_codes: string[];
  future_requirements_effective_at?: string | null;
}

export interface InternationalAccountOnboarding {
  provider: string;
  provider_status: string;
  kyc_status: string;
  tos_status: string;
  is_terminal: boolean;
  endorsements: InternationalAccountProductState[];
  last_synced_at?: string | null;
}

export interface InternationalAccountOnboardingState {
  access_status: InternationalAccountStatus;
  can_start: boolean;
  polling_enabled: boolean;
  onboarding?: InternationalAccountOnboarding | null;
}

export interface InternationalAccountOnboardingStart {
  onboarding: InternationalAccountOnboarding;
  kyc_url?: string | null;
  tos_url?: string | null;
}

export interface InternationalAccountProviderEndorsement {
  type: "base" | "sepa";
  status: string;
  requirements: Record<string, unknown>;
  future_requirements?: Record<string, unknown> | null;
  future_requirements_effective_at?: string | null;
  last_synced_at?: string | null;
}

export interface InternationalAccountProviderState {
  provider: string;
  environment: string;
  driver: "fake" | "bridge_sandbox" | "bridge";
  provider_customer_id?: string | null;
  provider_onboarding_id?: string | null;
  provider_status: string;
  kyc_status: string;
  tos_status: string;
  endorsements: InternationalAccountProviderEndorsement[];
  last_synced_at?: string | null;
  provider_created_at?: string | null;
}

export type InternationalAccountFakeTarget = "usd" | "eur" | null;

export type InternationalAccountFakeScenario =
  | "pending"
  | "terms_accepted"
  | "under_review"
  | "approved"
  | "rejected"
  | "paused"
  | "offboarded";

export type InternationalAccountProduct = "usd" | "eur";

export interface InternationalAccountFiatAccount {
  id: number;
  product: InternationalAccountProduct;
  status: string;
  source_currency: "USD" | "EUR";
  settlement_currency: string;
  available_balance: string;
  payment_rails: string[];
  deposits_restricted: boolean;
  can_receive: boolean;
  provider_notice: string;
  simulated: boolean;
  last_synced_at?: string | null;
}

export interface InternationalAccountDepositInstructions {
  bank_name?: string | null;
  bank_address?: string | null;
  beneficiary_name?: string | null;
  beneficiary_address?: string | null;
  account_number?: string | null;
  routing_number?: string | null;
  iban?: string | null;
  bic?: string | null;
  payment_rails?: string[];
}

export interface InternationalAccountFiatAccountDetail extends InternationalAccountFiatAccount {
  deposit_instructions: InternationalAccountDepositInstructions;
  settlement_notice: string;
}

export interface InternationalAccountActivity {
  id: number;
  type: string;
  label: string;
  amount: string;
  currency: string;
  source_amount?: string | null;
  source_currency?: string | null;
  payment_rail?: string | null;
  technical_reference?: string | null;
  created_at?: string | null;
}

export interface AdminInternationalAccount {
  id: number;
  wallet_id: number;
  user: { id: number; name: string; email: string };
  product: InternationalAccountProduct;
  provider: string;
  environment: string;
  status: string;
  provider_account_id: string;
  provider_wallet_id?: string | null;
  wallet_address_masked?: string | null;
  chain?: string | null;
  source_currency: string;
  settlement_currency: string;
  deposit_instructions_masked: Record<string, unknown>;
  ledger_balance: string;
  provider_wallet_balance: string;
  reconciliation?: {
    id: number;
    status: string;
    severity: string;
    difference: string;
    reconciled_at?: string | null;
  } | null;
  provider_status?: string | null;
  kyc_status?: string | null;
  last_synced_at?: string | null;
}

export interface AdminInternationalAccountDeposit {
  id: number;
  account_id: number;
  user_id: number;
  provider: string;
  environment: string;
  provider_deposit_id: string;
  state: string;
  source_amount: string;
  source_currency: string;
  settled_amount?: string | null;
  settlement_currency: string;
  developer_fee_amount: string;
  exchange_fee_amount: string;
  gas_fee_amount: string;
  destination_tx_hash?: string | null;
  ledger_transaction_id?: number | null;
  reversal_ledger_transaction_id?: number | null;
  first_event_at?: string | null;
  last_event_at?: string | null;
  settled_at?: string | null;
  refunded_at?: string | null;
}

export interface InternationalAccountOperationsSummary {
  active_usd: number;
  active_eur: number;
  deposits_received: number;
  deposits_processing: number;
  deposits_completed: number;
  deposits_incident: number;
  open_reconciliations: number;
}

export type InternationalAccountFakeDepositScenario =
  | "funds_received"
  | "in_review"
  | "payment_submitted"
  | "payment_processed"
  | "complete"
  | "refund_in_flight"
  | "refunded"
  | "refund_failed"
  | "microdeposit";

export interface InternationalBeneficiary {
  id: number;
  uuid: string;
  alias: string;
  beneficiary_type: "individual" | "business";
  display_name?: string | null;
  country: string;
  status: string;
  external_accounts?: InternationalExternalAccount[];
  created_at?: string | null;
}

export interface InternationalExternalAccount {
  id: number;
  uuid: string;
  beneficiary_id: number;
  beneficiary_alias?: string | null;
  product: InternationalAccountProduct;
  currency: "USD" | "EUR";
  account_type: "us" | "iban";
  status: string;
  active: boolean;
  bank_name?: string | null;
  account_masked?: string | null;
  payment_rails: Array<"ach" | "wire" | "sepa">;
  beneficiary_address_valid?: boolean | null;
  created_at?: string | null;
}

export interface InternationalTransferPreview {
  source_account: {
    id: number;
    product: InternationalAccountProduct;
    currency: string;
  };
  beneficiary: {
    id: number;
    alias: string;
    bank_name?: string | null;
    account_masked?: string | null;
  };
  destination_amount: string;
  destination_currency: "USD" | "EUR";
  xeler_fee_amount: string;
  temporary_buffer_amount: string;
  maximum_reservation_amount: string;
  payment_rail: "ach" | "wire" | "sepa";
}

export interface InternationalTransfer {
  id: number;
  uuid: string;
  date?: string | null;
  source_account: {
    id: number;
    product: InternationalAccountProduct;
    currency: string;
  };
  beneficiary: {
    alias?: string | null;
    bank_name?: string | null;
    account_masked?: string | null;
  };
  destination_amount: string;
  destination_currency: string;
  payment_rail: string;
  xeler_fee_amount: string;
  reservation_amount: string;
  provider_fees: { developer: string; exchange: string; gas: string };
  status: string;
  status_label: string;
  is_terminal: boolean;
  reference?: string | null;
  requires_support: boolean;
  processed_at?: string | null;
  refunded_at?: string | null;
  updated_at?: string | null;
}

export interface AdminInternationalExternalAccount extends InternationalExternalAccount {
  user_id: number;
  beneficiary_type: "individual" | "business";
  country: string;
  provider: string;
  environment: string;
  provider_external_account_id?: string | null;
  routing_masked?: string | null;
  outbox_event_id?: number | null;
  last_synced_at?: string | null;
}

export interface AdminInternationalTransfer extends InternationalTransfer {
  user_id: number;
  provider: string;
  environment: string;
  provider_transfer_id?: string | null;
  client_reference_id: string;
  provider_source_amount?: string | null;
  provider_final_amount?: string | null;
  provider_receipt?: {
    initial_amount?: string | null;
    subtotal_amount?: string | null;
    final_amount?: string | null;
  };
  outbox?: { id: number; status: string } | null;
  ledger_transactions: Record<string, number | null>;
  review_required: boolean;
  review_code?: string | null;
  reconciliation_status?: string | null;
  last_synced_at?: string | null;
}

export interface InternationalServiceFeeRule {
  id: number;
  code: string;
  product: InternationalAccountProduct;
  operation: "outbound_transfer";
  enabled: boolean;
  fixed_amount: string;
  settlement_currency?: string | null;
  charge_currency_mode: "settlement_currency";
  refund_on_provider_refund: boolean;
  min_amount?: string | null;
  max_amount?: string | null;
  updated_at?: string | null;
}
