<template>
    <VResponsive max-width="500px" class="rounded-xl mb-5">
        <v-text-field 
            :loading="helper.loading" 
            density="compact" 
            variant="solo" 
            append-inner-icon="mdi-magnify"
            single-line 
            v-model="modelValue" 
            bg-color="#E1E7EC" 
            hide-details 
            @click:append-inner="onSearch"
            @update:model-value="emits('update:model-value', $event)"
            >
            <template #label>
                <span class="font-weight-bold" style="color: #809FB8;">
                    {{ $t('general-views.search') }}
                </span>
            </template>
        </v-text-field>
    </VResponsive>
</template>

<script setup lang="ts">
import { helperStore } from '@/helper';
import { toRefs } from 'vue';

const helper = helperStore()
const emits = defineEmits(['update:model-value','onSearch'])
const props = defineProps<{
    modelValue: any,
    onSearch?: boolean
}>()
const { modelValue } = toRefs(props)

const onSearch = () => {
    emits('onSearch')
}
</script>

<style scoped></style>