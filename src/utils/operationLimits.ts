export const MAX_ORDER_COP = "9000000";

export const exceedsOrderMaxCop = (value: string): boolean => {
  const normalized = String(value ?? "0").trim().replace(/[^0-9.]/g, "");
  const [integer = "0", decimals = ""] = normalized.split(".");
  const canonical = integer.replace(/^0+(?=\d)/, "") || "0";

  if (canonical.length !== MAX_ORDER_COP.length) return canonical.length > MAX_ORDER_COP.length;
  if (canonical !== MAX_ORDER_COP) return canonical > MAX_ORDER_COP;
  return /[1-9]/.test(decimals);
};
