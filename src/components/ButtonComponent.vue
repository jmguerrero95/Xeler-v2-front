<template>
    <!-- <VResponsive class="v-text-field__slot cursor-pointer"> -->
        <VBtn 
            :type="type"
            color="transparent" 
            :icon="appendIcon" 
            :disabled="disabled"
            class="v-text-field__slot"
            style="max-height: 40px;"
            @click="emits('click:append-icon')">
            <slot></slot>
        </VBtn>
    <!-- </VResponsive> -->
</template>

<script setup lang="ts">
const emits = defineEmits<{
    (e: 'click:append-icon'): void
}>()
const props = defineProps<{
    type?: string
    appendIcon?: string
    disabled?: boolean
}>()

</script>

<style scoped>

</style>