import { describe, expect, it } from "vitest";
import {
  buildCryptoQrValue,
  cryptoStatusColor,
  cryptoStatusLabel,
  normalizeCryptoStatus,
} from "../crypto";

describe("crypto utils", () => {
  it("normalizes crypto statuses consistently", () => {
    expect(normalizeCryptoStatus("Revisión Manual")).toBe("revision_manual");
    expect(cryptoStatusLabel("manual_review")).toBe("Revision manual");
    expect(cryptoStatusColor("MANUAL_REVIEW")).toBe("info");
  });

  it("builds tron qr values for usdt and usdc", () => {
    expect(
      buildCryptoQrValue(
        {
          address: "TQ3J8Yg8mN4cW1cJz6X2nA8r7Qw9E5tYu1",
          currency: "USDT",
          network: "TRC20",
        } as any,
        "10.5",
      ),
    ).toBe("tron:TQ3J8Yg8mN4cW1cJz6X2nA8r7Qw9E5tYu1?amount=10.5&token=USDT");

    expect(
      buildCryptoQrValue(
        {
          address: "TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3",
          currency: "USDC",
          network: "TRON",
        } as any,
        null,
      ),
    ).toBe("tron:TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3?token=USDC");
  });
});
