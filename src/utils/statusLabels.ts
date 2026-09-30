const STATUS_LABELS: Record<string, string> = {
  not_started: "No iniciado",
  draft: "Borrador",
  submitted: "Enviado",
  pending: "Pendiente",
  pending_review: "Pendiente de revisión",
  under_review: "En revisión",
  needs_correction: "Requiere correcciones",
  approved: "Aprobado",
  verified: "Verificado",
  rejected: "Rechazado",
  suspended: "Suspendido",
  expired: "Expirado",
  disabled: "Deshabilitado",
  processing: "Procesando",
  completed: "Completado",
  canceled: "Cancelado",
  cancelled: "Cancelado",
  failed: "Fallido",
  accepted: "Aceptado",
  superseded: "Reemplazado",
  active: "Activo",
  inactive: "Inactivo",
  normal: "Normal",
  manual: "Manual",
  maintenance: "Mantenimiento",
  healthy: "Operativo",
  degraded: "Degradado",
  unavailable: "No disponible",
  error: "Con error",
  open: "Abierto",
  closed: "Cerrado",
  resolved: "Resuelto",
};

export const statusLabel = (status: unknown): string => {
  const value = String(status ?? "").trim();
  if (!value) return "Sin estado";

  const normalized = value.toLowerCase();
  if (STATUS_LABELS[normalized]) return STATUS_LABELS[normalized];

  return normalized
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const statusOptions = (statuses: string[]) =>
  statuses.map((value) => ({ title: statusLabel(value), value }));
