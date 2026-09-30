import { ref, computed, onMounted, onUnmounted, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { UserStore } from "@/stores/UserStore";
import usePusher from "@/pusher";
import { staffChatSummary } from "@/services/supportChatApi";

const pendingCount = ref(0);
const unassignedCount = ref(0);
const mineCount = ref(0);
const waitingStaffCount = ref(0);
const waitingCustomerCount = ref(0);
const personalUnreadCount = ref(0);
const lastActivityId = ref(0);
const isConnected = ref(false);
let pusher: InstanceType<typeof usePusher> | null = null;
let summaryInterval: number | undefined;
let isInitialized = false;

export function useSupportChatGlobal() {
  const store = UserStore();
  const route = useRoute();

  const canAccess = computed(() => store.hasRole("Superadmin") || store.hasPermission("support_chat.access"));

  const loadSummary = async () => {
    if (!canAccess.value) return;
    try {
      const response = await staffChatSummary();
      const data = response.data.data;
      pendingCount.value = data.pending_count ?? 0;
      unassignedCount.value = data.unassigned_count ?? 0;
      mineCount.value = data.mine_count ?? 0;
      waitingStaffCount.value = data.waiting_staff_count ?? 0;
      waitingCustomerCount.value = data.waiting_customer_count ?? 0;
      personalUnreadCount.value = data.personal_unread_count ?? 0;
      lastActivityId.value = data.last_activity_id ?? 0;
    } catch (e) {
      console.warn("[SupportChatGlobal] Failed to load summary:", e);
    }
  };

  const connect = () => {
    if (!canAccess.value || pusher) return;
    try {
      pusher = new usePusher("private-support.staff", ".support.chat.updated", async (event: any) => {
        const action = event?.action;
        const senderType = event?.sender_type;
        const messageId = event?.message_id;

        if (action === "message" && senderType === "user") {
          await loadSummary();
        } else if (["assigned", "closed", "reopened", "initiated", "block_changed"].includes(action)) {
          await loadSummary();
        }
      });
      isConnected.value = true;
    } catch (e) {
      console.warn("[SupportChatGlobal] Failed to connect to Pusher:", e);
      isConnected.value = false;
    }
  };

  const disconnect = () => {
    if (pusher) {
      pusher.unMounted();
      pusher = null;
      isConnected.value = false;
    }
  };

  const resync = async () => {
    await loadSummary();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible" && canAccess.value) {
      resync();
    }
  };

  const onFocus = () => {
    if (canAccess.value) {
      resync();
    }
  };

  onMounted(() => {
    if (canAccess.value && !isInitialized) {
      loadSummary();
      connect();
      if (summaryInterval === undefined) {
        summaryInterval = window.setInterval(() => {
          if (document.visibilityState === "visible") {
            loadSummary();
          }
        }, 60000);
      }
      document.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener("focus", onFocus);
      isInitialized = true;
    }
  });

  onUnmounted(() => {
    if (summaryInterval !== undefined) {
      clearInterval(summaryInterval);
      summaryInterval = undefined;
    }
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("focus", onFocus);
  });

  watchEffect(() => {
    if (canAccess.value && !isInitialized) {
      loadSummary();
      connect();
    } else if (!canAccess.value && isInitialized) {
      disconnect();
      pendingCount.value = 0;
      unassignedCount.value = 0;
      mineCount.value = 0;
      waitingStaffCount.value = 0;
      waitingCustomerCount.value = 0;
      personalUnreadCount.value = 0;
      lastActivityId.value = 0;
      isInitialized = false;
    }
  });

  return {
    pendingCount: computed(() => pendingCount.value),
    unassignedCount: computed(() => unassignedCount.value),
    mineCount: computed(() => mineCount.value),
    waitingStaffCount: computed(() => waitingStaffCount.value),
    waitingCustomerCount: computed(() => waitingCustomerCount.value),
    personalUnreadCount: computed(() => personalUnreadCount.value),
    lastActivityId: computed(() => lastActivityId.value),
    isConnected: computed(() => isConnected.value),
    totalUnread: computed(() => personalUnreadCount.value),
    resync,
  };
}