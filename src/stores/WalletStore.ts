import { defineStore } from "pinia";
import type { Currency } from "@/interfaces/Currency/Currency.model";
import { helperStore } from "@/helper";
import { computed, ref } from "vue";
import type { CurrencyTicker } from "@/interfaces/Ticker/Ticker.model";
import dayjs from "dayjs";
import {
  findTickerByCurrencyCode,
  findTickerForCurrency,
  hasValidTickerPrice,
  isBuySellCurrency,
} from "@/utils/currencyTicker";
import { tickerApi } from "@/services/tickerApi";
import { legacyTrmDisplayValue } from "@/utils/legacyTrmDisplay";
import { responseCollection } from "@/utils/responseCollection";

export const WalletStore = defineStore("wallet", () => {
  const helper = helperStore();

  const currencies = ref<Currency[]>([]);
  const getCurrencies = async (): Promise<Currency[]> => {
    const lastKnownGood = currencies.value;
    try {
      const res = await helper.http(
        "currency",
        "get",
        {
          params: {
            type_currency: "crypto",
          },
        },
        "",
        true,
      );
      currencies.value = responseCollection<Currency>(res);
      return currencies.value;
    } catch {
      // El layout conserva el catálogo ya cargado durante una falla transitoria.
      currencies.value = lastKnownGood;
      return currencies.value;
    }
    // currencies.value.push(...res.data.response as Currency[]);
    // currencies.value.push(...res.data.response as Currency[]);
  };
  const coinsInit = ref<Coin[]>([]);

  const dateQueryTicker = ref<string>("");
  const currencyTicker = ref<CurrencyTicker[]>([]);
  const currencyTickerError = ref<string | null>(null);
  const getCurrencyTicker = async (): Promise<CurrencyTicker[]> => {
    const lastKnownGood = currencyTicker.value;
    try {
      currencyTicker.value = await tickerApi.getRates();
      currencyTickerError.value =
        currencyTicker.value.length > 0 ? null : "No hay tasas disponibles";
      const synchronizedAt = currencyTicker.value[0]?.last_synced_at;
      dateQueryTicker.value = synchronizedAt
        ? dayjs(synchronizedAt).format("YYYY-MM-DD HH:mm UTC")
        : dayjs().format("YYYY-MM-DD HH:mm UTC");
      if (coinsInit.value.length === 0) {
        coinsInit.value = setCoins();
      }
      return currencyTicker.value;
    } catch {
      // La tarjeta heredada de V1 conserva la última tasa ya obtenida si el
      // proveedor falla temporalmente; nunca vaciamos un valor útil.
      currencyTicker.value = lastKnownGood;
      currencyTickerError.value = "No fue posible consultar las tasas";
      return currencyTicker.value;
    }
  };

  const getCurrencyTickerByAbbreviation = (
    abbreviation: string,
  ): CurrencyTicker | null => {
    return findTickerByCurrencyCode(currencyTicker.value, abbreviation);
  };

  const getCurrencyTickerForCurrency = (
    currency: Currency,
  ): CurrencyTicker | null => {
    return findTickerForCurrency(currencyTicker.value, currency);
  };

  const colors = {
    same: "same",
    up: "up",
    down: "down-2",
  };

  const colorsText = {
    same: "table",
    up: "ok-2",
    down: "down",
  };
  const orientationArrow = {
    same: "-90",
    up: "180",
    down: "0",
  };

  const coins = computed(() => setCoins() ?? []);
  const getBandForCoin = (coin: Coin, value: number): BandCoin => {
    // return 'same'
    if (coin?.value == value) return "same";
    return value > coin?.value ? "up" : "down";
  };
  const getporcentForCoin = (coin: Coin, value: number): string => {
    // return '0'
    if (coin.value == value) return "0";
    const percent = ((value - coin.value) / coin.value) * 100;
    if (percent.toFixed(2) == "0.00") return "0.00";
    return percent > 0 ? `+` + percent.toFixed(2) : percent.toFixed(2);
  };

  const setCoins = (): Coin[] => {
    return currencies.value
      .filter(
        (currency: Currency) =>
          isBuySellCurrency(currency, "any") &&
          hasValidTickerPrice(getCurrencyTickerForCurrency(currency)),
      )
      .map((currency: Currency): Coin => {
        const currencyT = getCurrencyTickerForCurrency(currency);
        const images = currency.relationships?.images;
        const tickerValue = legacyTrmDisplayValue(
          currency.attributes.abbreviation,
          currencyT,
        );
        const coin = coinsInit.value.find(
          (coinI: Coin) => coinI.name == currency.attributes.name,
        )!;
        const band: BandCoin = coin
          ? getBandForCoin(coin, tickerValue)
          : "same";
        const porcent: string = coin
          ? getporcentForCoin(coin, tickerValue)
          : "0";
        return {
          name: currency.attributes.name,
          value: tickerValue,
          up: true,
          icon: images && images.length > 0 ? images[0].attributes.aws_url ?? "" : "",
          band,
          porcent,
          abbreviation: currency.attributes.abbreviation,
        };
      });
  };

  const cryptoHaveImage = (currency?: Currency): false | string => {
    if (!currency) return false;
    const images = currency.relationships?.images;
    if (!images || images.length == 0) return false;
    return images[0].attributes.aws_url ?? false;
  };
  return {
    currencies,
    getCurrencies,
    currencyTicker,
    getCurrencyTicker,
    getCurrencyTickerByAbbreviation,
    getCurrencyTickerForCurrency,
    currencyTickerError,
    colors,
    colorsText,
    orientationArrow,
    setCoins,
    coins,
    dateQueryTicker,
    cryptoHaveImage,
    getBandForCoin,
    getporcentForCoin,
  };

  interface Coin {
    name: string;
    value: number;
    up: boolean;
    icon: string;
    porcent: string;
    band: BandCoin;
    abbreviation: string;
  }

  type BandCoin = "same" | "up" | "down";
});
