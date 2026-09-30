<template>
    <slot name="label">
        <VLabel v-if="!withoutLabel" :for="controlId" class="pl-3 text-capitalize font-weight-light text-table" style="">
            {{ withoutLabel ? '' :  name }}
        </VLabel>
    </slot>
    <VResponsive class="v-text-field__slot"
        :class="{
            disabled
        }"
        :style="{
            height
        }"
        >
        <VTextField 
            :id="controlId"
            :rounded="40" 
            variant="filled" 
            :class="['ma-0', 'pa-0', hideSpinner ? 'hide-spinner' : '']"
            :name="name"
            hide-details
            single-line
            v-model="mValue" 
            :style="{
                'max-height': maxHeightField ?? '40px'
            }" 
            :type="type ?? 'text'"
            :rules="rules" 
            :placeholder="placeholder"
            validate-on="input"
            density="compact"
            :disabled="disabled"
            :active="active??false"
            v-on="events ?? {}"
            autocomplete="autocomplete | on"
            @keypress="emits('keypress', $event)"
            @paste="emits('paste', $event)"
            @update:model-value="emits('update:model-value',$event)"
            bg-color="transparent"
            center-affix
            >
            <template v-if="appendIcon || appendText" #append-inner>
                <VIcon 
                    v-if="appendIcon"
                    color="primary"
                    :icon="appendIcon"
                    @click="emits('click:append-icon')"
                    
                    ></VIcon>
                <span v-if="appendText">{{ appendText }}</span>
            </template>
        </VTextField>
    </VResponsive>
    <div class="w-100 text-center ma-0 pa-0" >
        <VLabel v-if="errors" class="text-error ml-5 font-weight-bold ">
            {{ errors }}
        </VLabel>
    </div>
</template>

<script setup lang="ts">
import { helperStore } from '@/helper';
import { computed, toRefs, useId } from 'vue';
import type { PropsComponents } from '@/interfaces/Components.helper'
const emits = defineEmits<{
    (e:'update:model-value',value:any):void
    (e:'click:append-icon'):void
    (e:'keypress', event: KeyboardEvent): void
    (e:'paste', event: ClipboardEvent): void
}>()
const props = defineProps<{
    modelValue: any,
    placeholder?: string
    rules?: any | any[]
    name: string
    withoutLabel?: boolean
    type?: string
    active?: boolean
    appendIcon?: any
    disabled?: boolean,
    hideSpinner?: boolean,
    events?: Object
    height?: any
    idElement?: string
    appendText?: string
    maxHeightField?: string
    id?: string
    autocomplete?: string
    style?: string | object;
}>()
const { modelValue:mValue } = toRefs(props)
const generatedId = useId()
const controlId = computed(() => props.idElement ?? props.id ?? `input-${generatedId}`)
const helper = helperStore()

const errors = computed(()=>{
    const errors = helper.formRef?.errors as ErrorType[] | null
    if(!errors) return false

    const errorIn =errors.find(err => err.id == props.name)
    if(!errorIn) return false

    return errorIn.errorMessages[0]
})

interface ErrorType{
    id:string
    errorMessages: string[]
}
</script>

<style scoped lang="scss">
:deep(.hide-spinner) input[type="number"]::-webkit-outer-spin-button,
:deep(.hide-spinner) input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
  margin: 0;
}

:deep(.hide-spinner) input[type="number"] {
  -moz-appearance: textfield !important;
}
</style>