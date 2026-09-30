import { apiClient } from "@/services/apiClient";
import type { CryptoHealthItem, CryptoStats } from "@/interfaces/Crypto/Crypto.model";

export const getCryptoProvidersHealth = (dryRun = true) =>
  apiClient.get<{ data: CryptoHealthItem[] | Record<string, unknown> }>("admin/crypto/providers-health", {
    params: {
      dry_run: dryRun ? 1 : 0,
    },
  });

export const getCryptoStats = () =>
  apiClient.get<{ data: CryptoStats }>("admin/crypto/stats");
