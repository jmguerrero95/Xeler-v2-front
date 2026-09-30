<template>
  <div class="d-flex align-center justify-center">
    <VMenu v-if="isAdmin && canAccess">
      <template #activator="{ props }">
        <VBtn
          v-bind="props"
          variant="text"
          class="mx-0 px-2"
          :class="colorIcons"
          :aria-label="`Chat de soporte: ${totalUnread} mensajes sin leer`"
        >
          <VBadge v-if="totalUnread > 0" :content="totalUnread > 99 ? '99+' : totalUnread" color="error" offset-x="8" offset-y="-8">
            <VIcon :color="totalUnread > 0 ? 'error' : 'primary'">mdi-message-alert</VIcon>
          </VBadge>
          <VIcon v-else :color="totalUnread > 0 ? 'error' : 'primary'">mdi-message-outline</VIcon>
        </VBtn>
      </template>
      <VCard min-width="320" elevation="10" class="rounded-xl">
        <VCardTitle class="d-flex align-center justify-space-between">
          <span class="font-weight-medium">Chat de soporte</span>
          <VBtn icon="mdi-chevron-right" size="small" variant="text" @click="goToSupportChat" />
        </VCardTitle>
        <VDivider />
        <VList density="compact" lines="two" class="pa-2" v-if="totalUnread > 0 || pendingCount > 0 || unassignedCount > 0">
          <VListItem v-if="pendingCount > 0" title="Conversaciones esperando soporte" subtitle="{{ pendingCount }} pendientes" prepend-icon="mdi-clock-alert" @click="goToSupportChat" />
          <VListItem v-if="unassignedCount > 0" title="Sin asignar" subtitle="{{ unassignedCount }} conversaciones" prepend-icon="mdi-account-question" @click="goToSupportChat" />
          <VListItem v-if="mineCount > 0" title="Mis conversaciones" subtitle="{{ mineCount }} asignadas" prepend-icon="mdi-account-check" @click="goToSupportChat" />
          <VListItem v-if="waitingCustomerCount > 0" title="Esperando cliente" subtitle="{{ waitingCustomerCount }} conversaciones" prepend-icon="mdi-account-clock" @click="goToSupportChat" />
        </VList>
        <VListItem v-else class="text-center pa-4 text-medium-emphasis" title="No hay actividad pendiente" />
        <VDivider />
        <VCardActions class="justify-center">
          <VBtn variant="text" @click="goToSupportChat">Ir al chat de soporte</VBtn>
        </VCardActions>
      </VCard>
    </VMenu>
    <VMenu v-else-if="isUser">
      <template #activator="{ props }">
        <VBtn
          v-bind="props"
          variant="text"
          class="mx-0 px-2"
          :class="colorIcons"
          :aria-label="`Notificaciones: ${notifications.length}`"
        >
          <VBadge v-if="notifications.length > 0" :content="notifications.length > 99 ? '99+' : notifications.length" color="error" offset-x="8" offset-y="-8">
            <NotificationIcon :class="colorIcons" />
          </VBadge>
          <NotificationIcon v-else :class="colorIcons" />
        </VBtn>
      </template>
      <VCard max-width="280" elevation="50" class="rounded-xl">
        <VList>
          <VListItem class="text-primary text-center">
            <template #title>
              <span class="font-weight-light">Notificaciones</span>
            </template>
          </VListItem>
          <VDivider />
          <span v-for="(item, index) in notifications" :key="index">
            <VListItem :value="index" class="text-table">
              <template #title>
                <div class="d-flex gap-2">
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <ellipse cx="6.58398" cy="6.5" rx="5" ry="4.5" fill="#5043E9" />
                      <circle cx="6.5" cy="6.5" r="5.5" stroke="#F7F8FA" stroke-width="2" stroke-linejoin="round" />
                    </svg>
                  </div>
                  <div class="text-wrap">
                    <span class="font-weight-light">{{ onlyTwoWords(item.notification) }}</span>
                    {{ allContentMinunTwoFirstWords(item.notification) }}
                  </div>
                </div>
              </template>
              <template #subtitle>
                <div class="text-right font-weight-light">
                  <span>{{ dayjs(item.created_at).format("YYYY-MM-DD HH:mm:ss") }}</span>
                </div>
              </template>
            </VListItem>
            <VDivider />
          </span>
          <VListItem @click="goViewNotification" class="text-primary text-center">
            <template #title>
              <span class="text-decoration-underline cursor-pointer">Ver todo</span>
            </template>
          </VListItem>
        </VList>
      </VCard>
    </VMenu>
  </div>
</template>

<script setup lang="ts">
import MessageIcon from "@/assets/icons/header/MessageIcon.vue";
import NotificationIcon from "@/assets/icons/header/NotificationIcon.vue";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import type { User } from "@/interfaces/User/User.model";
import { helperStore } from "@/helper";
import dayjs from "dayjs";
import { responseCollection } from "@/utils/responseCollection";
import { UserStore } from "@/stores/UserStore";
import { useSupportChatGlobal } from "@/composables/useSupportChatGlobal";

const router = useRouter();
const { smAndDown: isMobile } = useDisplay();
const userStore = UserStore();
const helper = helperStore();

const isAdmin = computed(() => userStore.navigationContext() === "admin");
const isUser = computed(() => userStore.navigationContext() === "user");

const { pendingCount, unassignedCount, mineCount, waitingCustomerCount, personalUnreadCount, resync } = useSupportChatGlobal();

const totalUnread = computed(() => personalUnreadCount.value);

const canAccess = computed(() => userStore.hasRole("Superadmin") || userStore.hasPermission("support_chat.access"));

const colorIcons = computed(() => {
  return isMobile.value ? "text-white" : "text-disabled mt-2";
});

const notifications = ref<Notifications[]>([]);
const url = "notifications/active/user";

const loadNotifications = async () => {
  try {
    const res = await helper.http(url, "get", { params: { pag: 5 } }, "", true);
    notifications.value = responseCollection<Notifications>(res);
  } catch {
    notifications.value = [];
  }
};

const interval = ref<ReturnType<typeof setInterval>>();
onMounted(() => {
  loadNotifications();
  interval.value = setInterval(() => loadNotifications(), 60000);
});

onUnmounted(() => {
  if (interval.value) clearInterval(interval.value);
});

const goToSupportChat = () => {
  router.push({ name: "SupportChat" });
};

const goViewNotification = () => router.push({ name: "Notifications" });

const quantityWordsTitle = 2;
const allContentMinunTwoFirstWords = (value: string): string => {
  const valueArray = value.split(" ");
  const newValue = valueArray.splice(quantityWordsTitle, valueArray.length);
  return newValue.join(" ");
};
const onlyTwoWords = (value: string): string => {
  const valueArray = value.split(" ");
  const newValue = valueArray.splice(0, quantityWordsTitle);
  return newValue.join(" ");
};

const readNotification = async (id: string | number) => {
  const url = `notifications/user/read/active/${id}`;
  try {
    const res = await helper.http(url, "post");
    loadNotifications();
  } catch (e) {}
};

interface Notifications {
  id: number;
  user_id: number;
  notification: string;
  read: number;
  deleted_at?: any;
  created_at: string;
  updated_at: string;
  user: User;
}
</script>

<style scoped>
.gap-icon-web {
  gap: 32px;
}
.gap-icon-mobile {
  gap: 12px;
}
.v-list-item-subtitle {
  opacity: 1 !important;
}
.text-item-menu {
  color: #8b2cf5;
}
.text-xeler-cop {
  color: #20abe6;
}
</style>