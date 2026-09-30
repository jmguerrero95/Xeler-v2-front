<template>
    <dialog-global
        :dialog="modal"
        @close-dialog="modal = false"
        width-dialog="400"
        class-title="text-center text-primary"
    >
        <template #title>
            Usuario: {{ user.attributes.username }}
        </template>
        <div>
            <div class="font-weight-bold text-table">
                Enviar {{ type }}
            </div>
            <div>
                <VTextarea
                    variant="plain"
                    class="border-degree pl-2"
                    single-line
                    hide-details
                    v-model="formNotification.message"
                >
                </VTextarea>
            </div>
            <div class="text-center mt-2">
                <VBtnPrimary
                    :disabled="!canSendMessage || !formNotification.message"
                    @click="sendNotification"
                >
                    Enviar
                </VBtnPrimary>
            </div>
        </div>
    </dialog-global>
</template>

<script setup lang="ts">
import DialogGlobal from '@/components/global/DialogGlobal.vue';
import { helperStore } from '@/helper';
import type{ TypeNotification,SendNotification, User } from '@/interfaces/User/User.model';
import { computed, ref,reactive, watch } from 'vue'
import { UserStore } from '@/stores/UserStore';

const emits = defineEmits<{(e:'close-modal'):void}>()
const props = defineProps<{
    user: User,
    type: TypeNotification,
}>()

const helper = helperStore()
const userStore = UserStore()
const canSendMessage = computed(() => props.type === 'sms'
    ? userStore.hasPermission('users.send_sms')
    : props.type === 'email'
      ? userStore.hasPermission('users.send_email')
      : userStore.hasPermission('users.send_sms') && userStore.hasPermission('users.send_email'))
const modal = ref(false)
const formNotification = reactive<SendNotification>({
    message: '',
    type: props.type
})
const sendNotification = async () => {
    try{
        if (!canSendMessage.value) {
            helper.showNotify('No tienes permiso para enviar mensajes a usuarios', { type: 'error' })
            modal.value = false
            emits('close-modal')
            return
        }
        const user = props.user.id
        const url = 'users/send/message/' + user
        const data = formNotification
        await helper.http(url,'post', {data},'Se ha enviado la notifiación')
        modal.value = false
        emits('close-modal')
    }catch(e){

    }
}

watch(modal, (isOpen) => {
    if (isOpen && !canSendMessage.value) {
        helper.showNotify('No tienes permiso para enviar mensajes a usuarios', { type: 'error' })
        modal.value = false
        emits('close-modal')
    }
})

defineExpose({
    modal
})
</script>

<style scoped></style>
