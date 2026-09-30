import type { Currency } from "@/interfaces/Currency/Currency.model";
import type { CurrencyTicker } from "@/interfaces/Ticker/Ticker.model";

const SYMBOL_ALIASES: Record<string, string> = {
  bitcoin: "btc",
  ethereum: "eth",
  tether: "usdt",
  tetherusdt: "usdt",
  "usdt-trc20": "usdt",
  usdttrc20: "usdt",
  "usdt_trc20": "usdt",
  usdcoin: "usdc",
  "usdc-trc20": "usdc",
  usdctrc20: "usdc",
  "usdc_trc20": "usdc",
  litecoin: "ltc",
  dashcoin: "dash",
  bitcoincash: "bch",
  "bitcoin-cash": "bch",
};

export const normalizeCurrencyCode = (value?: string | null): string => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

  return SYMBOL_ALIASES[normalized] ?? normalized;
};

export const currencyCodes = (currency: Currency): string[] => {
  return [
    currency.attributes.abbreviation,
    currency.attributes.symbol,
    currency.attributes.name,
  ]
    .map(normalizeCurrencyCode)
    .filter((code, index, values) => code.length > 0 && values.indexOf(code) === index);
};

export const tickerCode = (ticker: CurrencyTicker): string => {
  return normalizeCurrencyCode(ticker.symbol || ticker.name);
};

const tickerCodes = (ticker: CurrencyTicker): string[] => {
  const exact = tickerCode(ticker);
  const codes = [exact];

  // Algunos proveedores utilizan tBTC/tETH como simbolos. Se conserva el
  // simbolo exacto como primera autoridad y solo se añade un alias secundario
  // para prefijos de ticker inequívocos. Así TRX continúa siendo TRX.
  if (exact.startsWith("t") && exact.length > 3) {
    codes.push(exact.slice(1));
  }

  return codes;
};

export const findTickerForCurrency = (
  tickers: CurrencyTicker[],
  currency: Currency,
): CurrencyTicker | null => {
  const codes = currencyCodes(currency);
  const exact = tickers.find((ticker) => codes.includes(tickerCode(ticker)));

  if (exact) return exact;

  return (
    tickers.find((ticker) =>
      tickerCodes(ticker).slice(1).some((code) => codes.includes(code)),
    ) ?? null
  );
};

export const findTickerByCurrencyCode = (
  tickers: CurrencyTicker[],
  code: string,
): CurrencyTicker | null => {
  const normalized = normalizeCurrencyCode(code);
  const exact = tickers.find((ticker) => tickerCode(ticker) === normalized);

  if (exact) return exact;

  return (
    tickers.find((ticker) => tickerCodes(ticker).slice(1).includes(normalized)) ??
    null
  );
};

export const hasValidTickerPrice = (
  ticker: CurrencyTicker | null,
  side: "buy" | "sell" | "oficial" = "oficial",
): boolean => {
  if (!ticker) return false;

  return Number.isFinite(Number(ticker[side])) && Number(ticker[side]) > 0;
};

export const tickerPriceForSide = (
  ticker: CurrencyTicker | null,
  side: "buy" | "sell",
  paymentTypeId?: string | number | null,
): number | null => {
  if (!ticker) return null;

  const cashPaymentTypeId = 1;
  const buyCash = Number(ticker.buy_cash);
  if (
    side === "buy" &&
    Number(paymentTypeId) === cashPaymentTypeId &&
    Number.isFinite(buyCash) &&
    buyCash > 0
  ) {
    return buyCash;
  }

  const price = Number(ticker[side]);
  return Number.isFinite(price) && price > 0 ? price : null;
};

const enabledFlag = (value: unknown): boolean => {
  return value === true || value === 1 || value === "1" || value === "true";
};

export const isBuySellCurrency = (
  currency: Currency,
  side: "buy" | "sale" | "any" = "any",
): boolean => {
  if (currency.attributes.deleted_at) return false;

  const buy = enabledFlag(currency.attributes.buy);
  const sale = enabledFlag(currency.attributes.sale);

  if (side === "buy") return buy;
  if (side === "sale") return sale;

  return buy || sale || enabledFlag(currency.attributes.wallet_default);
};
