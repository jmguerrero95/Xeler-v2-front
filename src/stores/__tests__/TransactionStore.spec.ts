import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { TransactionStore } from "../TransactionStore";

const httpMock = vi.fn();

vi.mock("@/helper", () => ({
  helperStore: () => ({
    http: httpMock,
  }),
}));

describe("TransactionStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    httpMock.mockReset();
  });

  it("replaces the previous order when a new one is loaded", async () => {
    const store = TransactionStore();
    (store as any).order = {
      id: 99,
      attributes: { tranx_no: "OLD" },
    };

    httpMock.mockResolvedValueOnce({
      data: {
        response: {
          id: 100,
          attributes: { tranx_no: "TNX100", is_terminal: false },
        },
      },
    });

    await store.getMyOrderByTransaction("TNX100");

    expect((store as any).order?.id).toBe(100);
    expect(store.error).toBeNull();
  });

  it("clears the stale order when the request fails", async () => {
    const store = TransactionStore();
    (store as any).order = {
      id: 99,
      attributes: { tranx_no: "OLD" },
    };

    httpMock.mockRejectedValueOnce(new Error("boom"));

    await expect(store.getMyOrderByTransaction("TNX404")).rejects.toBe(false);

    expect((store as any).order).toBeNull();
    expect(store.error).toBe("No fue posible cargar la orden.");
  });
});
