import type { CurrencyTicker } from "@/interfaces/Ticker/Ticker.model";

/**
 * La tarjeta histórica "Valores basados en TRM" de Xeler V1 mostraba el
 * campo `oficial` para criptoactivos y `buy_cash` para Tether. En V2 USDT y
 * USDC comparten la autoridad TETHER declarada por el catálogo, por lo que
 * conservan el mismo campo visual sin afectar quotes ni tasas económicas.
 */
export const legacyTrmDisplayValue = (
  currencyCode: string,
  ticker: CurrencyTicker | null | undefined,
): number => {
  if (!ticker) return 0;

  const normalized = currencyCode.trim().toUpperCase();
  const field = ["TETHER", "USDT", "USDC"].includes(normalized)
    ? ticker.buy_cash
    : ticker.oficial;

  const value = Number(field);
  return Number.isFinite(value) && value > 0 ? value : 0;
};
