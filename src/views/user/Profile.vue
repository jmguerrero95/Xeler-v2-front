<template>
  <h2 class="text-table font-weight-bold">
    {{ $t("views.profile.title") }}
    <span v-if="$vuetify.display.mobile">
      - {{ menuActive }}
      {{ submenuActive ? `- ${submenuActive}` : "" }}
    </span>
  </h2>

  <!-- <v-card > -->
  <div class="border-b-md">
    <v-tabs
      v-if="!$vuetify.display.mobile"
      v-model="menuActive"
      bg-color="transparent"
      show-arrows
    >
      <v-tab
        v-for="(item, i) in tabs"
        :key="item.name"
        @click.prevent="clickInTab(i, item, item.nameRoute)"
        :value="item.name"
      >
        <span
          :class="menuActive == item.name ? 'text-primary' : 'text-tab'"
          v-if="!item.children"
          >{{ item.name }}</span
        >
        <v-menu v-else class="w-100 h-100" v-model="menusOpened[i]">
          <template v-slot:activator="{ props }">
            <v-btn
              variant="plain"
              rounded="0"
              class="align-self-center font-weight-bold w-100 h-100"
              height="100%"
              v-bind="props"
              :color="
                item.children.some((ch) => ch.name === submenuActive)
                  ? 'primary'
                  : 'tab'
              "
            >
              {{ item.name }}
              <v-icon end icon="mdi-menu-down"></v-icon>
            </v-btn>
          </template>

          <v-list class="bg-grey-lighten-3 border-primary rounded-xl">
            <v-list-item
              v-for="(child, j) in item.children"
              :key="j"
              @click="
                clickInSubMenu(
                  child.value,
                  child.name,
                  item.name,
                  child.nameRoute
                )
              "
              :active="submenuActive == child.name"
              color="primary"
            >
              {{ child.name }}
            </v-list-item>
          </v-list>
        </v-menu>
      </v-tab>
    </v-tabs>
  </div>

  <v-card-text>
    <v-window v-model="tabActive">
      <RouterView />
    </v-window>
  </v-card-text>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Component, DefineComponent } from "vue";
import { useI18n } from "vue-i18n";
import PersonalData from "./Profile/PersonalData.vue";
import { useRoute, useRouter } from "vue-router";
import { tabs } from "./itemsMenuProfile";
import type { ItemTab } from "./itemsMenuProfile";

const { t } = useI18n();
const tabActive = ref<Component | DefineComponent>(PersonalData);

const submenuActive = ref("");
const menuActive = ref(t("views.profile.personal-data.title"));
const router = useRouter();

const clickInSubMenu = (
  component: any,
  name: string,
  parent: string,
  to: string
) => {
  submenuActive.value = name;
  tabActive.value = component;
  menuActive.value = parent;
  router.push({ name: to });
};

const menusOpened = ref(
  tabs.value.filter((item) => item.children).map(() => false)
);

const clickInTab = (i: number, item: ItemTab, to: string) => {
  menusOpened.value[i] = true;
  submenuActive.value = "";
  if (!item.children) {
    if (typeof item.value !== "string") {
      tabActive.value = item.value;
    } else {
      console.error(
        "Invalid tab value: Expected a Component, but got a string."
      );
    }
    menuActive.value = item.name;
    router.push({ name: to });
  }
};

const route = useRoute();
const verificatedUrl = (): void => {
  const itemChildren = tabs.value
    .filter((t) => t.children)
    .find((t) => t.children?.find((t) => t.nameRoute == route.name));

  if (itemChildren) {
    const children = itemChildren.children?.find(
      (t): t is ItemTab => t.nameRoute == route.name
    );
    if (children) {
      submenuActive.value = children.name || "";
      menuActive.value = itemChildren.name;
      return;
    }
    submenuActive.value = "";
    menuActive.value = itemChildren.name;
    return;
  }
  const item = tabs.value.find((t) => t.nameRoute == route.name);
  if (item) {
    menuActive.value = item.name;
  } else {
    console.error("No matching tab found for the current route.");
  }
};
verificatedUrl();
</script>
