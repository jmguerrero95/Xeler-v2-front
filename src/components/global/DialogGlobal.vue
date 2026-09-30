<script lang="ts" setup>
import { toRefs } from 'vue';

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
        default: "800px",
    },
    footer:{
        type: Boolean,
        default: false,
    },
    classTitle:{
        type: String,
        default: 'mb-0 d-flex justify-space-between text-primary'
    }
});

const { dialog } = toRefs(props)

const emit = defineEmits([
    "closeDialog"
])

const openModal = () => {
    dialog.value = true
}
const closeModal = () => {
    dialog.value = false
}
defineExpose({
    dialog,
    openModal,
    closeModal
})
</script>

<template>
    <div class="text-center" >
        <VDialog 
            v-model="dialog" 
            persistent 
            close-delay="1" 
            open-delay="1" 
            :fullscreen="fullscreen" 
            :width="fullscreen ? '' : widthDialog"
            >
            <div 
                class="w-100 text-right" 
                style="
                    margin-bottom: -15px;
                    z-index: 1;
                ">
                <VBtn 
                    elevation="5"
                    icon="mdi-close" 
                    aria-label="Cerrar"
                    density="comfortable" 
                    @click="emit('closeDialog')" 
                    class="global-modal-close"
                    type="button"
                    style="margin-right: -12px;"
                >
                </VBtn>
            </div>
            <VCard elevation="15" class="global-modal-card pa-3">
                <VCardTitle :class="classTitle" class="">
                    <h3>
                        <slot name="title"></slot>
                    </h3>
                </VCardTitle>
                
                <VCardSubtitle class="text-uppercase">
                    <span >
                        <slot name="subtitle"></slot>
                    </span>
                </VCardSubtitle>

                <VCardText class="mb-0">
                    <slot name="content"></slot>
                    <slot></slot>
                </VCardText>
            
                <VCardActions class="py-8" v-if="footer">
                    <slot name="actions"></slot>
                </VCardActions>
            </VCard>
        </VDialog>
    </div>
</template>
