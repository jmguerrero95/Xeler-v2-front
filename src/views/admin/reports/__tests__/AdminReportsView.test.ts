import { flushPromises, shallowMount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

const { getReport } = vi.hoisted(() => ({ getReport: vi.fn() }));
vi.mock("@/services/adminReportsApi", () => ({ getAdminReport: getReport }));
import AdminReportsView from "../AdminReportsView.vue";

describe("AdminReportsView", () => {
  it("starts empty and sends explicit Bogota filters", async () => {
    getReport.mockResolvedValue({
      data: {
        data: {
          orders: { total: 0, volume_cop: "0" },
          users: { active: 0 },
          operation: { open_tickets: 0 },
        },
      },
    });
    const wrapper = shallowMount(AdminReportsView);
    const view = wrapper.vm as unknown as {
      report: { orders: { total: number } } | null;
      load: () => Promise<void>;
    };
    expect(view.report).toBeNull();
    await view.load();
    await flushPromises();
    expect(getReport).toHaveBeenCalledWith(
      expect.objectContaining({ timezone: "America/Bogota" }),
    );
    expect(view.report?.orders.total).toBe(0);
  });
});
