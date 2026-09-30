<template>
  <div class="d-flex align-center justify-center">
    <VMenu>
      <template #activator="{ props }">
        <!-- <v-btn icon class="mx-0 px-0"  v-bind="props" elevation="0" color="transparent"> -->
        <!-- <v-avatar size="35"> -->
        <NotificationIcon
          class="cursor-pointer"
          v-bind="props"
          :class="colorIcons"
          :active="notifications.length > 0"
        />
        <!-- </v-avatar> -->
        <!-- </v-btn> -->
      </template>
      <v-card max-width="280" elevation="50" class="rounded-xl">
        <v-list>
          <v-list-item class="text-primary text-center">
            <template #title>
              <span class="font-weight-light"> Notificaciones </span>
            </template>
          </v-list-item>

          <v-divider></v-divider>
          <span v-for="(item, index) in notifications" :key="index">
            <v-list-item
              @click="readNotification(item.id)"
              value="1"
              class="text-table"
            >
              <template #title>
                <div class="d-flex gap-2">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                    >
                      <ellipse
                        cx="6.58398"
                        cy="6.5"
                        rx="5"
                        ry="4.5"
                        fill="#5043E9"
                      />
                      <circle
                        cx="6.5"
                        cy="6.5"
                        r="5.5"
                        stroke="#F7F8FA"
                        stroke-width="2"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <div class="text-wrap">
                    <span class="font-weight-light">
                      {{ onlyTwoWords(item.notification) }}
                    </span>
                    {{ allContentMinunTwoFirstWords(item.notification) }}
                  </div>
                </div>
              </template>
              <template #subtitle>
                <div class="text-right font-weight-light">
                  <span>{{
                    dayjs(item.created_at).format("YYYY-MM-DD HH:mm:s")
                  }}</span>
                </div>
              </template>
            </v-list-item>
            <v-divider></v-divider>
          </span>
          <v-list-item
            v-if="notifications.length > 0"
            @click="goViewNotification"
            class="text-primary text-center"
          >
            <template #title>
              <span class="text-decoration-underline cursor-pointer">
                Ver todo
              </span>
            </template>
          </v-list-item>
          <v-list-item v-else class="text-primary text-center">
            <template #title>
              <span> No hay </span>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </VMenu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import NotificationIcon from "@/assets/icons/header/NotificationIcon.vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import type { User } from "@/interfaces/User/User.model";
import { helperStore } from "@/helper";
import dayjs from "dayjs";
import { UserStore } from "@/stores/UserStore";
import {
  subscribeToAuthenticatedUserNotifications,
  unsubscribeFromUserNotifications,
} from "@/services/notificationSubscription";
import { responseCollection } from "@/utils/responseCollection";

const router = useRouter();
const { smAndDown: isMobile } = useDisplay();
const colorIcons = computed(() => {
  return isMobile.value ? "text-white" : "text-disabled mt-2";
});

const helper = helperStore();
const userStore = UserStore();
const url = "notifications/active/user";

const notifications = ref<Notifications[]>([]);
const index = async () => {
  try {
    const res = await helper.http(
      url,
      "get",
      {
        params: { pag: 5 },
      },
      "",
      true,
    );
    notifications.value = responseCollection<Notifications>(res).filter(
      (n) => !n.read,
    );
  } catch {
    // El encabezado permanece utilizable durante una indisponibilidad breve.
    notifications.value = [];
  }
};
index();

const interval = ref();
onMounted(() => {
  const userId = userStore.authUser?.id;
  if (userId) {
    subscribeToAuthenticatedUserNotifications(userId, () => index());
  }
  interval.value = setInterval(() => index(), 10000);
});

onUnmounted(() => {
  clearInterval(interval.value);
  unsubscribeFromUserNotifications();
});

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
    await helper.http(url, "post");
    await index();
  } catch {}
};

interface Notifications {
  id: number;
  user_id: number;
  notification: string;
  read: number;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  user: User;
}
</script>

<style scoped></style>
