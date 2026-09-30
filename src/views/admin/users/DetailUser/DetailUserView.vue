<template>
    <div>
        <div
            class="text-primary font-22 d-flex justify-sm-space-between flex-column flex-sm-row"
        >
            <div>
                Detalle de:
                <span class="font-weight-light">{{
                    user.attributes.username
                }}</span>
            </div>
            <div v-if="!inModal">
                <VBtn @click="emits('back')">Atrás</VBtn>
            </div>
        </div>

        <div class="border-b-md">
            <v-tabs v-model="menuActive" bg-color="transparent" show-arrows>
                <v-tab
                    v-for="(item, i) in tabs"
                    @click.prevent="clickInTab(i, item)"
                    :value="item.name"
                >
                    <span
                        :class="
                            menuActive == item.name
                                ? 'text-primary'
                                : 'text-tab'
                        "
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
                                    item.children.some(
                                        (ch) => ch.name === submenuActive
                                    )
                                        ? 'primary'
                                        : 'tab'
                                "
                            >
                                {{ item.name }}
                                <v-icon end icon="mdi-menu-down"></v-icon>
                            </v-btn>
                        </template>

                        <v-list class="bg-grey-lighten-3">
                            <v-list-item
                                v-for="(child, j) in item.children"
                                :key="j"
                                @click="
                                    clickInSubMenu(
                                        child.value,
                                        child.name,
                                        item.name
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

        <!-- <v-card-text> -->
        <v-window v-model="tabActive" class="mt-5">
            <Component :inModal="inModal" :key="tabActive" :is="tabActive" :user="user" />
        </v-window>
    </div>
</template>

<script setup lang="ts">
import type { User } from "@/interfaces/User/User.model";
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { helperStore } from '@/helper';
import { storeToRefs } from 'pinia';
import { watch , shallowRef} from 'vue';
import ActivityDetailUser from "./ActivityDetailUser.vue";
import TransactionView from "../../transactions/TransactionView.vue";
import PersonalInformation from "./PersonalInformation.vue";
import AdministrativeOverview from "./AdministrativeOverview.vue";
import UserReferredList from '@/views/user/Refer/UsersReferredList.vue'

const props = defineProps<{
    user: User;
    inModal?: boolean,
}>();
const emits = defineEmits<{
    (e: "back"): void;
}>();

const helper = helperStore()
const tabActive = ref(AdministrativeOverview)
const tabs = shallowRef<ItemTab[]>([
    {
        name: 'Resumen',
        value: AdministrativeOverview,
    },
    {
        name: 'Actividades',
        value: ActivityDetailUser,
    },
    {
        name: 'Transacciones',
        value: TransactionView,
    },
    {
        name: 'Información Personal',
        value: PersonalInformation
    },
    {
        name: 'Referidos',
        value: UserReferredList
    }
])


const submenuActive = ref("");
const menuActive = ref('Resumen');

const clickInSubMenu = (component: any, name: string, parent: string) => {
    submenuActive.value = name;
    tabActive.value = component;
    menuActive.value = parent;
};

const menusOpened = ref(
    tabs.value.filter((item) => item.children).map((item) => false)
);

const clickInTab = (i: number, item: ItemTab) => {
    menusOpened.value[i] = true;
    submenuActive.value = "";
    if (!item.children) {
        tabActive.value = item.value;
        menuActive.value = item.name;
    }
};

interface ItemTab {
    name: string;
    value: any;
    children?: ItemTab[];
}
</script>

<style scoped></style>
