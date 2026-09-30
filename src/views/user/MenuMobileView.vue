<template>
  <div v-show="!showDetailLevel">
    <div
      class="bg-white border border-orange d-flex justify-center align-center flex-column ga-3 py-3 rounded-10 container"
    >
      <div>
        <svg
          width="130"
          height="130"
          viewBox="0 0 130 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          :class="`text-auth-level-${levelUser}`"
        >
          <circle cx="65" cy="65" r="65" fill="#F7EEDF" />
          <path
            d="M64.9521 17.1052C38.5142 17.1052 17.1052 38.5621 17.1052 65C17.1052 91.4379 38.5142 112.895 64.9521 112.895C91.4379 112.895 112.895 91.4379 112.895 65C112.895 38.5621 91.4379 17.1052 64.9521 17.1052ZM85.2594 93.7368L65 81.5236L44.7405 93.7368L50.1047 70.6994L32.24 55.2294L55.8042 53.2179L65 31.4736L74.1958 53.17L97.76 55.1815L79.8952 70.6515L85.2594 93.7368Z"
            fill="currentColor"
          />
          <defs>
            <radialGradient
              id="paint0_radial_737_5394"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(65 65) rotate(90) scale(47.8947)"
            >
              <stop stop-color="#D0A32E" />
              <stop offset="1" stop-color="#F9B301" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div
        class="font-weight-bold text-24"
        :class="`text-auth-level-${levelUser}`"
      >
        Nivel {{ levelUser }}
      </div>
      <div v-if="levelUser < 3" class="text-table text-center">
        <div>Quieres subir al siguiente nivel?</div>
        <a
          class="cursor-pointer text-decoration-underline font-weight-bold text-sky"
          @click="showDetailLevel = true"
          >Nivel {{ levelUser + 1 }}</a
        >
      </div>
    </div>
    <div
      class="container rounded-10 bg-white mt-4 border border-orange d-flex justify-center align-center flex-column ga-3 py-3"
    >
      <VList class="w-100 text-primary">
        <VListItem
          v-for="(tab, index) in tabs"
          :key="index"
          density="compact"
          @click="!tab.children ? clickInMenu(tab.nameRoute) : ''"
        >
          <v-expansion-panels v-if="tab.children">
            <v-expansion-panel color="#5043E90A">
              <VExpansionPanelTitle class="text-primary">
                {{ tab.name }}
              </VExpansionPanelTitle>
              <VExpansionPanelText
                class="ml-4 text-primary"
                v-for="(child, index) in tab.children"
                :key="index"
                @click="clickInMenu(child.nameRoute)"
              >
                {{ child.name }}
              </VExpansionPanelText>
            </v-expansion-panel>
          </v-expansion-panels>
          <span class="ml-6" v-else>
            {{ tab.name }}
          </span>
        </VListItem>
        <VListItem density="compact" :disabled="userStore.logoutLoading" @click="logout">
          <span class="ml-6"> Cerrar Sesión </span>
        </VListItem>
      </VList>
    </div>

    <!-- /////////////////////////////////////////// -->
  </div>
  <LevelViewComponent
    @back="showDetailLevel = false"
    v-show="showDetailLevel"
  />
</template>

<script setup lang="ts">
import { getUserAuth } from "@/helper";
import { ref } from "vue";
import { tabs } from "./itemsMenuProfile";
import { useRouter } from "vue-router";
import LevelViewComponent from "./LevelViewComponent.vue";
import { UserStore } from "@/stores/UserStore";

const levelUser = ref(getUserAuth().level_user);
const router = useRouter();
const userStore = UserStore();

const showDetailLevel = ref(false);
const clickInMenu = (to: string) => {
  router.push({ name: to });
};
const logout = async (): Promise<void> => {
  await userStore.logout();
};
</script>

<style scoped>
.container {
  max-width: 300px;
  margin: 0 auto;
}
</style>
