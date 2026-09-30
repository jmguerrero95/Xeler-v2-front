<template>
    <slot name="label">
        <VLabel v-if="!withoutLabel" class="pl-3 text-capitalize font-weight-light text-table" style="">
            {{ withoutLabel ? '' :  name }}
        </VLabel>
    </slot>
    <VResponsive class="v-text-field__slot"
        style="height: auto;"
        >
        <VTextarea
            :id="idElement"
            :rounded="40" 
            variant="filled" 
            :inputmode="inputmode ?? 'text'"
            class="ma-0 pa-0" 
            auto-grow
            rows="1"
            :name="name"
            hide-details 
            single-line
            v-model="mValue" 
            :type="type ?? 'text'"
            :rules="rules" 
            :placeholder="placeholder"
            validate-on="input"
            density="compact"
            :disabled="disabled"
            :active="active??false"
            v-on="events ?? {}"
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
        </VTextarea>
    </VResponsive>
    <div class="w-100 text-center ma-0 pa-0" >
        <VLabel v-if="errors" class="text-error ml-5 font-weight-bold ">
            {{ errors }}
        </VLabel>
    </div>
</template>

<script setup lang="ts">
import { helperStore } from '@/helper';
import { toRefs } from 'vue';
import { computed } from 'vue';
import type { PropsComponents } from '@/interfaces/Components.helper'
const emits = defineEmits<{
    (e:'update:model-value',value:any):void
    (e:'click:append-icon'):void
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
    events?: Object
    height?: any
    idElement?: string
    appendText?: string
    maxHeightField?: string
    inputmode?: string
}>()
const { modelValue:mValue } = toRefs(props)
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


</style>