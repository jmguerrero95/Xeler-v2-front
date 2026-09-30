<script setup lang="ts">
defineOptions({ name: "AppSidebar" });

import { computed, onMounted, ref } from "vue";
import sidebarItems from "./sidebarItem";
import LogoDark from "../logo/LogoDark.vue";
import { useRoute, useRouter } from "vue-router";
import type { StyleValue } from "vue";
import { useDisplay } from "vuetify";
import type {
  SidebarChildren,
  SidebarItem,
} from "@/interfaces/SidebarItems.interface";
import { helperStore } from "@/helper";
import type { CountOrders } from "@/interfaces/Order/Order.model";
import { UserStore } from "@/stores/UserStore";
import type { PERMISSION_ENUM } from "@/enums/Permissions.enum";
import {
  getInternationalAccountAccess,
  isInternationalAccountsMenuAvailable,
} from "@/services/internationalAccountsApi";
const userStore = UserStore();
const { can, canList } = userStore;
const helper = helperStore();
const internationalAccountsAvailable = ref(false);

const loadInternationalAccountsAvailability = async (): Promise<void> => {
  if (
    userStore.navigationContext() !== "user" ||
    !userStore.hasPermission("international-accounts.view-own")
  ) {
    return;
  }

  try {
    const response = await getInternationalAccountAccess();
    internationalAccountsAvailable.value = isInternationalAccountsMenuAvailable(
      response.data.data.feature_enabled,
      userStore.navigationContext(),
      userStore.hasPermission("international-accounts.view-own"),
    );
  } catch {
    internationalAccountsAvailable.value = false;
  }
};

const canAccessByRole = (item: SidebarItem | SidebarChildren): boolean => {
  if (!item.roles || item.roles.length === 0) return true;
  return item.roles.some((role) => userStore.hasRole(String(role)));
};

const canAccessByPermission = (
  item: SidebarItem | SidebarChildren,
): boolean => {
  const permissions = item.permiss ?? [];
  const anyPermissions = item.anyPermissions ?? [];
  if (permissions.length === 0 && anyPermissions.length === 0) return true;

  const canUsePermission = (p: PERMISSION_ENUM): boolean => {
    if (String(p).includes(".")) {
      return userStore.hasPermission(String(p));
    }
    if (item.permiss_reference) {
      return can(p, item.permiss_reference);
    }
    return canList(p);
  };

  const canAll = permissions.every(canUsePermission);
  const canAny =
    anyPermissions.length === 0 || anyPermissions.some(canUsePermission);

  return canAll && canAny;
};

const sidebarMenu = computed(() => {
  const context = userStore.navigationContext();

  return sidebarItems
    .filter((item) => !item.contexts || item.contexts.includes(context))
    .map((item) => ({
      ...item,
      children: item.children?.filter(
        (child) => canAccessByRole(child) && canAccessByPermission(child),
      ),
    }))
    .filter((item) => {
      if (
        item.to === "user-international-accounts" &&
        !internationalAccountsAvailable.value
      )
        return false;
      if (!canAccessByRole(item) || !canAccessByPermission(item)) return false;
      if (item.children && item.children.length === 0) return false;
      return true;
    });
});
onMounted(loadInternationalAccountsAvailability);
// const sidebarMenu = ref<SidebarItem[]>(sidebarItems);
const verifyWidthWindow = ref(useDisplay().mdAndUp);
const router = useRouter();
const route = useRoute();
const isActiveForBorder = (to: string): StyleValue => {
  return {
    // Add a CSS Custom Property
    display: to == router.currentRoute.value.name ? "block" : "none",
  };
};

const isActiveForItem = (to: string): string => {
  return to == router.currentRoute.value.path ? "active-item" : "text-white";
};

const countOrders = ref<CountOrders>({
  cancels: 0,
  done: 0,
  pendings: 0,
  takes: 0,
  total: 0,
});
const getCountOrders = async () => {
  if (!userStore.canList("orders")) return;

  const url = "order/list/contador";
  const res = await helper.http(url);
  countOrders.value = res.data.response as CountOrders;
};

getCountOrders();

const activeSubmenu = (children: SidebarChildren): boolean => {
  if (route.query.type && route.query.type === children.params?.type) {
    return true;
  }
  return false;
};
</script>

<template>
  <div>
    <!-- ---------------------------------------------- -->
    <!---Logo part -->
    <!-- ---------------------------------------------- -->
    <div class="px-10 pt-9 pb-5" v-if="verifyWidthWindow">
      <LogoDark />
    </div>
    <!-- ---------------------------------------------- -->
    <!---Navigation -->
    <!-- ---------------------------------------------- -->
    <div class="scrollnavbar">
      <v-list class="pl-2 pr-0" color="transparent">
        <!-- ---------------------------------------------- -->
        <!---Menu Loop -->
        <!-- ---------------------------------------------- -->
        <template v-for="(item, i) in sidebarMenu" :key="i">
          <!-- ---------------------------------------------- -->
          <div class="d-flex">
            <!---Single Item-->
            <!-- ---------------------------------------------- -->
            <v-list-item
              :to="item.to ? { name: item.to } : '#'"
              :data-test="`sidebar-${item.to}`"
              rounded="lg"
              class="w-100"
              active-class=""
            >
              <!-- <v-list-item-avatar start class="v-list-item-avatar--start"> -->
              <template v-slot:prepend>
                <VAvatar variant="text">
                  <v-icon
                    :icon="item.icon"
                    :class="false ? isActiveForItem(item.to) : 'text-white'"
                  >
                  </v-icon>
                </VAvatar>
              </template>

              <!-- </v-list-item-avatar> -->
              <v-list-item-title>
                {{ item.title }}
              </v-list-item-title>
            </v-list-item>
            <div class="active-bar" :style="isActiveForBorder(item.to)"></div>
          </div>
          <v-list
            v-if="item.children"
            :lines="false"
            density="compact"
            class="ml-7"
          >
            <v-list-item
              v-for="(children, j) in item.children"
              :key="j"
              :data-test="`sidebar-${children.to}-${children.reference ?? j}`"
              :to="
                children.to
                  ? {
                      name: children.to,
                      query: children.params,
                    }
                  : '#'
              "
              :active="activeSubmenu(children)"
            >
              <v-list-item-title>{{ children.title }}</v-list-item-title>
              <template #append>
                <span
                  v-if="
                    countOrders[children.reference as keyof CountOrders] > 0
                  "
                  class="rounded-circle bg-white text-active font-weight-bold d-flex align-center justify-center"
                  style="width: 30px !important; height: 30px !important"
                >
                  {{ countOrders[children.reference as keyof CountOrders] }}
                </span>
              </template>
            </v-list-item>
          </v-list>
        </template>
      </v-list>
    </div>
  </div>
</template>
<style lang="scss">
@use "@/scss/variables.scss" as *;

.active-item {
  color: $item-active-sidebar !important;
}

.hover-black:hover {
  background-color: none;
}

.active-bar {
  width: 6.14px;
  height: auto;
  background-color: $item-active-sidebar;
  margin-left: -6.14px;
  border-radius: 4px 0 0 4px;
}
</style>
