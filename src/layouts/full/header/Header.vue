<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref, computed } from "vue";
import { profile, type ToItems } from "./data";
import ProfileIcon from "@/assets/icons/header/ProfileIcon.vue";
import AdminIcon from "@/assets/icons/header/Profile/AdminIcon.vue";
import { useDisplay } from "vuetify";
import LogOutIcon from "@/assets/icons/header/Profile/LogOutIcon.vue";
import { useRouter } from "vue-router";
import { getUserAuth } from "@/helper";
import { formatNumber } from "@/helper";
import BlueStarkIcon from "@/assets/icons/header/Profile/BlueStarkIcon.vue";
import { UserStore } from "@/stores/UserStore";
import { onMounted } from "vue";
import { onUnmounted } from "vue";
import NotificationComponent from "@/layouts/full/header/NotificationComponent.vue";
import MessagesComponent from "./MessagesComponent.vue";
const userStore = UserStore();
const interval = ref();
userStore.updateUserAuth();
onMounted(() => {
  interval.value = setInterval(() => {
    userStore.updateUserAuth();
  }, 300000);
});
onUnmounted(() => {
  clearInterval(interval.value);
});

const router = useRouter();
const { smAndDown: isMobile } = useDisplay();
const userprofile = ref(profile);

const logout = async (): Promise<void> => {
  await userStore.logout();
};

const fullname = computed(() => {
  const user = getUserAuth();
  return `${user.first_name} ${user.last_name ?? ""}`;
});

const xelerCop = computed(() => {
  return (
    formatNumber(userStore.userAuth?.attributes.xcop ?? 0, ",", ".", 0) +
    " XCOP"
  );
});

const clickInProfile = (to: ToItems): void => {
  const routeName = userStore.navigationContext() === "admin"
    ? profileRoutes.admin[to]
    : profileRoutes.user[to];
  if (routeName === "#") return;
  router.push({ name: routeName });
};

const clickInProfileMobile = () => {
  router.push({
    name: userStore.navigationContext() === "admin"
      ? "admin-profile"
      : "user-mobile-view",
  });
};

const profileRoutes = {
  admin: {
    profile: "admin-profile",
    activity: "activities",
  },
  user: {
    profile: "user-profile",
    activity: "activities",
  },
};
</script>

<template>
  <div class="mr-8">
    <!-- ---------------------------------------------- -->
    <!-- User Profile -->
    <div
      class="d-flex align-center"
      :class="[!isMobile ? 'gap-icon-web' : 'gap-icon-mobile']"
    >
      <MessagesComponent />

      <!-- <NotificationIcon :class="colorIcons" :active="existMessages" /> -->
      <NotificationComponent />
      <!-- ---------------------------------------------- -->
      <v-menu
        v-if="!isMobile"
        anchor="bottom end"
        origin="auto"
        min-width="300"
      >
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            data-test="profile-menu-button"
            aria-label="Abrir menu de perfil"
            class="pa-0 pr-6"
            elevation="0"
            color="transparent"
          >
            <!-- <v-avatar size="35"> -->
            <ProfileIcon style="color: #5043e9" />
            <!-- </v-avatar> -->
          </v-btn>
        </template>

        <v-card min-width="250" elevation="50" class="rounded-xl">
          <v-list class="bg-menu-user text-white font-weight-bold">
            <v-list-item>
              <template #title>
                {{ $t("header.hi") }}
              </template>
              <template #subtitle>
                <h2 class="text-white mt-1">{{ fullname }}</h2>
              </template>
              <template v-slot:append>
                <AdminIcon v-if="userStore.navigationContext() === 'admin'" />
              </template>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-list density="compact" class="ma-0 px-0">
            <v-list-item class="pa-0 ma-0" v-if="userStore.navigationContext() === 'user'">
              <template #title>
                <span class="text-xeler-cop font-weight-bold">
                  {{ xelerCop }}
                </span>
              </template>
              <template #prepend>
                <VAvatar class="pa-0 ma-0">
                  <VIcon :icon="BlueStarkIcon"></VIcon>
                </VAvatar>
              </template>
            </v-list-item>
            <v-list-item
              class="pa-0 ma-0 text-item-menu"
              v-for="(item, i) in userprofile"
              :key="i"
              :value="item"
              @click="clickInProfile(item.to)"
            >
              <template #title>
                {{ item.title }}
              </template>
              <template #prepend>
                <VAvatar class="pa-0 ma-0">
                  <VIcon :icon="item.icon"></VIcon>
                </VAvatar>
              </template>
            </v-list-item>
          </v-list>

          <v-card-actions class="pa-0 ma-0" style="background-color: #dfe3e887">
            <v-list
              color="transparent"
              density="compact"
              class="pa-0 ma-0 w-100"
            >
              <v-list-item
                @click="logout"
                data-test="logout-button"
                :disabled="userStore.logoutLoading"
                class="pa-0 ma-0 text-item-menu"
                :title="$t('header.log-out')"
              >
                <template #prepend>
                  <VAvatar class="pa-0 ma-0">
                    <VIcon :icon="LogOutIcon"></VIcon>
                  </VAvatar>
                </template>
              </v-list-item>
            </v-list>
          </v-card-actions>
        </v-card>
      </v-menu>
      <v-btn
        v-else
        data-test="profile-menu-button"
        aria-label="Abrir menu de perfil"
        class="pa-0 pr-6"
        elevation="0"
        color="transparent"
        @click="clickInProfileMobile"
      >
        <!-- <v-avatar size="35"> -->
        <ProfileIcon style="color: #5043e9" />
        <!-- </v-avatar> -->
      </v-btn>
    </div>
  </div>
</template>
<style lang="scss">
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

.v-list {
  background: transparent;
}
</style>
