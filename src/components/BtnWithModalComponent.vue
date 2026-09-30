<template>
    <VBtnDangerT v-if="!onlyModal" v-bind="propsBtn" :color="colorBtn" @click="openModal">
        <slot name="btn">
            {{ textBtn }}
        </slot>
    </VBtnDangerT>
    <DialogGlobal
        v-bind="propsModal"
        :dialog="dialog"
        @close-dialog="closeModal"
        width-dialog="300"
    >
        <template #content>
            <div v-if="icon" class="d-flex justify-center">
                <VIcon size="73" :icon="icon" :color="colorIcon" />
            </div>
            <slot name="titleModal">
                <div
                    class="text-center text-table font-weight-bold"
                    style="font-size: 30px"
                >
                    {{ titleModal }}
                </div>
            </slot>
            <slot name="contentModal">
                <div
                    class="text-center text-table"
                    style="font-size: 16px"
                >
                    {{ textModal }}
                </div>
            </slot>

            <slot name="btnModal" v-if="btnModal">
                <div class="mt-3 text-center">
                    <VBtnPrimary
                        @click="clickBtnModal"
                    >
                        {{btnModal}}
                    </VBtnPrimary>
                </div>
            </slot>
        </template>
    </DialogGlobal>
</template>

<script setup lang="ts">
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import { watch } from "vue";
import { ref } from "vue";

const props = defineProps<{
    colorBtn?: string;
    textBtn?: string;
    icon?: any;
    textModal?: string;
    btnModal?: string;
    onlyModal?: boolean;
    modelValue?: boolean;
    propsModal?: any;
    propsBtn?: any;
    colorIcon?: string;
    titleModal: string;
    subtitleModal?: string;
}>();
const emits = defineEmits<{
    (e: "update:model-value", value: boolean): void;
    (e: "click:btn-modal"): void;
    (e: "open-modal"): void;
    (e: "close-modal"): void;
}>();

const dialog = ref(props.modelValue);
watch(
    () => props.modelValue,
    (nuevo) => {
        dialog.value = nuevo;
    }
);
watch(dialog, (nuevo, viejo) => {
    emits("update:model-value", nuevo);
});
const openModal = () => {
    emits("open-modal");
    dialog.value = true;
};
const closeModal = () => {
    emits("close-modal");
    dialog.value = false;
};
const clickBtnModal = () =>{
    dialog.value = false
    emits('click:btn-modal')
}
</script>

<style scoped></style>
