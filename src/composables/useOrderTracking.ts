import usePusher from "@/pusher";
import { TransactionStore } from "@/stores/TransactionStore";
import { storeToRefs } from "pinia";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const POLL_INTERVAL_MS = Number(import.meta.env.VITE_ORDER_TRACKING_POLL_INTERVAL_MS ?? 15000);

export const useOrderTracking = (tranxNo: string, mode: "user" | "admin" = "user") => {
  const transactionStore = TransactionStore();
  const { order, loading, error } = storeToRefs(transactionStore);
  const subscription = ref<usePusher | null>(null);
  const subscribedOrderId = ref<number | null>(null);
  const intervalId = ref<number | null>(null);
  const inFlight = ref(false);
  const isPolling = ref(false);
  const isRealtimeConnected = ref(false);

  const isTerminal = computed(() => Boolean(order.value?.attributes?.is_terminal));

  const loadOrder = async (silent = false) => {
    if (inFlight.value) return;
    inFlight.value = true;
    try {
      if (mode === "admin") {
        await transactionStore.getAdminOrderByTransaction(tranxNo, { silent });
      } else {
        await transactionStore.getMyOrderByTransaction(tranxNo, { silent });
      }
    } finally {
      inFlight.value = false;
    }
  };

  const refreshOrder = async () => {
    await loadOrder(true);
  };

  const unsubscribe = () => {
    subscription.value?.unMounted();
    subscription.value = null;
    subscribedOrderId.value = null;
    isRealtimeConnected.value = false;
  };

  const subscribe = () => {
    const orderId = order.value?.id ?? null;
    if (!orderId) return;
    if (subscription.value && subscribedOrderId.value === orderId) return;

    unsubscribe();

    try {
      subscription.value = new usePusher(
        `private-orders.${orderId}`,
        ".order.status.changed",
        async () => {
          await refreshOrder();
        },
      );
      subscribedOrderId.value = orderId;
      isRealtimeConnected.value = true;
    } catch (error) {
      unsubscribe();
    }
  };

  const stopPolling = () => {
    if (intervalId.value !== null) {
      window.clearInterval(intervalId.value);
      intervalId.value = null;
    }
    isPolling.value = false;
  };

  const startPolling = () => {
    if (intervalId.value !== null || isTerminal.value) return;
    intervalId.value = window.setInterval(async () => {
      if (document.hidden || isTerminal.value || inFlight.value) return;
      await refreshOrder();
    }, POLL_INTERVAL_MS);
    isPolling.value = true;
  };

  const handleVisibilityChange = async () => {
    if (!document.hidden && !isTerminal.value) {
      await refreshOrder();
      startPolling();
      return;
    }
    stopPolling();
  };

  onMounted(async () => {
    await loadOrder(false);
    subscribe();
    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);
  });

  watch(
    () => order.value?.id,
    () => {
      subscribe();
      if (isTerminal.value) {
        stopPolling();
      }
    },
  );

  watch(isTerminal, (terminal) => {
    if (terminal) {
      stopPolling();
      return;
    }

    startPolling();
  });

  onUnmounted(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    stopPolling();
    unsubscribe();
  });

  return {
    order,
    loading,
    error,
    isTerminal,
    loadOrder,
    refreshOrder,
    isPolling,
    isRealtimeConnected,
  };
};
