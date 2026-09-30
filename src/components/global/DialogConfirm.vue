<script setup lang="ts">
import DialogBase from '@/components/global/DialogGlobal.vue'
import { toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n()

const props = defineProps({
    dialog: {
        type: Boolean,
        default: false,
    },
    fullscreen: {
        type: Boolean,
        default: false,
    },
    widthDialog: {
        type: String,
        default: "400px",
    },
    title: {
        type: String,
        default: "",
    },
    content: {
        type: String,
        default: "",
    },
    btnCancelText: {
        type: String,
        default: "Cancelar",
    },
    btnAcceptText: {
        type: String,
        default: "Aceptar",
    },
});

const { dialog } = toRefs(props)

const emit = defineEmits([
    "closeDialog",
    "ok"
])

</script>

<template>
    <DialogBase footer :dialog="dialog" :widthDialog="widthDialog" @closeDialog="emit('closeDialog')">
        <template #title>{{ title }}</template>
        <template #content>
            <slot name="content">
                {{ content }}
            </slot>
        </template>
        <template #actions>
            <VRow class="mx-auto text-center justify-space-between d-flex">
                <div>
                    <VBtnSecondary @click="emit('closeDialog')" class="mr-2" style="min-width:100px" >{{ btnCancelText }}</VBtnSecondary>
                </div>
                <div>
                    <VBtnDangerT @click="emit('ok')" min-width="100px"  variant="flat">{{ btnAcceptText }}</VBtnDangerT>
                </div>
            </VRow>
        </template>
    </DialogBase>
</template>