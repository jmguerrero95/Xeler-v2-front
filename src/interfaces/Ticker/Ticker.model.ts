export declare interface CurrencyTicker {
  id?: number;
  symbol: string;
  name?: string;
  base?: string;
  buy: string | number;
  sell: string | number;
  buy_cash: string | number;
  active?: number;
  trm?: string;
  icono?: string;
  oficial: string | number;
  oficial_usd?: string;
  stale?: boolean;
  stale_age_seconds?: number;
  source?: string;
  last_synced_at?: string;
}

/** Contrato normalizado de la fachada GET /api/public/ticker. */
export declare interface PublicTickerRate {
  symbol: string;
  buy: string;
  sell: string;
  buy_cash: string;
  oficial: string;
  trm?: string;
  source: string;
  last_synced_at: string;
  stale: boolean;
  stale_age_seconds: number;
}
