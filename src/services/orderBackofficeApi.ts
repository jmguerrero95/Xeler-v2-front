import { apiClient } from "@/services/apiClient";

export type AssignmentAction = "take" | "release" | "transfer" | "reassign";

export interface BackofficeActionPayload {
  reason?: string;
  target_admin_id?: number;
}

export const runOrderAssignmentAction = (
  orderId: number,
  action: AssignmentAction,
  payload: BackofficeActionPayload = {},
) =>
  apiClient.post(`admin/backoffice/orders/${orderId}/${action}`, payload, {
    idempotent: true,
    financialScope: "finance.order_admin",
  });

export const changeOrderOperationalData = (
  orderId: number,
  field:
    | "bank-account"
    | "payout-account"
    | "destination-wallet"
    | "payment-method",
  payload: Record<string, string | number>,
) =>
  apiClient.patch(`admin/backoffice/orders/${orderId}/${field}`, payload, {
    idempotent: true,
    financialScope: "finance.order_admin",
  });
