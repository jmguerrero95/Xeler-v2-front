<template>
    <div
        v-if="verifyCompatibilityShareInNav()"
        @click="shareInNav(contentShare)"
        class="cursor-pointer"
    >
        <VIcon title="Compartir" color="primary" :icon="ShareIcon" />
    </div>
</template>

<script setup lang="ts">
import ShareIcon from "@/assets/icons/ShareIcon.vue";
import { verifyCompatibilityShareInNav, shareInNav } from "@/helper";

const props = defineProps<Props>()

interface Props {
    contentShare: ShareData
}
</script>

<style scoped></style>
