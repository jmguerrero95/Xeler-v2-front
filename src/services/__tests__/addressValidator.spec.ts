import { describe, expect, it } from "vitest";
import { addressValid } from "@/validator";

const validBtc = "1KFzzGtDdnq5hrwxXGjwVnKzRbvf8WVxck";
const validBtcTestnet = "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn";
const validEthereum = "0x52908400098527886E0F7030069857D2E4169EE7";
const validTron = "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7";

describe("currency and network address validation", () => {
  it("validates mainnet and testnet BTC without changing the currency symbol", () => {
    expect(addressValid(validBtc, "BTC", "BTC", "prod")).toBe(true);
    expect(addressValid(validBtcTestnet, "BTC", "BTC", "testnet")).toBe(true);
    expect(addressValid(validBtcTestnet, "BTC", "BTC", "prod")).not.toBe(true);
  });

  it("validates ETH using Ethereum checksum rules", () => {
    expect(addressValid(validEthereum, "ETH", "ETH", "prod")).toBe(true);
    expect(
      addressValid(
        "0x52908400098527886E0F7030069857D2E4169Ee7",
        "ETH",
        "ETH",
        "prod",
      ),
    ).not.toBe(true);
  });

  it.each(["USDT", "USDC"])(
    "validates %s against the underlying TRON network",
    (currency) => {
      expect(addressValid(validTron, currency, "TRC20", "prod")).toBe(true);
      expect(addressValid(validEthereum, currency, "TRC20", "prod")).not.toBe(
        true,
      );
      expect(addressValid(validTron, currency, "ETH", "prod")).not.toBe(true);
    },
  );


  it("rejects transient null and undefined form values without throwing", () => {
    expect(() => addressValid(null, "ETH", "ETH", "prod")).not.toThrow();
    expect(() => addressValid(undefined, undefined, undefined, "prod")).not.toThrow();
    expect(addressValid(null, "ETH", "ETH", "prod")).not.toBe(true);
    expect(addressValid(validEthereum, null, "ETH", "prod")).not.toBe(true);
  });

  it.each(["BTC", "LTC", "DASH", "BCH", "ETH", "USDT", "USDC"])(
    "rejects empty, padded and malformed %s addresses",
    (currency) => {
      expect(addressValid("", currency)).not.toBe(true);
      expect(addressValid(` ${validBtc} `, currency)).not.toBe(true);
      expect(addressValid("not-an-address", currency)).not.toBe(true);
    },
  );
});
