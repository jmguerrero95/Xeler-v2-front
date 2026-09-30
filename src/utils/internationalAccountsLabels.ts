import type { InternationalAccountStatus } from "@/interfaces/InternationalAccounts/InternationalAccounts.model";

const accountStatusLabels: Record<InternationalAccountStatus, string> = {
  not_eligible: "No elegible",
  eligible: "Elegible",
  requested: "Solicitada",
  under_review: "En revisi\u00f3n",
  approved: "Aprobada",
  rejected: "Rechazada",
  suspended: "Suspendida",
};

const kycStatusLabels: Record<string, string> = {
  not_started: "No iniciado",
  submitted: "Enviado",
  under_review: "En revisi\u00f3n",
  incomplete: "Incompleto",
  approved: "Aprobado",
  rejected: "Rechazado",
  suspended: "Suspendido",
};

const gatewayActionLabels: Record<string, string> = {
  authorize: "Autorizar pago",
  capture: "Confirmar pago",
  refund: "Reembolsar pago",
  broadcast_transaction: "Transmitir transacci\u00f3n",
  fetch_transaction: "Consultar transacci\u00f3n",
  create_transfer: "Crear transferencia",
  fetch_transfer: "Consultar transferencia",
  send: "Enviar notificaci\u00f3n",
  customer_create: "Crear cliente Bridge",
  customer_get: "Consultar cliente Bridge",
  kyc_link_create: "Crear enlace de verificaci\u00f3n",
  kyc_link_get: "Consultar enlace de verificaci\u00f3n",
  customer_kyc_link_get: "Consultar verificaci\u00f3n adicional",
  customer_tos_link_get: "Consultar t\u00e9rminos adicionales",
  sandbox_kyc_approve: "Simular aprobaci\u00f3n KYC (entorno de pruebas)",
  wallet_create: "Crear billetera Bridge",
  wallet_get: "Consultar billetera Bridge",
  wallet_list: "Listar billeteras Bridge",
  virtual_account_create: "Crear cuenta bancaria virtual",
  virtual_account_get: "Consultar cuenta bancaria virtual",
  virtual_account_list: "Listar cuentas bancarias virtuales",
  virtual_account_history: "Consultar movimientos de cuenta virtual",
  virtual_account_deactivate: "Desactivar cuenta bancaria virtual",
  virtual_account_reactivate: "Reactivar cuenta bancaria virtual",
  external_account_create: "Crear cuenta bancaria destino",
  external_account_get: "Consultar cuenta bancaria destino",
  external_account_list: "Listar cuentas bancarias destino",
  external_account_deactivate: "Desactivar cuenta bancaria destino",
  external_account_reactivate: "Reactivar cuenta bancaria destino",
  transfer_create: "Crear transferencia",
  transfer_get: "Consultar transferencia",
  transfer_list: "Listar transferencias",
  transfer_cancel: "Cancelar transferencia",
};

const gatewayStateLabels: Record<string, string> = {
  closed: "Cerrado / operativo",
  open: "Abierto / bloqueado temporalmente",
  half_open: "Prueba de recuperaci\u00f3n",
};

const gatewayOperationalLabels: Record<string, string> = {
  disabled: "Deshabilitado",
  simulated: "Proveedor simulado",
  not_configured: "No configurado",
  available: "Sin fallos detectados",
  degraded: "Degradado",
  circuit_open: "Bloqueado temporalmente",
};

export const internationalAccountStatusLabel = (
  status?: string | null,
): string =>
  accountStatusLabels[status as InternationalAccountStatus] ??
  "Estado desconocido";

export const internationalAccountKycLabel = (status?: string | null): string =>
  kycStatusLabels[status ?? ""] ?? "Estado desconocido";

export const internationalAccountSourceLabel = (
  source?: string | null,
): string =>
  ({
    admin_manual: "Habilitaci\u00f3n manual",
    support_referral: "Remisi\u00f3n de soporte",
    behavior_rule: "Regla de comportamiento",
  })[source ?? ""] ?? "No informado";

export const internationalAccountActionLabel = (
  action?: string | null,
): string =>
  ({
    "take-review": "Tomar revisi\u00f3n",
    approve: "Aprobar",
    reject: "Rechazar",
    suspend: "Suspender",
  })[action ?? ""] ?? "Acci\u00f3n";

export const gatewayActionLabel = (action?: string | null): string =>
  gatewayActionLabels[action ?? ""] ?? "Acci\u00f3n no identificada";

export const gatewayProviderLabel = (provider?: string | null): string =>
  ({
    fake_payment: "Proveedor de pagos simulado",
    fake_blockchain: "Red blockchain simulada",
    fake_custody: "Custodia simulada",
    fake_notification: "Notificaciones simuladas",
    bridge: "Bridge",
  })[provider ?? ""] ?? "Proveedor no identificado";

export const gatewayCircuitLabel = (state?: string | null): string =>
  gatewayStateLabels[state ?? ""] ?? "Estado desconocido";

export const gatewayOperationalLabel = (status?: string | null): string =>
  gatewayOperationalLabels[status ?? ""] ?? "Estado no disponible";

export const gatewayDriverLabel = (driver?: string | null): string => {
  if (!driver) return "No aplica";

  return (
    {
      fake: "Simulado",
      bridge_sandbox: "Bridge - entorno de pruebas",
      bridge: "Bridge - producci\u00f3n",
    }[driver] ?? "Integraci\u00f3n no identificada"
  );
};

export const yesNoLabel = (value?: boolean | null): string =>
  value ? "S\u00ed" : "No";

export const internationalProviderStatusLabel = (
  status?: string | null,
): string =>
  ({
    not_started: "No iniciado",
    incomplete: "Verificaci\u00f3n incompleta",
    under_review: "En revisi\u00f3n",
    active: "Aprobado",
    approved: "Aprobado",
    rejected: "Rechazado",
    paused: "Pausado por el proveedor",
    offboarded: "Servicio cerrado por el proveedor",
    deposits_restricted: "Depósitos restringidos por el proveedor",
  })[status ?? ""] ?? "Estado pendiente";

export const internationalTosStatusLabel = (status?: string | null): string =>
  ({
    not_started: "T\u00e9rminos pendientes",
    pending: "T\u00e9rminos pendientes",
    incomplete: "T\u00e9rminos incompletos",
    approved: "T\u00e9rminos aceptados",
    accepted: "T\u00e9rminos aceptados",
    rejected: "T\u00e9rminos no aceptados",
  })[status ?? ""] ?? "Estado pendiente";

export const internationalProductStatusLabel = (
  status?: string | null,
): string =>
  ({
    approved: "Aprobada",
    active: "Aprobada",
    pending: "Pendiente",
    incomplete: "Requiere informaci\u00f3n adicional",
    under_review: "En revisi\u00f3n",
    rejected: "No aprobada",
    paused: "Pausada por el proveedor",
    offboarded: "Servicio cerrado por el proveedor",
    deposits_restricted: "Depósitos restringidos por el proveedor",
  })[status ?? ""] ?? "Pendiente";

export const internationalRequirementLabel = (code?: string | null): string =>
  ({
    terms_of_service_v1: "Aceptar los t\u00e9rminos de servicio requeridos",
    terms_of_service_v2:
      "Aceptar la versi\u00f3n actualizada de los t\u00e9rminos",
    proof_of_address: "Comprobante de domicilio",
    proof_of_address_document: "Comprobante de domicilio",
    address_of_residence: "Direcci\u00f3n de residencia",
    sanctions_screen: "Validaci\u00f3n de cumplimiento",
    tax_identification_number: "Identificaci\u00f3n tributaria",
  })[code ?? ""] ?? "Se requiere informaci\u00f3n adicional";
