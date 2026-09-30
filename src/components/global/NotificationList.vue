<template>
  <VRow>
    <VCol class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="5">
      <div class="d-flex justify-space-between align-center my-4">
        <h3 class="text-primary font-weight-bold">Notificaciones</h3>
        <a class="cursor-pointer" icon @click="deleteAllNotifications">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="19"
            height="20"
            viewBox="0 0 19 20"
            fill="none"
          >
            <path
              d="M11.3346 16.25H12.3496C12.4842 16.25 12.6133 16.2006 12.7085 16.1127C12.8037 16.0248 12.8571 15.9056 12.8571 15.7812V7.34375C12.8571 7.21943 12.8037 7.1002 12.7085 7.01229C12.6133 6.92439 12.4842 6.875 12.3496 6.875H11.3346C11.2 6.875 11.0709 6.92439 10.9757 7.01229C10.8805 7.1002 10.8271 7.21943 10.8271 7.34375V15.7812C10.8271 15.9056 10.8805 16.0248 10.9757 16.1127C11.0709 16.2006 11.2 16.25 11.3346 16.25ZM18.2707 3.125H14.7853L13.3473 0.910156C13.1669 0.632428 12.9116 0.402614 12.6064 0.243108C12.3011 0.0836025 11.9564 -0.000154039 11.6057 2.12674e-07H7.34168C6.99113 -1.90925e-05 6.64655 0.0838016 6.34149 0.243301C6.03643 0.4028 5.78128 0.632542 5.60089 0.910156L4.16208 3.125H0.676692C0.497222 3.125 0.325103 3.19085 0.198198 3.30806C0.0712941 3.42527 0 3.58424 0 3.75L0 4.375C0 4.54076 0.0712941 4.69973 0.198198 4.81694C0.325103 4.93415 0.497222 5 0.676692 5H1.35338V18.125C1.35338 18.6223 1.56727 19.0992 1.94798 19.4508C2.32869 19.8025 2.84505 20 3.38346 20H15.5639C16.1023 20 16.6187 19.8025 16.9994 19.4508C17.3801 19.0992 17.594 18.6223 17.594 18.125V5H18.2707C18.4501 5 18.6223 4.93415 18.7492 4.81694C18.8761 4.69973 18.9474 4.54076 18.9474 4.375V3.75C18.9474 3.58424 18.8761 3.42527 18.7492 3.30806C18.6223 3.19085 18.4501 3.125 18.2707 3.125ZM7.26767 1.98867C7.29029 1.9539 7.32228 1.92515 7.36054 1.90523C7.39879 1.8853 7.44199 1.87489 7.4859 1.875H11.4615C11.5053 1.87495 11.5484 1.8854 11.5866 1.90532C11.6248 1.92524 11.6567 1.95396 11.6793 1.98867L12.4177 3.125H6.52965L7.26767 1.98867ZM15.5639 18.125H3.38346V5H15.5639V18.125ZM6.59774 16.25H7.61278C7.74738 16.25 7.87647 16.2006 7.97165 16.1127C8.06683 16.0248 8.1203 15.9056 8.1203 15.7812V7.34375C8.1203 7.21943 8.06683 7.1002 7.97165 7.01229C7.87647 6.92439 7.74738 6.875 7.61278 6.875H6.59774C6.46314 6.875 6.33405 6.92439 6.23887 7.01229C6.1437 7.1002 6.09023 7.21943 6.09023 7.34375V15.7812C6.09023 15.9056 6.1437 16.0248 6.23887 16.1127C6.33405 16.2006 6.46314 16.25 6.59774 16.25Z"
              fill="#5C6776"
            />
          </svg>
        </a>
      </div>

      <v-list>
        <v-divider></v-divider>

        <template v-if="notifications.length > 0">
          <v-list-item
            v-for="(item, index) in notifications"
            :key="index"
            class="py-3 px-2"
            :class="{ 'bg-grey-lighten-4': !item.read }"
          >
            <template #title>
              <div class="d-flex justify-space-between align-center">
                <div class="text-wrap">
                  <v-icon color="primary" v-if="!item.read" size="18"
                    >mdi-email</v-icon
                  >
                  <span class="ml-2 font-weight-medium">{{
                    onlyTwoWords(item.notification)
                  }}</span>
                  <span class="ml-1">{{
                    allContentMinunTwoFirstWords(item.notification)
                  }}</span>
                </div>
                <v-icon @click.stop="showDetails(item)" class="cursor-pointer"
                  >mdi-information-outline</v-icon
                >
              </div>
            </template>
            <template #subtitle>
              <div class="text-right text-caption text-grey">
                {{ dayjs(item.created_at).format("YYYY-MM-DD HH:mm:ss") }}
              </div>
            </template>
          </v-list-item>
          <v-divider></v-divider>
        </template>

        <div class="text-center text-grey" v-else>
          <span>Sin notificaciones</span>
        </div>
      </v-list>

      <!-- Modal de detalles -->
      <v-dialog v-model="detailDialog" max-width="500">
        <v-card>
          <v-card-title class="text-primary"
            >Detalles de la Notificación</v-card-title
          >
          <v-card-text>
            <p><strong>Mensaje:</strong> {{ selected.notification }}</p>
            <p>
              <strong>Fecha:</strong>
              {{ dayjs(selected.created_at).format("YYYY-MM-DD HH:mm:ss") }}
            </p>
            <p>
              <strong>Estado:</strong>
              {{ selected.read ? "Leído" : "No leído" }}
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="detailDialog = false">Cerrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </VCol>
  </VRow>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { helperStore } from "@/helper";
import dayjs from "dayjs";
import type { User } from "@/interfaces/User/User.model";
import { useRouter } from "vue-router";
const router = useRouter();

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

const notifications = ref<Notifications[]>([]);
const detailDialog = ref(false);
const selected = ref({} as Notifications);
const helper = helperStore();
const url = "notifications/active/user";

const interval = ref();

const index = async () => {
  const res = await helper.http(url, "get", {}, "", true);
  notifications.value = res.data.response;
};

const onlyTwoWords = (value: string): string => {
  const valueArray = value.split(" ");
  return valueArray.slice(0, 2).join(" ");
};

const allContentMinunTwoFirstWords = (value: string): string => {
  const valueArray = value.split(" ");
  return valueArray.slice(2).join(" ");
};

const showDetails = (item: Notifications) => {
  selected.value = item;
  detailDialog.value = true;
};

const deleteAllNotifications = async () => {
  await helper.http("notifications/delete/all/actives", "delete");
  index();
};

// Kept for the existing notification-to-order navigation contract.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const readNotification = async (item: Notifications) => {
  const url = `notifications/user/read/active/${item.id}`;
  try {
    await helper.http(url, "post");
    await index();

    // Obtener el código de orden del texto
    const match = item.notification.match(/(TNX\d+)/);
    if (match && match[1]) {
      router.push(`/user/check-buy/${match[1]}`);
    }
  } catch (e) {
    console.error("Failed to read notification:", e);
  }
};

onMounted(() => {
  index();
  interval.value = setInterval(() => index(), 8000);
});

onUnmounted(() => {
  clearInterval(interval.value);
});
</script>

<style scoped>
.text-wrap {
  max-width: 80%;
  white-space: normal;
  word-break: break-word;
}
</style>
