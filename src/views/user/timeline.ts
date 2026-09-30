import type { Order } from "@/interfaces/Order/Order.model";
import { normalizeCryptoStatus } from "@/utils/crypto";

export type TimelineTone = "done" | "active" | "idle" | "warning" | "info";

export interface TimelineItem {
  key: string;
  text: string;
  tone: TimelineTone;
}

const normalizeStatusName = (value?: string | null): string =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const isCancelled = (statusName: string): boolean => statusName.includes("cancel");
const isFailed = (statusName: string): boolean => statusName.includes("fall");
const isManualReview = (order: Order, statusName: string, cryptoStatus: string): boolean =>
  ["manual_review", "ignored", "quarantined"].includes(cryptoStatus)
  || statusName.includes("revision manual")
  || statusName.includes("cuarentena")
  || Boolean(order.attributes.manual_review_reason);

const hasVoucher = (order: Order): boolean => Boolean(order.attributes.voucher_uploaded_at);
const isPaymentProofApproved = (statusName: string): boolean =>
  statusName.includes("comprobante aprobado");

const hasCryptoAddress = (order: Order): boolean => Boolean(order.attributes.crypto?.address);
const hasCryptoReference = (order: Order): boolean =>
  Boolean(order.attributes.crypto?.provider_reference || order.attributes.crypto?.txid);
const confirmations = (order: Order): number => Number(order.attributes.crypto?.confirmations ?? 0);
const requiredConfirmations = (order: Order): number =>
  Number(order.attributes.crypto?.confirmations_required ?? order.attributes.crypto?.required_confirmations ?? 0);
const isDepositConfirmed = (order: Order, cryptoStatus: string): boolean => {
  const required = requiredConfirmations(order);
  if (required > 0) {
    return confirmations(order) >= required;
  }

  return cryptoStatus === "confirmed";
};

const isPayoutSubmitted = (order: Order, cryptoStatus: string): boolean =>
  ["submitted", "broadcasted", "confirming", "confirmed"].includes(cryptoStatus)
  || Boolean(order.attributes.crypto?.provider_reference)
  || Boolean(order.attributes.crypto?.txid);

export const buildOrderTimeline = (order: Order): TimelineItem[] => {
  const statusName = normalizeStatusName(order.relationships?.status?.attributes?.name);
  const cryptoStatus = normalizeCryptoStatus(order.attributes.crypto?.status ?? order.attributes.crypto_status ?? null);
  const terminal = Boolean(order.attributes.is_terminal);
  const manualReview = isManualReview(order, statusName, cryptoStatus);
  const cancelled = isCancelled(statusName);
  const failed = isFailed(statusName);

  if (String(order.attributes.type).toLowerCase() === "compra") {
    const payoutSubmitted = isPayoutSubmitted(order, cryptoStatus);
    const txidAvailable = Boolean(order.attributes.crypto?.txid);
    const approved = isPaymentProofApproved(statusName) || payoutSubmitted || terminal;

    return [
      {
        key: "created",
        text: "Orden creada",
        tone: "done",
      },
      {
        key: "voucher",
        text: hasVoucher(order)
          ? (approved ? "Comprobante aprobado" : "Comprobante recibido")
          : "Esperando comprobante",
        tone: hasVoucher(order) ? "done" : "active",
      },
      {
        key: "payout",
        text: txidAvailable
          ? "Cripto enviado"
          : payoutSubmitted
            ? "Payout enviado al provider"
            : approved
              ? "Payout pendiente"
              : "Payout pendiente",
        tone: txidAvailable || payoutSubmitted || approved ? "done" : "idle",
      },
      {
        key: "final",
        text: cancelled
          ? "Cancelada"
          : failed
            ? "Fallida"
            : manualReview
              ? "Manual review"
              : terminal
                ? "Completada"
                : "Pendiente",
        tone: cancelled || failed ? "warning" : manualReview ? "info" : terminal ? "done" : "active",
      },
    ];
  }

  const addressPending = Boolean(order.attributes.address_assignment_pending) && !hasCryptoAddress(order);
  const depositDetected = hasCryptoReference(order) || confirmations(order) > 0 || ["detected", "confirming", "confirmed"].includes(cryptoStatus);
  const depositConfirmed = isDepositConfirmed(order, cryptoStatus);
  const salePaymentProofUploaded = Boolean(order.attributes.sale_payment_proof_download_url || order.attributes.sale_payment_proof_uploaded);
  const salePaymentSent = ["sent", "completed"].includes(String(order.attributes.fiat_payout_status ?? ""));
  const salePaymentCompleted = order.attributes.fiat_payout_status === "completed";

  let fiatText = "Pago fiat pendiente";
  if (salePaymentCompleted) {
    fiatText = "Pago completado";
  } else if (salePaymentSent) {
    fiatText = "Pago enviado";
  } else if (salePaymentProofUploaded) {
    fiatText = "Comprobante registrado";
  } else if (depositConfirmed) {
    fiatText = "Pago en preparacion";
  }

  let finalText = terminal ? "Completado" : "Pendiente";
  let finalTone: TimelineTone = terminal ? "done" : "active";

  if (cancelled) {
    finalText = "Cancelada";
    finalTone = "warning";
  } else if (failed) {
    finalText = "Fallida";
    finalTone = "warning";
  } else if (manualReview) {
    finalText = "Manual review";
    finalTone = "info";
  } else if (order.attributes.underpaid) {
    finalText = "Deposito menor al esperado";
    finalTone = "warning";
  } else if (order.attributes.overpaid) {
    finalText = "Deposito mayor al esperado";
    finalTone = "warning";
  } else if (order.attributes.late_deposit) {
    finalText = "Deposito fuera de tiempo";
    finalTone = "warning";
  }

  return [
    {
      key: "created",
      text: "Orden creada",
      tone: "done",
    },
    {
      key: "address",
      text: addressPending
        ? "Preparando direccion"
        : hasCryptoAddress(order)
          ? "Direccion asignada"
          : "Esperando deposito",
      tone: hasCryptoAddress(order) ? "done" : "active",
    },
    {
      key: "deposit",
      text: depositConfirmed
        ? "Deposito confirmado"
        : depositDetected
          ? "Confirmando en red"
          : "Esperando deposito",
      tone: depositConfirmed ? "done" : depositDetected ? "active" : "idle",
    },
    {
      key: "fiat",
      text: fiatText,
      tone: salePaymentCompleted || salePaymentSent ? "done" : depositConfirmed ? "active" : "idle",
    },
    {
      key: "final",
      text: finalText,
      tone: finalTone,
    },
  ];
};
