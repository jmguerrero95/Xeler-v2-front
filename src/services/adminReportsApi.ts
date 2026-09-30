import { apiClient } from "@/services/apiClient";

export interface AdminReportFilters {
  date_from?: string;
  date_to?: string;
  timezone?: string;
  currency_id?: number;
  payment_method_id?: number;
  order_type?: "Compra" | "Venta";
  status_id?: number;
  assigned_admin?: number;
}

export interface AdminReport {
  orders: {
    total: number;
    buy: number;
    sell: number;
    completed: number;
    pending: number;
    volume_cop: string;
    average_cop: string;
  };
  users: {
    active: number;
    suspended: number;
    blocked: number;
    new_in_period: number;
    pending_kyc: number;
  };
  operation: { open_tickets: number; average_first_response_seconds: number };
}

export const getAdminReport = (params: AdminReportFilters) =>
  apiClient.get<{ data: AdminReport }>("admin/reports/operations", { params });
