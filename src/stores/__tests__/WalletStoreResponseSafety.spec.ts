import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const http = vi.hoisted(() => vi.fn());
const rates = vi.hoisted(() => vi.fn());
vi.mock("@/helper", () => ({ helperStore: () => ({ http, showNotify: vi.fn() }) }));
vi.mock("@/services/tickerApi", () => ({ tickerApi: { getRates: rates } }));
import { WalletStore } from "../WalletStore";

const currency = { attributes: { name: "Bitcoin", abbreviation: "BTC", symbol: "BTC", buy: true, sale: true }, relationships: { images: [] } } as any;

describe("WalletStore response safety", () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks(); });

  it("normaliza la colección válida antes de filtrarla", async () => {
    http.mockResolvedValue({ data: { response: [currency] } });
    const store = WalletStore();
    await store.getCurrencies();
    expect(store.currencies).toEqual([currency]);
  });

  it("no deja una colección undefined cuando el sobre llega vacío", async () => {
    http.mockResolvedValue({ data: {} });
    const store = WalletStore();
    await store.getCurrencies();
    expect(store.currencies).toEqual([]);
    expect(store.setCoins()).toEqual([]);
  });

  it("conserva la última tasa válida durante una falla temporal", async () => {
    rates.mockResolvedValueOnce([{ symbol: "BTC", oficial: "100", buy_cash: "90", last_synced_at: "2026-09-19T00:00:00Z" }]).mockRejectedValueOnce(new Error("offline"));
    const store = WalletStore();
    await store.getCurrencyTicker();
    await store.getCurrencyTicker();
    expect(store.currencyTicker).toHaveLength(1);
    expect(store.currencyTickerError).toBe("No fue posible consultar las tasas");
  });
});
