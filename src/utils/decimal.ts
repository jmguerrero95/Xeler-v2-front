type DecimalParts = {
  sign: 1 | -1;
  integer: string;
  fraction: string;
};

const DECIMAL_PATTERN = /^[-+]?\d+(\.\d+)?$/;
const SCIENTIFIC_NOTATION_PATTERN = /e/i;

const stripLeadingZeros = (value: string): string =>
  value.replace(/^0+(?=\d)/, "");

const stripTrailingZeros = (value: string): string => value.replace(/0+$/, "");

const normalizeSeparators = (value: string): string => {
  if (value.includes(",") && value.includes(".")) {
    return value.replace(/\./g, "").replace(",", ".");
  }

  if (value.includes(",")) {
    return value.replace(",", ".");
  }

  return value;
};

const stringifyFiniteNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    throw new Error("Formato decimal invalido");
  }

  const raw = String(value);
  if (SCIENTIFIC_NOTATION_PATTERN.test(raw)) {
    throw new Error("No se permite notacion cientifica");
  }

  return raw;
};

const normalizeStrictInput = (value: unknown): string => {
  if (typeof value === "number") {
    return stringifyFiniteNumber(value);
  }

  if (typeof value !== "string") {
    throw new Error("Formato decimal invalido");
  }

  const normalized = normalizeSeparators(value.trim().replace(/\s/g, ""));

  if (!normalized) {
    throw new Error("Formato decimal invalido");
  }

  if (SCIENTIFIC_NOTATION_PATTERN.test(normalized)) {
    throw new Error("No se permite notacion cientifica");
  }

  if (!DECIMAL_PATTERN.test(normalized)) {
    throw new Error("Formato decimal invalido");
  }

  return normalized;
};

const parseStrictDecimal = (value: unknown): DecimalParts => {
  const normalized = normalizeStrictInput(value);
  const sign = normalized.startsWith("-") ? -1 : 1;
  const unsigned = normalized.replace(/^[-+]/, "");
  const [integer = "0", fraction = ""] = unsigned.split(".");

  return {
    sign,
    integer: stripLeadingZeros(integer) || "0",
    fraction: stripTrailingZeros(fraction),
  };
};

const formatParts = (decimal: DecimalParts): string => {
  if (decimal.integer === "0" && decimal.fraction === "") return "0";

  const sign = decimal.sign === -1 ? "-" : "";
  const fraction = decimal.fraction ? `.${decimal.fraction}` : "";
  return `${sign}${decimal.integer}${fraction}`;
};

export const assertValidDecimal = (value: unknown): void => {
  parseStrictDecimal(value);
};

export const normalizeDecimalStrict = (value: unknown): string =>
  formatParts(parseStrictDecimal(value));

export const sanitizeFinancialDecimal = (value: unknown): string =>
  normalizeDecimalStrict(value);

export const normalizeDecimalInput = (value: unknown): string => {
  if (value === null || value === undefined) return "";

  const raw =
    typeof value === "number" && Number.isFinite(value) ? String(value) : String(value);

  if (SCIENTIFIC_NOTATION_PATTERN.test(raw)) return "";

  const normalized = normalizeSeparators(raw.trim().replace(/\s/g, ""));
  if (!normalized) return "";
  if (/^[-+]?$/.test(normalized)) return normalized;
  if (/^[-+]?\d+(\.)?$/.test(normalized)) return normalized;
  if (!DECIMAL_PATTERN.test(normalized)) return "";

  return formatParts(parseStrictDecimal(normalized));
};

export const safeDecimalInput = (value: unknown): string =>
  normalizeDecimalInput(value);

export const normalizeDecimal = normalizeDecimalInput;

const toScaledBigInt = (value: unknown, scale: number): bigint => {
  const decimal = parseStrictDecimal(value);
  const fraction = decimal.fraction.padEnd(scale, "0").slice(0, scale);
  const scaled = BigInt(`${decimal.integer}${fraction}` || "0");
  return decimal.sign === -1 ? -scaled : scaled;
};

const fromScaledBigInt = (value: bigint, scale: number): string => {
  const sign = value < 0n ? "-" : "";
  const unsigned = (value < 0n ? -value : value)
    .toString()
    .padStart(scale + 1, "0");
  const integer = unsigned.slice(0, unsigned.length - scale) || "0";
  const fraction = stripTrailingZeros(unsigned.slice(unsigned.length - scale));
  return normalizeDecimalStrict(`${sign}${integer}${fraction ? `.${fraction}` : ""}`);
};

const getScale = (a: unknown, b: unknown): number =>
  Math.max(parseStrictDecimal(a).fraction.length, parseStrictDecimal(b).fraction.length);

export const compareDecimals = (a: unknown, b: unknown): number => {
  const scale = getScale(a, b);
  const left = toScaledBigInt(a, scale);
  const right = toScaledBigInt(b, scale);
  if (left === right) return 0;
  return left > right ? 1 : -1;
};

export const addDecimals = (a: unknown, b: unknown): string => {
  const scale = getScale(a, b);
  return fromScaledBigInt(toScaledBigInt(a, scale) + toScaledBigInt(b, scale), scale);
};

export const subtractDecimals = (a: unknown, b: unknown): string => {
  const scale = getScale(a, b);
  return fromScaledBigInt(toScaledBigInt(a, scale) - toScaledBigInt(b, scale), scale);
};

export const multiplyDecimals = (a: unknown, b: unknown, scale = 18): string => {
  const left = parseStrictDecimal(a);
  const right = parseStrictDecimal(b);
  const leftScale = left.fraction.length;
  const rightScale = right.fraction.length;
  const totalScale = leftScale + rightScale;
  const leftValue = toScaledBigInt(a, leftScale);
  const rightValue = toScaledBigInt(b, rightScale);
  const product = leftValue * rightValue;

  if (totalScale === scale) {
    return fromScaledBigInt(product, scale);
  }

  if (totalScale > scale) {
    const divisor = 10n ** BigInt(totalScale - scale);
    return fromScaledBigInt(product / divisor, scale);
  }

  const multiplier = 10n ** BigInt(scale - totalScale);
  return fromScaledBigInt(product * multiplier, scale);
};

export const divideDecimals = (a: unknown, b: unknown, scale = 18): string => {
  if (compareDecimals(b, "0") === 0) {
    throw new Error("No se puede dividir por cero");
  }

  const left = parseStrictDecimal(a);
  const right = parseStrictDecimal(b);
  const leftValue = toScaledBigInt(a, left.fraction.length);
  const rightValue = toScaledBigInt(b, right.fraction.length);
  const factor = 10n ** BigInt(scale + right.fraction.length - left.fraction.length);

  return fromScaledBigInt((leftValue * factor) / rightValue, scale);
};

export const isZeroDecimal = (value: unknown): boolean =>
  compareDecimals(value, "0") === 0;

export const greaterThanDecimal = (a: unknown, b: unknown): boolean =>
  compareDecimals(a, b) > 0;

export const lessThanDecimal = (a: unknown, b: unknown): boolean =>
  compareDecimals(a, b) < 0;

export const normalizeDecimalString = normalizeDecimalStrict;

export const normalizeUnsignedDecimalInput = (
  value: unknown,
  maximumDecimals = 18,
): string => {
  let raw = String(value ?? "").trim().replace(/\s/g, "");
  if (raw === "") return "";

  if (raw.includes(",")) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else {
    const pieces = raw.split(".");
    if (pieces.length > 2) {
      raw = `${pieces.slice(0, -1).join("")}.${pieces[pieces.length - 1]}`;
    }
  }
  if (!/^\d*(?:\.\d*)?$/.test(raw)) return "";

  const [integerRaw = "", fractionRaw] = raw.split(".");
  const integer = integerRaw.replace(/^0+(?=\d)/, "") || "0";
  const fraction = fractionRaw?.slice(0, Math.max(0, maximumDecimals));
  return fractionRaw !== undefined ? `${integer}.${fraction ?? ""}` : integer;
};
export const compareDecimalStrings = compareDecimals;
export const addDecimalStrings = addDecimals;
export const subtractDecimalStrings = subtractDecimals;
export const multiplyDecimalStrings = multiplyDecimals;
export const divideDecimalStrings = divideDecimals;

export const formatDecimalForDisplay = (
  value: unknown,
  scale = 2,
  decimalSeparator = ",",
  thousandSeparator = ".",
): string => {
  const normalized = normalizeDecimalStrict(value);
  const [integerPartRaw, fractionRaw = ""] = normalized.replace("-", "").split(".");
  const sign = normalized.startsWith("-") ? "-" : "";
  const paddedFraction = fractionRaw.padEnd(scale, "0").slice(0, scale);
  const integerPart = integerPartRaw.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

  if (scale === 0) {
    return `${sign}${integerPart}`;
  }

  return `${sign}${integerPart}${decimalSeparator}${paddedFraction}`;
};

export const parseCoordinateString = (value: string): number => {
  const normalized = normalizeDecimalStrict(value);
  return globalThis.Number(normalized);
};

export const parseIntegerString = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = normalizeDecimalStrict(value);
  return globalThis.Number(normalized);
};
