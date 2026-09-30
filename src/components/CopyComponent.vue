<template>
    <VTooltip
        v-model="tooltip"
        location="top"
        :open-on-focus="false"
        :open-on-hover="false"
    >
        <template #activator="{ props }">
            <VIcon @click="tooltip = true" v-bind="props" color="primary" :icon="icon ?? CopyIcon" size="20" />
        </template>
        <span>¡Copiado!</span>
    </VTooltip>
</template>

<script setup lang="ts">
import CopyIcon from '@/assets/icons/CopyIcon.vue';
import { copyToClipboard } from '@/helper';
import { ref } from "vue";
import { watch } from "vue";

const tooltip = ref(false);
const props = defineProps<Props>();

watch(tooltip, (nuevo, viejo) => {
    if (nuevo === true) {
        copyToClipboard(props.value)
        const intervalToolTip = setInterval(() => {
            tooltip.value = false;
            clearInterval(intervalToolTip);
        }, 3000);
    }
});

//-----------------------
interface Props {
    value: string | number;
    icon?: any;
}
</script>

<style scoped></style>
