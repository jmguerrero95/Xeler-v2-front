<template>
  <VApp>
    <RouterView />

    <v-overlay
      width="100%"
      height="100%"
      v-model="helper.loading"
      class="overl"
    >
      <div class="w-100 h-100 d-flex justify-center align-center">
        <v-progress-circular indeterminate size="64" />
      </div>
    </v-overlay>

    <div class="build-info-bar">
      <span class="build-info-text">
        v{{ appVersion }} | {{ buildTime }}
      </span>
    </div>

    <TwoFactorAuth />
  </VApp>
</template>

<script setup lang="ts">
import TwoFactorAuth from "./components/TwoFactorAuth.vue";
import { RouterView } from "vue-router";
import { helperStore } from "./helper";
import { UserStore } from "./stores/UserStore";

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

const helper = helperStore();
const userStore = UserStore();

const appVersion = __APP_VERSION__;
const buildTime = __BUILD_TIME__;

userStore.uploadPermiss();
</script>

<style lang="scss">
.v-navigation-drawer__scrim {
  z-index: 1 !important;
}

%scroll-styles {
  overflow-y: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
    scrollbar-color: rgba(var(--v-theme-primary)) !important;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent !important;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(var(--v-theme-primary));
    transition: background-color 0.2s ease-in-out;
    border-radius: 4px;

    &::-webkit-scrollbar-thumb:hover {
      filter: brightness(1.1) !important;
    }
  }
}

.build-info-bar {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 9999;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
  pointer-events: none;
}

.build-info-text {
  display: block;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: 0.2px;
  white-space: nowrap;
}
</style>