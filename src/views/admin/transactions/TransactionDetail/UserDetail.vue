<template>
    <div class="border-degree px-3 py-2 mt-3" style="font-size:22px;max-width: 421px">
            <div class="text-center text-table">
                <span class="text-primary mr-5">Usuario: </span>
                <span> {{ fullName }}</span>
            </div>
        <div v-if="canSendUserMessages" class="d-flex justify-space-around">
            <div class="d-flex align-center cursor-pointer" 
                @click="openMessageModal(TypeNotification.SMS)"
            >
                <VIcon :icon="MessageBubbleIcon" /> Sms
            </div>
            <div class="d-flex align-center cursor-pointer" 
            >
                <VIcon :icon="SoportIcon" /> Chat
            </div>
            <div class="d-flex align-center cursor-pointer" 
                @click="openMessageModal(TypeNotification.EMAIL)"
            >
                <VIcon :icon="MessageIcon" /> Mensaje
            </div>
        </div>
    </div>
    <dialog-global 
        :dialog="modal"
        @close-dialog="modal = false"
        width-dialog="400"
        class-title="text-center text-primary"
    >
        <template #title>
            Usuario: {{ order?.relationships?.user.attributes.username }}
        </template>
        <div>
            <div class="font-weight-bold text-table">
                Enviar {{ formNotification.type }}
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
                <VBtnPrimary :disabled="!canSendUserMessages || !formNotification.message" @click="sendNotification">
                    Enviar
                </VBtnPrimary>
            </div>
        </div>
    </dialog-global>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import MessageBubbleIcon from "@/assets/icons/MessageBubbleIcon.vue";
import MessageIcon from "@/assets/icons/MessageIcon.vue";
import SoportIcon from "@/assets/icons/SoportIcon.vue";
import { TransactionStore } from "@/stores/TransactionStore";
import HuellaIcon from "@/assets/icons/HuellaIcon.vue";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import { getFullName, helperStore } from "@/helper";
import { computed, watch } from "vue";
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import { ref } from "vue";
import { reactive } from "vue";
import type { SendNotification } from '@/interfaces/User/User.model'
import { TypeNotification } from '@/interfaces/User/User.model'
import { UserStore } from "@/stores/UserStore";

const helper = helperStore()
const userStore = UserStore()
const canSendUserMessages = computed(() => userStore.hasPermission("users.updated"))
const modal = ref(false)
const formNotification = reactive<SendNotification>({
    message: '',
    type: TypeNotification.ALL
})
const transactionStore = TransactionStore();
const { order } = storeToRefs(transactionStore);

const fullName = computed(() => !order.value ? '': getFullName(order.value?.relationships?.user!))

const openMessageModal = (type: TypeNotification) => {
    if (!canSendUserMessages.value) {
        helper.showNotify("No tienes permiso para enviar mensajes a usuarios", { type: "error" })
        return
    }
    formNotification.type = type
    formNotification.message = ''
    modal.value = true
}

const sendNotification = async () => {
    try{
        if (!canSendUserMessages.value) {
            helper.showNotify("No tienes permiso para enviar mensajes a usuarios", { type: "error" })
            modal.value = false
            return
        }
        const user = order.value?.relationships?.user.id
        const url = 'users/send/message/' + user
        const data = formNotification
        await helper.http(url,'post', {data},'Se ha enviado la notifiación')
        modal.value = false
    }catch(e){

    }
}

watch(modal, (isOpen) => {
    if (isOpen && !canSendUserMessages.value) {
        helper.showNotify("No tienes permiso para enviar mensajes a usuarios", { type: "error" })
        modal.value = false
    }
})
</script>

<style scoped lang="scss">
</style>
