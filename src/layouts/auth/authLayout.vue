<script setup lang="ts">
import { RouterView, useRouter } from "vue-router";
import { ref } from "vue";
import { useDisplay } from "vuetify";
import LogoLight from "@/assets/images/logos/logo-ligth.svg";
import FooterComponent from "../full/FooterComponent.vue";
import monitor from "@/assets/images/authLayout/monitos2.svg";
const drawer = ref(true);
const innerW = ref(useDisplay().smAndDown);

const router = useRouter();
const clickInLogo = () => {
  router.push("/home");
};
</script>

<template>
  <v-app>
    <VRow>
      <VCol
        v-if="!innerW"
        cols="8"
        class="bg-sidebar h-100 ma-0 pa-0 d-flex align-center"
      >
        <div class="mx-auto">
          <VImg
            src="/assets/images/XELER_DESKTOP_HOME.png"
            height="603"
            width="603"
          />
        </div>
      </VCol>
      <VCol :cols="innerW ? 12 : 4" class="ma-0 pa-0">
        <v-main class="px-10">
          <v-container fluid class="h-100 w-100">
            <VImg
              @click="clickInLogo"
              class="mb-10 mt-6 cursor-pointer"
              height="74px"
              :src="LogoLight"
            ></VImg>
            <RouterView />
          </v-container>
        </v-main>
        <div class="mb-6">
          <FooterComponent />
        </div>
      </VCol>
    </VRow>
  </v-app>
</template>
<style lang="scss">
@use "@/scss/variables.scss" as *;

.bg-navbar-mobile {
  background-color: $color-primary !important;
}
</style>
