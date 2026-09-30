<template>
    <h2 class="text-table font-weight-bold">{{ $t('views.profile.title') }}</h2>

    <!-- <v-card > -->
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
            <v-window v-model="tabActive">
                <Component :key="tabActive" :is="tabActive" />
            </v-window>
        <!-- </v-card-text> -->
    <!-- </v-card> -->
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { helperStore } from '@/helper';
import { storeToRefs } from 'pinia';
import PersonalData from './PersonalData.vue';
import PasswordTab from '@/views/admin/profile/PasswordTab.vue'
import { watch , shallowRef} from 'vue';

const { t } = useI18n()
const helper = helperStore()
const tabActive = ref(PersonalData)
const tabs = shallowRef<ItemTab[]>([
    {
        name: t('views.profile.personal-data.title'),
        value: PersonalData,
    },
    {
        name: 'Contraseñas',
        value: PasswordTab,
    },
])


const submenuActive = ref("");
const menuActive = ref(t('views.profile.kyc.title'));

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