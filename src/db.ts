const db = {
  status: {
    Active: "Activo",
    Inactive: "Suspendido",
    Verification: "En verificacion",
    Awaiting: "En espera de comprobante",
    Accept: "Aceptado",
    Reject: "Rechazado",
    true: "true",
    false: "false",
  },
  statusColor: {
    true: "success",
    false: "error",
    Verification: "warning",
    Awaiting: "info",
    Accept: "success",
    Inactive: "error",
    Active: "ok",
    Reject: "error",
  },
  verificateStatusField: {
    kyc: "general_status",
  },
  verificateStatusValue: {
    general_status: "EN VERIFICACION",
  },
  methodVerificatedStatus: {
    kyc: "put",
  },
};
export declare type Status =
  | "Active"
  | "Inactive"
  | "Verification"
  | "Awaiting"
  | "Accept"
  | "Reject"
  | "true"
  | "false";

export declare type StatusOperationVerified = "kyc";

export declare type StatusOperationVerifiedValue = "general_status";

export declare type CheckedOrBlockedType = "accept" | "reject";

export default db;

export const statusText = (text: string | boolean) => {
  let status: Status;
  switch (text) {
    case true:
      status = "Active";
      break;
    case false:
      status = "Inactive";
      break;
    case "EN VERIFICACION":
      status = "Verification";
      break;
    case "EN ESPERA DE COMPROBANTE":
      status = "Awaiting";
      break;
    case "ACEPTADO":
      status = "Accept";
      break;
    case "RECHAZADO":
      status = "Reject";
      break;
    default:
      status = "Active";
      break;
  }
  return status;
};
