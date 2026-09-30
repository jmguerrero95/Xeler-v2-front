export type CryptoStatus =
  | "assigned"
  | "pending"
  | "submitting"
  | "submitted"
  | "broadcasted"
  | "detected"
  | "confirming"
  | "confirmed"
  | "ignored"
  | "failed"
  | "manual_review"
  | "quarantined"
  | "reversed";

export type CryptoAddressStatus =
  | "available"
  | "assigned"
  | "used"
  | "disabled"
  | "failed"
  | "quarantined";

export type CryptoDirection = "incoming" | "outgoing";

export interface CryptoTransaction {
  id?: number;
  uuid?: string;
  provider?: string | null;
  currency?: string | null;
  network?: string | null;
  direction?: CryptoDirection | null;
  txid?: string | null;
  address?: string | null;
  amount?: string | null;
  confirmations?: number | null;
  required_confirmations?: number | null;
  status?: CryptoStatus | string | null;
  order_id?: number | null;
  user_id?: number | null;
  webhook_event_id?: number | null;
  provider_reference?: string | null;
  operation_key?: string | null;
  metadata?: Record<string, unknown> | null;
  detected_at?: string | null;
  confirmed_at?: string | null;
  failed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  can_resolve_crypto_transaction?: boolean;
  can_resolve_crypto_reconciliation?: boolean;
  status_label?: string | null;
}

export interface CryptoInfo {
  address?: string | null;
  currency?: string | null;
  network?: string | null;
  provider?: string | null;
  status?: CryptoStatus | string | null;
  address_status?: CryptoAddressStatus | string | null;
  confirmations?: number | null;
  required_confirmations?: number | null;
  confirmations_required?: number | null;
  txid?: string | null;
  provider_reference?: string | null;
  payout_status?: CryptoStatus | string | null;
  final_crypto_received_amount?: string | null;
  explorer_url?: string | null;
  can_view_txid?: boolean;
  amount?: string | null;
  amount_detected?: string | null;
  detected_amount?: string | null;
  confirmed_amount?: string | null;
  pending_amount?: string | null;
  transactions?: CryptoTransaction[];
  metadata?: Record<string, unknown> | null;
}

export interface CryptoAddress {
  id: number;
  uuid?: string;
  user_id?: number | null;
  order_id?: number | null;
  provider?: string | null;
  currency?: string | null;
  network?: string | null;
  address?: string | null;
  provider_address_id?: string | null;
  status?: CryptoAddressStatus | string | null;
  assigned_at?: string | null;
  used_at?: string | null;
  last_checked_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CryptoProviderConfig {
  id: number;
  uuid?: string;
  provider: string;
  currency: string;
  network: string;
  enabled: boolean;
  external_calls_enabled?: boolean;
  confirmations_required?: number | null;
  min_amount?: string | null;
  max_amount?: string | null;
  auto_payout_limit_usd?: string | null;
  has_wallet_passphrase?: boolean | null;
  metadata?: Record<string, unknown> | null;
  field_sources?: Record<string, "db" | "fallback" | "empty">;
  secret_fields?: Record<string, CryptoSecretFieldState>;
  schema?: CryptoProviderSchema;
  updated_at?: string | null;
}

export interface CryptoProviderAccount {
  id?: number;
  uuid?: string;
  provider: string;
  label: string;
  enabled: boolean;
  external_calls_enabled: boolean;
  sandbox?: boolean | null;
  confirmations_required?: number | null;
  base_url?: string | null;
  express_base_url?: string | null;
  express_host?: string | null;
  express_port?: string | number | null;
  timeout_seconds?: number | null;
  metadata?: Record<string, unknown> | null;
  field_sources?: Record<string, "db" | "fallback" | "empty">;
  secret_fields: Record<string, CryptoSecretFieldState>;
  schema: CryptoProviderSchema;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CryptoSecretFieldState {
  supported: boolean;
  has_value?: boolean;
  source?: "db" | "fallback" | "empty";
  preview?: string | null;
}

export type CryptoProviderFieldType =
  | "boolean"
  | "string"
  | "integer"
  | "decimal"
  | "url"
  | "secret";

export interface CryptoProviderFieldSchema {
  key: string;
  type: CryptoProviderFieldType;
  label: string;
  section: "status" | "credentials" | "configuration";
  clear_key?: string;
  placeholder?: string;
  sensitive?: boolean;
}

export interface CryptoProviderSchema {
  provider: string;
  label: string;
  provider_fields: CryptoProviderFieldSchema[];
  currency_fields: CryptoProviderFieldSchema[];
}

export interface CryptoProviderAccountPayload {
  enabled?: boolean;
  external_calls_enabled?: boolean;
  sandbox?: boolean | null;
  api_key?: string | null;
  access_token?: string | null;
  webhook_secret?: string | null;
  base_url?: string | null;
  express_base_url?: string | null;
  express_host?: string | null;
  express_port?: string | number | null;
  timeout_seconds?: number | null;
  clear_api_key?: boolean;
  clear_access_token?: boolean;
  clear_webhook_secret?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface CryptoProviderConfigPayload {
  provider?: string;
  currency?: string;
  network?: string;
  enabled?: boolean;
  external_calls_enabled?: boolean;
  confirmations_required?: number | null;
  min_amount?: string | null;
  max_amount?: string | null;
  auto_payout_limit_usd?: string | null;
  wallet_id?: string | null;
  wallet_passphrase?: string | null;
  clear_wallet_id?: boolean;
  clear_wallet_passphrase?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface CryptoHealthItem {
  provider?: string | null;
  currency?: string | null;
  network?: string | null;
  deposit_detection_mode?: string | null;
  deposit_polling_supported?: boolean | null;
  enabled?: boolean;
  sandbox?: boolean;
  environment?: string | null;
  api_base_url?: string | null;
  coin_type?: string | null;
  configured?: boolean;
  missing_fields?: string[];
  global_external_calls_enabled?: boolean;
  runtime_external_calls_enabled?: boolean;
  external_calls_enabled?: boolean;
  external_calls_enabled_effective?: boolean;
  has_access_token?: boolean | null;
  has_wallet_id?: boolean | null;
  has_express_host?: boolean | null;
  has_express_port?: boolean | null;
  wallet_verified?: boolean | null;
  rest_healthy?: boolean | null;
  express_healthy?: boolean | null;
  express_reachable?: boolean | null;
  express_environment?: string | null;
  express_status?: string | null;
  deposit_healthy?: boolean | null;
  payout_healthy?: boolean | null;
  overall_healthy?: boolean | null;
  disabled_reason?: string | null;
  healthy?: boolean | string | null;
  status?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface CryptoStats {
  providers?: number;
  supported_providers?: number;
  configured_provider_accounts?: number;
  configured_currency_configs?: number;
  addresses?: number;
  transactions?: number;
  pending_confirmations?: number;
  failed_transactions?: number;
  ignored_transactions?: number;
  addresses_by_status?: Record<string, number>;
  transactions_by_status?: Record<string, number>;
  [key: string]: unknown;
}
