import { apiClient } from "@/services/apiClient";
import type { IntegrationSettingItem, IntegrationSettingsGroup } from "@/interfaces/Integrations/IntegrationSettings.model";

export const getIntegrationSettings = () =>
  apiClient.get<{ data: IntegrationSettingsGroup }>("admin/control-center/integrations");

export const getIntegrationSettingsGroup = (group: string) =>
  apiClient.get<{ data: IntegrationSettingItem[] }>(`admin/control-center/integrations/${group}`);

export const updateIntegrationSettingsGroup = (
  group: string,
  settings: Record<string, Record<string, unknown>>,
) =>
  apiClient.patch<{ data: IntegrationSettingItem[] }>(
    `admin/control-center/integrations/${group}`,
    { settings },
    { idempotent: true, financialAction: true },
  );

export const testIntegrationSettingsGroup = (group: string) =>
  apiClient.post<{ data: Record<string, unknown> }>(
    `admin/control-center/integrations/${group}/test`,
    {},
    { idempotent: true },
  );
