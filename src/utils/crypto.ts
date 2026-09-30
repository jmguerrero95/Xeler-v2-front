import type { CryptoInfo } from "@/interfaces/Crypto/Crypto.model";

const encodeAmount = (amount?: string | number | null): string => {
  const value = amount === undefined || amount === null ? "" : String(amount);
  return value.trim();
};

export const normalizeCryptoStatus = (status?: string | null): string => {
  return String(status ?? "assigned")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
};

export const cryptoStatusLabel = (status?: string | null): string => {
  const normalized = normalizeCryptoStatus(status);
  const labels: Record<string, string> = {
    assigned: "Asignada",
    pending: "Pendiente",
    submitted: "Enviado al proveedor",
    broadcasted: "Transmitida",
    detected: "Detectada",
    confirming: "Confirmando",
    confirmed: "Confirmada",
    ignored: "Ignorada",
    failed: "Fallida",
    manual_review: "Revision manual",
    quarantined: "En cuarentena",
    reversed: "Reversada",
  };

  return labels[normalized] ?? normalized;
};

export const cryptoStatusColor = (status?: string | null): string => {
  const normalized = normalizeCryptoStatus(status);

  if (["confirmed"].includes(normalized)) return "success";
  if (["detected", "confirming", "assigned", "pending", "submitted", "broadcasted"].includes(normalized)) return "warning";
  if (["failed", "reversed"].includes(normalized)) return "error";
  if (["ignored", "manual_review", "quarantined"].includes(normalized)) return "info";

  return "grey";
};

export const getCryptoRequiredConfirmations = (crypto?: CryptoInfo | null): number => {
  return Number(
    crypto?.required_confirmations ??
      crypto?.confirmations_required ??
      crypto?.transactions?.[0]?.required_confirmations ??
      0,
  );
};

export const buildCryptoQrValue = (
  crypto: CryptoInfo,
  expectedAmount?: string | number | null,
): string => {
  const address = String(crypto.address ?? "").trim();
  const currency = String(crypto.currency ?? "").trim().toUpperCase();
  const network = String(crypto.network ?? "").trim().toUpperCase();
  const normalized = currency.replace(/\s+/g, "");
  const amount = encodeAmount(expectedAmount ?? crypto.amount);

  if (!address) return "";

  if (currency === "BTC" || normalized === "BITCOIN") {
    return amount ? `bitcoin:${address}?amount=${encodeURIComponent(amount)}` : `bitcoin:${address}`;
  }

  if (currency === "LTC" || normalized === "LITECOIN") {
    return amount ? `litecoin:${address}?amount=${encodeURIComponent(amount)}` : `litecoin:${address}`;
  }

  if (currency === "BCH" || normalized === "BITCOINCASH") {
    return amount ? `bitcoincash:${address}?amount=${encodeURIComponent(amount)}` : `bitcoincash:${address}`;
  }

  if (currency === "DASH") {
    return amount ? `dash:${address}?amount=${encodeURIComponent(amount)}` : `dash:${address}`;
  }

  if (currency === "ETH" || normalized === "ETHEREUM" || network === "ETH" || network === "ERC20") {
    return `ethereum:${address}`;
  }

  if (["USDT", "USDC"].includes(currency) && ["TRC20", "TRX", "TRON"].includes(network)) {
    const query = new URLSearchParams();
    if (amount) query.set("amount", amount);
    query.set("token", currency);

    const suffix = query.toString();
    return suffix ? `tron:${address}?${suffix}` : `tron:${address}`;
  }

  return address;
};
