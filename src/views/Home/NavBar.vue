<template>
    <VAppBar
        class="position-fixed"
        :class="widthWindow < 550 ? 'px-1' : 'px-10'"
        elevation="0"
        :color="currentColor"
        :style="{
            transition: 'background-color 0.3s ease-in-out',
        }"
    >
        <template #prepend>
            <VIcon
                :size="widthWindow < 550 ? '150px' : '200px'"
                :color="isScrolled ? 'white' : 'primary'"
                :icon="LogoLight"
            />
        </template>
        <!-- Contenido de la barra de navegación -->
        <template #append>
            <!-- <LangComponent :class="isScrolled ? 'text-white' : 'text-table'" /> -->
            <div v-if="!userLogged && widthWindow > 550" class="">
                <VBtnPrimary
                    class="font-weight-bold mr-4"
                    :class="[isScrolled ? 'text-white' : 'text-table']"
                    :variant="isScrolled ? 'flat' : 'plain'"
                    @click="router.push({ name: 'Login' })"
                    >{{ $t("views.login.title") }}</VBtnPrimary
                >
                <VBtnPrimary
                    :color="isScrolled ? 'white' : 'primary'"
                    @click="router.push({ name: 'Register' })"
                    >{{ $t("views.register.title") }}</VBtnPrimary
                >
            </div>
            <div v-else>
                <div v-if="widthWindow < 550">
                    <v-menu anchor="bottom end" origin="auto" min-width="300">
                        <template v-slot:activator="{ props }">
                            <v-app-bar-nav-icon
                                variant="text"
                                :color="isScrolled ? 'white' : 'primary'"
                                v-bind="props"
                            ></v-app-bar-nav-icon>
                        </template>
                        <v-card
                            min-width="250"
                            elevation="50"
                            class="rounded-xl"
                        >
                        
                            <v-list density="compact" class="">
                                <v-list-item
                                    class="text-item-menu"
                                    v-for="(item, i) in itemsInMenu"
                                    :key="i"
                                    :value="item"
                                    @click="router.push({ name: item.to })"
                                >
                                    <template #title>
                                        <div class="py-1">
                                            <span class="pl-2">{{ item.title }}</span>
                                        </div>
                                    </template>
                                </v-list-item>
                            </v-list>
                        </v-card>
                    </v-menu>
                </div>
                <VBtnPrimary
                    v-else
                    :color="isScrolled ? 'white' : 'primary'"
                    @click="redirectTo"
                    >{{ $t("views.home.dashboard") }}</VBtnPrimary
                >
            </div>
        </template>
    </VAppBar>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onMounted, onUnmounted } from "vue";
import LogoLight from "./NavBar/LightLogo.vue";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { isAutenticated } from "@/helper";
import { useDisplay } from "vuetify";
import { useI18n } from "vue-i18n";
import { UserStore } from "@/stores/UserStore";

const  { t } = useI18n()
const router = useRouter();
const userStore = UserStore();
const currentColor = ref("transparent");
const drawer = ref(false);
const { width: widthWindow } = useDisplay();

const userLogged = isAutenticated();
const handleScroll = () => {
    const scrollTop = window.scrollY;
    const scrollThreshold = 10; // Umbral de desplazamiento para cambiar el estado

    if (scrollTop > scrollThreshold) {
        currentColor.value = "primary";
    } else {
        currentColor.value = "white";
    }
};

const isScrolled = computed(() => {
    return currentColor.value == "primary";
});

const itemsInMenu = computed(() :itemMenu[] => {
    if (!userLogged) {
        return [
            {
                title: t('views.register.title'),
                to: 'Register'
            },
            {
                title: t('views.login.title'),
                to: 'Login'
            }
        ];
    }
    return [
        {
            title: t('views.home.dashboard'),
            to: 'Dashboard'
        },
    ];
});

const redirectTo = ():void => {
    router.push({ name: userStore.defaultAuthenticatedRoute() })
}

onMounted(() => {
    window.addEventListener("scroll", () => handleScroll());
});
onUnmounted(() => {
    window.removeEventListener("scroll", () => handleScroll());
});

interface itemMenu {
    title: string
    to: string
}
</script>

<style scoped></style>
