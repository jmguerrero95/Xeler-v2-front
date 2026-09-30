import type { PublicOperationsStatus } from "@/interfaces/ControlCenter/ControlCenter.model";

export const buildOperationsBlockedMessage = (
  mode: "buy" | "sell",
  status: PublicOperationsStatus | null,
  loading: boolean,
  error: string,
): string => {
  if (loading) {
    return mode === "buy"
      ? "Estamos verificando la disponibilidad operativa antes de habilitar compras."
      : "Estamos verificando la disponibilidad operativa antes de habilitar ventas.";
  }

  if (error) {
    return error;
  }

  if (!status) {
    return mode === "buy"
      ? "No fue posible verificar la disponibilidad operativa de compras."
      : "No fue posible verificar la disponibilidad operativa de ventas.";
  }

  if (status.system_status === "emergency_stopped") {
    return status.public_message || "El sistema esta temporalmente detenido por seguridad. Intenta mas tarde.";
  }

  if (!status.new_orders_enabled || (mode === "buy" ? !status.buy_enabled : !status.sell_enabled)) {
    return status.public_message
      || (mode === "buy"
        ? "Las compras estan temporalmente deshabilitadas."
        : "Las ventas estan temporalmente deshabilitadas.");
  }

  return "";
};
