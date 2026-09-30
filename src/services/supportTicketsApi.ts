import { apiClient } from "@/services/apiClient";

export interface SupportAttachment {
  public_reference: string;
  original_name: string;
  mime_type: string;
  size: number;
  download_endpoint: string;
}

export interface SupportMessage {
  id: number;
  author_type: "user" | "agent";
  body: string;
  created_at: string;
  attachments?: SupportAttachment[];
}

export interface SupportTicket {
  public_reference: string;
  subject: string;
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  order?: { id: number; tranx_no: string } | null;
  user?: { id: number; name: string; email?: string } | null;
  assignee?: { id: number; name: string } | null;
  messages?: SupportMessage[];
  last_message_at?: string | null;
}

const formData = (data: Record<string, string | number | File | undefined>) => {
  const body = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== "")
      body.append(key, value as string | Blob);
  });
  return body;
};

export const listSupportTickets = (
  admin: boolean,
  params: Record<string, unknown> = {},
) =>
  apiClient.get<{ data: SupportTicket[]; meta: unknown }>(
    admin ? "admin/support/tickets" : "support/tickets",
    { params },
  );

export const getSupportTicket = (reference: string, admin: boolean) =>
  apiClient.get<{ data: SupportTicket }>(
    `${admin ? "admin/" : ""}support/tickets/${reference}`,
  );

export const createSupportTicket = (
  data: Record<string, string | number | File | undefined>,
) => apiClient.post<{ data: SupportTicket }>("support/tickets", formData(data));

export const replySupportTicket = (
  reference: string,
  admin: boolean,
  body: string,
  attachment?: File,
) =>
  apiClient.post<{ data: SupportTicket }>(
    `${admin ? "admin/" : ""}support/tickets/${reference}/messages`,
    formData({ body, attachment }),
    { idempotent: admin },
  );

export const closeSupportTicket = (
  reference: string,
  admin: boolean,
  reason?: string,
) =>
  apiClient.post(
    `${admin ? "admin/" : ""}support/tickets/${reference}/close`,
    admin ? { reason } : undefined,
    { idempotent: admin },
  );

export const reopenSupportTicket = (
  reference: string,
  admin: boolean,
  reason?: string,
) =>
  apiClient.post(
    `${admin ? "admin/" : ""}support/tickets/${reference}/reopen`,
    admin ? { reason } : undefined,
    { idempotent: admin },
  );

export const assignSupportTicket = (
  reference: string,
  targetAdminId: number,
  reason: string,
) =>
  apiClient.post(
    `admin/support/tickets/${reference}/assign`,
    { target_admin_id: targetAdminId, reason },
    { idempotent: true },
  );

export const updateSupportTicket = (
  reference: string,
  data: Record<string, string>,
) =>
  apiClient.patch(`admin/support/tickets/${reference}`, data, {
    idempotent: true,
  });
