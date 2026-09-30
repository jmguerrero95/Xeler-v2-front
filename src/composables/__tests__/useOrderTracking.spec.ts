import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { describe, expect, it, vi, beforeEach } from "vitest";

const orderRef = ref<any>(null);
const loadingRef = ref(false);
const errorRef = ref<string | null>(null);
const getMyOrderByTransactionMock = vi.fn();
const getAdminOrderByTransactionMock = vi.fn();

const pusherInstances: Array<{
  channelName: string;
  eventName: string;
  callback: () => Promise<void> | void;
  unMounted: ReturnType<typeof vi.fn>;
}> = [];

vi.mock("pinia", async (importOriginal) => {
  const actual = await importOriginal<typeof import("pinia")>();
  return {
    ...actual,
    storeToRefs: (store: any) => ({
      order: store.order,
      loading: store.loading,
      error: store.error,
    }),
  };
});

vi.mock("@/stores/TransactionStore", () => ({
  TransactionStore: () => ({
    order: orderRef,
    loading: loadingRef,
    error: errorRef,
    getMyOrderByTransaction: getMyOrderByTransactionMock,
    getAdminOrderByTransaction: getAdminOrderByTransactionMock,
  }),
}));

vi.mock("@/pusher", () => ({
  default: class MockPusher {
    public unMounted = vi.fn();

    constructor(
      public channelName: string,
      public eventName: string,
      public callback: () => Promise<void> | void,
    ) {
      pusherInstances.push(this);
    }
  },
}));

import { useOrderTracking } from "../useOrderTracking";

describe("useOrderTracking", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pusherInstances.length = 0;
    orderRef.value = null;
    loadingRef.value = false;
    errorRef.value = null;
    getMyOrderByTransactionMock.mockReset();
    getAdminOrderByTransactionMock.mockReset();
    getMyOrderByTransactionMock.mockImplementation(async () => {
      orderRef.value = {
        id: 101,
        attributes: { is_terminal: false },
      };
      return orderRef.value;
    });
  });

  it("creates one subscription per order, refreshes on event and cleans up", async () => {
    const TestComponent = defineComponent({
      setup() {
        return useOrderTracking("TNX101", "user");
      },
      render() {
        return h("div");
      },
    });

    const wrapper = mount(TestComponent);
    await flushPromises();
    await nextTick();

    expect(getMyOrderByTransactionMock).toHaveBeenCalledTimes(1);
    expect(pusherInstances).toHaveLength(1);
    expect(pusherInstances[0].channelName).toBe("private-orders.101");
    expect(pusherInstances[0].eventName).toBe(".order.status.changed");

    await pusherInstances[0].callback();
    await flushPromises();

    expect(getMyOrderByTransactionMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(15000);
    expect(getMyOrderByTransactionMock).toHaveBeenCalledTimes(3);

    orderRef.value = {
      id: 101,
      attributes: { is_terminal: true },
    };
    await nextTick();
    await vi.advanceTimersByTimeAsync(30000);
    expect(getMyOrderByTransactionMock).toHaveBeenCalledTimes(3);

    wrapper.unmount();

    expect(pusherInstances[0].unMounted).toHaveBeenCalledTimes(1);
  });
});
