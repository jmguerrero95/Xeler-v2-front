import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  reply: vi.fn(),
  close: vi.fn(),
  reopen: vi.fn(),
  assign: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/services/supportTicketsApi", () => ({
  listSupportTickets: api.list,
  getSupportTicket: api.get,
  createSupportTicket: api.create,
  replySupportTicket: api.reply,
  closeSupportTicket: api.close,
  reopenSupportTicket: api.reopen,
  assignSupportTicket: api.assign,
  updateSupportTicket: api.update,
}));
import SupportTicketsView from "../SupportTicketsView.vue";

describe("SupportTicketsView", () => {
  beforeEach(() => api.list.mockResolvedValue({ data: { data: [] } }));

  it("renders a safe empty user inbox and opens ticket creation", async () => {
    const wrapper = shallowMount(SupportTicketsView);
    const view = wrapper.vm as unknown as {
      tickets: unknown[];
      creating: boolean;
    };
    await flushPromises();
    expect(api.list).toHaveBeenCalledWith(false, expect.anything());
    expect(view.tickets).toEqual([]);
    view.creating = true;
    expect(view.creating).toBe(true);
  });

  it("loads an administrative inbox and its conversation", async () => {
    const ticket = {
      public_reference: "ticket-1",
      subject: "Ayuda",
      status: "open",
      priority: "normal",
      messages: [
        {
          id: 1,
          author_type: "user",
          body: "Detalle",
          created_at: "2026-01-01",
        },
      ],
    };
    api.list.mockResolvedValue({ data: { data: [ticket] } });
    api.get.mockResolvedValue({ data: { data: ticket } });
    const wrapper = shallowMount(SupportTicketsView, {
      props: { admin: true },
    });
    const view = wrapper.vm as unknown as {
      current: { subject: string } | null;
      select: (reference: string) => Promise<void>;
    };
    await flushPromises();
    expect(api.list).toHaveBeenCalledWith(true, expect.anything());
    await view.select("ticket-1");
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith("ticket-1", true);
    expect(view.current?.subject).toBe("Ayuda");
  });
});
