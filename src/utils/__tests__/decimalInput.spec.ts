import { describe, expect, it } from "vitest";
import { normalizeUnsignedDecimalInput } from "../decimal";

describe("normalizeUnsignedDecimalInput", () => {
  it("preserves pasted crypto decimals without numeric coercion", () => {
    expect(normalizeUnsignedDecimalInput("0.0004", 8)).toBe("0.0004");
    expect(normalizeUnsignedDecimalInput("0,0004", 8)).toBe("0.0004");
    expect(normalizeUnsignedDecimalInput("00025.120000009", 8)).toBe("25.12000000");
  });

  it("normalizes localized fiat input as a decimal string", () => {
    expect(normalizeUnsignedDecimalInput("100.000,50", 2)).toBe("100000.50");
    expect(normalizeUnsignedDecimalInput("100000.50", 2)).toBe("100000.50");
  });
});
