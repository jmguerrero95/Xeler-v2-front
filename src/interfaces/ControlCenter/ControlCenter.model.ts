export interface PublicCurrencyAvailability {
  id?: number;
  currency: string;
  network?: string | null;
  provider?: string | null;
  enabled: boolean;
  buy_enabled: boolean;
  sell_enabled: boolean;
  manual_mode: boolean;
  public_message?: string | null;
  metadata_summary?: Record<string, unknown>;
}

export interface SystemOperationControl {
  id?: number;
  status: "normal" | "manual" | "maintenance" | "emergency_stopped";
  buy_enabled: boolean;
  sell_enabled: boolean;
  new_orders_enabled: boolean;
  auto_deposit_detection_enabled: boolean;
  auto_payout_enabled: boolean;
  webhook_processing_enabled: boolean;
  polling_enabled: boolean;
  reason?: string | null;
  public_message?: string | null;
  metadata_summary?: Record<string, unknown>;
  updated_by?: number | null;
  updated_at?: string | null;
}

export interface EmergencyStopEvent {
  id: number;
  uuid: string;
  status: "active" | "unlock_requested" | "resolved" | "expired";
  reason: string;
  public_message?: string | null;
  activated_by?: number | null;
  activated_at?: string | null;
  earliest_unlock_at?: string | null;
  unlock_requested_by?: number | null;
  unlock_requested_at?: string | null;
  email_sent_to?: string | null;
  sms_sent_to?: string | null;
  unlock_attempts?: number;
  unlocked_by?: number | null;
  unlocked_at?: string | null;
  metadata_summary?: Record<string, unknown>;
}

export interface CryptoOperationControl {
  id: number;
  uuid: string;
  currency: string;
  network?: string | null;
  provider?: string | null;
  enabled: boolean;
  buy_enabled: boolean;
  sell_enabled: boolean;
  manual_mode: boolean;
  auto_deposit_detection_enabled: boolean;
  auto_payout_enabled: boolean;
  webhook_processing_enabled: boolean;
  polling_enabled: boolean;
  reason?: string | null;
  public_message?: string | null;
  metadata_summary?: Record<string, unknown>;
  updated_at?: string | null;
}

export interface ControlCenterSummary {
  group: string;
  enabled: boolean;
  required_count: number;
  configured_required_count: number;
  configured: boolean;
}

export interface ControlCenterProviderSummary {
  id?: number;
  provider: string;
  currency: string;
  network?: string | null;
  enabled?: boolean;
  configured?: boolean;
  missing_fields?: string[];
  global_external_calls_enabled?: boolean;
  runtime_external_calls_enabled?: boolean;
  external_calls_enabled_effective?: boolean;
  disabled_reason?: string | null;
  status?: string | null;
  message?: string | null;
}

export interface ControlCenterHistoryItem {
  id: number;
  user_id?: number | null;
  action: string;
  entity_type?: string | null;
  entity_id?: number | null;
  metadata_summary?: Record<string, unknown>;
  created_at?: string | null;
}

export interface InternationalAccountOperationControl {
  id?: number;
  enabled: boolean;
  external_calls_enabled: boolean;
  external_calls_effective: boolean;
  new_requests_enabled: boolean;
  onboarding_enabled: boolean;
  wallet_creation_enabled: boolean;
  account_creation_enabled: boolean;
  beneficiary_creation_enabled: boolean;
  external_account_creation_enabled: boolean;
  outbound_transfers_enabled: boolean;
  transfer_webhook_processing_enabled: boolean;
  transfer_sync_enabled: boolean;
  fee_charging_enabled: boolean;
  deposit_processing_enabled: boolean;
  balance_sync_enabled: boolean;
  reconciliation_enabled: boolean;
  usd_enabled: boolean;
  eur_enabled: boolean;
  webhook_processing_enabled: boolean;
  polling_enabled: boolean;
  manual_mode: boolean;
  reason?: string | null;
  public_message?: string | null;
  updated_by?: number | null;
  updated_at?: string | null;
}

export interface ControlCenterStatus {
  system: SystemOperationControl;
  emergency?: EmergencyStopEvent | null;
  currencies: CryptoOperationControl[];
  crypto_providers: ControlCenterProviderSummary[];
  integrations: ControlCenterSummary[];
  international_accounts: InternationalAccountOperationControl;
  history: ControlCenterHistoryItem[];
}

export interface PublicOperationsStatus {
  system_status: string;
  buy_enabled: boolean;
  sell_enabled: boolean;
  new_orders_enabled: boolean;
  manual_mode: boolean;
  public_message?: string | null;
  currencies: PublicCurrencyAvailability[];
}
