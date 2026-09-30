export interface IntegrationSettingItem {
  id: number;
  uuid: string;
  group: string;
  key: string;
  label?: string | null;
  description?: string | null;
  type: "string" | "secret" | "boolean" | "integer" | "url" | "json";
  value?: unknown;
  display_value?: string | null;
  masked_value?: string | null;
  has_value: boolean;
  effective_has_value: boolean;
  source: "db" | "fallback" | "empty";
  fallback_available: boolean;
  is_secret: boolean;
  is_required: boolean;
  enabled: boolean;
  metadata?: Record<string, unknown>;
  created_at?: string | null;
  updated_at?: string | null;
}

export type IntegrationSettingsGroup = Record<string, IntegrationSettingItem[]>;
