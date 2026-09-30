import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CryptoCurrencySelect from "./CryptoCurrencySelect.vue";

const httpMock = vi.fn();
const notifyMock = vi.fn();
const operationsMock = vi.fn();
const tickerMock = vi.fn();

vi.mock("@/helper", () => ({
  helperStore: () => ({ http: httpMock, showNotify: notifyMock }),
  formatNumber: (value: unknown) => String(value),
}));

vi.mock("@/services/controlCenterApi", () => ({
  getPublicOperationsStatus: () => operationsMock(),
}));

vi.mock("@/services/tickerApi", () => ({
  tickerApi: { getRates: () => tickerMock() },
}));

const currencies = ["BTC", "LTC", "DASH", "BCH", "ETH", "USDT", "USDC"].map(
  (code, index) => ({
    id: index + 1,
    attributes: {
      name: code,
      abbreviation: code,
      symbol: code,
      buy: true,
      sale: true,
      deleted_at: null,
      color: "#000000",
    },
  }),
);

describe("CryptoCurrencySelect production catalog", () => {
  beforeEach(() => {
    httpMock.mockReset();
    operationsMock.mockReset();
    tickerMock.mockReset();
    notifyMock.mockReset();

    httpMock.mockResolvedValue({ data: { response: currencies } });
    operationsMock.mockResolvedValue({
      data: {
        data: {
          currencies: currencies.map((item) => ({
            currency: item.attributes.abbreviation,
            enabled: true,
            buy_enabled: true,
            sell_enabled: true,
            manual_mode: false,
          })),
        },
      },
    });
    tickerMock.mockResolvedValue(
      currencies.map((item) => ({
        symbol: item.attributes.abbreviation,
        buy: "1",
        sell: "1",
        oficial: "1",
      })),
    );
  });

  it("loads the semantic crypto catalog instead of a historical numeric type id", async () => {
    const wrapper = mount(CryptoCurrencySelect, {
      props: { modelValue: null, side: "buy" },
      global: {
        mocks: { $vuetify: { display: { width: 1600, xs: false } } },
        stubs: {
          VRow: { template: "<div><slot /></div>" },
          VCol: { template: "<div><slot /></div>" },
          VHover: { template: '<div><slot :isHovering="false" :props="{}" /></div>' },
          VCard: { template: "<div><slot /></div>" },
          VAlert: { template: "<div><slot /></div>" },
          VBtn: { template: "<button><slot /></button>" },
        },
      },
    });

    await flushPromises();

    expect(httpMock).toHaveBeenCalledWith("currency", "get", {
      params: { type_currency: "crypto" },
    });
    expect(httpMock).not.toHaveBeenCalledWith(
      "currency",
      "get",
      expect.objectContaining({ params: { type_currency_id: 2 } }),
    );
    for (const code of ["BTC", "LTC", "DASH", "BCH", "ETH", "USDT", "USDC"]) {
      expect(wrapper.text()).toContain(code);
    }
  });
});
