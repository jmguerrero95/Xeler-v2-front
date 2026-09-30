import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import BuyFeeBreakdown from "../components/BuyFeeBreakdown.vue";
import type { OrderQuoteAttributes } from "@/interfaces/Order/OrderQuote.model";

const quote = (paymentMethodCode: "bank" | "cash" | "other") => ({
  quote_id: "quote-fees",
  type: "Compra",
  currency_id: 1,
  currency: "USDT",
  network: "TRC20",
  provider: "cryptocurrencyapi",
  decimal_scale: 6,
  currency_precision: 6,
  rate: "4000",
  amount_currency: "24.25",
  fiat_input_amount: "100000",
  net_fiat_amount: "97000",
  gross_crypto_amount: "24.25",
  payout_amount: "24.25",
  expected_deposit_amount: null,
  administrative_fee_local: "3000",
  administrative_fee: "3000",
  network_fee_currency: "0",
  network_fee_crypto: "0",
  network_fee: "0",
  network_fee_local: "12000",
  network_fee_fiat: "12000",
  provider_fee_currency: "0",
  provider_fee: "0",
  provider_fee_local: "0",
  total_exchange_local: "100000",
  total_exchange_reference: "25",
  net_amount_currency: "24.25",
  final_crypto_received_amount: "24.25",
  received_amount: "24.25",
  fee_type: "tron_trc20_operational_cost",
  fee_asset: "COP",
  fee_policy: "company_absorbed",
  fee_source: "configured_local_fallback",
  fee_is_estimated: true,
  fee_payment_mode: "fiat",
  principal_local: "100000",
  gross_local: "115000",
  non_network_fees: "3000",
  buy_payment_mode: "fiat",
  requires_voucher: true,
  instant_payment: false,
  xcop_payment: false,
  breb_limit_basis_cop: "100000",
  calculated_at: "2026-07-14T12:00:00Z",
  payment_method_code: paymentMethodCode,
  expires_at: "2026-07-14T12:05:00Z",
  server_time: "2026-07-14T12:00:00Z",
}) satisfies OrderQuoteAttributes;

describe("BuyFeeBreakdown", () => {
  it.each(["bank", "cash", "other"] as const)("renders the single backend fee contract for %s", (method) => {
    const wrapper = mount(BuyFeeBreakdown, { props: { quote: quote(method) } });

    expect(wrapper.findAll("[data-test='buy-fee-breakdown']")).toHaveLength(1);
    expect(wrapper.get("[data-test='rate']").text()).toContain("4000");
    expect(wrapper.get("[data-test='administrative-fee']").text()).toContain("3000");
    expect(wrapper.get("[data-test='network-fee']").text()).toContain("TRON/TRC20 estimado: COP 12000");
    expect(wrapper.get("[data-test='final-crypto']").text()).toContain("24.25 USDT");
    expect(wrapper.get("[data-test='payment-method']").text()).toContain(method);
    expect(wrapper.get("[data-test='fee-policy']").text()).toContain("asumido por Xeler");
    expect(wrapper.text()).not.toMatch(/Fee Mineros|Usar XCOP|\bUSD\b|NaN|undefined|null/);
  });

  it("renders a clear unavailable value instead of invalid output", () => {
    const invalid = { ...quote("bank"), network_fee_local: undefined as unknown as string };
    const wrapper = mount(BuyFeeBreakdown, { props: { quote: invalid } });

    expect(wrapper.get("[data-test='network-fee']").text()).toContain("No disponible");
    expect(wrapper.text()).not.toMatch(/NaN|undefined|null/);
  });

  it.each([
    ["BTC", "network_utxo", "0.00001"],
    ["ETH", "ethereum_gas", "0.0005"],
  ])("renders %s fee in its canonical asset", (currency, feeType, fee) => {
    const assetQuote = {
      ...quote("bank"),
      currency,
      network: currency,
      fee_type: feeType,
      fee_asset: currency,
      fee_source: "configured_fallback",
      network_fee_currency: fee,
      network_fee_crypto: fee,
      network_fee: fee,
      network_fee_local: "15000",
      network_fee_fiat: "15000",
    };
    const wrapper = mount(BuyFeeBreakdown, { props: { quote: assetQuote } });

    expect(wrapper.get("[data-test='network-fee']").text()).toContain(`${fee} ${currency}`);
    expect(wrapper.get("[data-test='network-fee-local']").text()).toContain("COP 15000");
    expect(wrapper.text()).not.toMatch(/NaN|undefined|null/);
  });
});
