<template>
    <v-list-item-title
        v-for="(item, index) in visibleItems" :key="index"
        class="cursor-pointer"
        @click="item.event()"
    >
        <VBtn
            :title="item.title"
            color="transparent"
            size="x-small"
            elevation="0"
            icon
        >
            <VIcon color="primary" size="24" :icon="item.icon" />
        </VBtn>
        {{ item.title }}
    </v-list-item-title>
</template>

<script setup lang="ts">
import type { User } from '@/interfaces/User/User.model'
import ActivityIcon from '@/assets/icons/ActivityIcon.vue'
import ResendIcon from '@/assets/icons/ResendIcon.vue'
import MessageBubbleIcon from '@/assets/icons/MessageBubbleIcon.vue'
import SoportIcon from '@/assets/icons/SoportIcon.vue'
import MessageIcon from '@/assets/icons/MessageIcon.vue'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { UserStore } from '@/stores/UserStore'
const props = defineProps<{
    user: User
}>()

const { t } = useI18n()
const userStore = UserStore()
const emits = defineEmits<{
    (e:'click:activity',value: User):void
    (e:'click:resend-verification', value:User):void
    (e:'click:send-sms', value:User):void
    (e:'click:start-chat', value:User):void
    (e:'click:send-email', value:User):void
}>()

const items:ItemIcon[] = [
    // {
    //     title: t('views.users.activity'),
    //     event: () => emits('click:activity',props.user),
    //     icon: ActivityIcon
    // },
    // {
    //     title: t('views.user.resend-verification'),
    //     event: () => emits('click:resend-verification',props.user),
    //     icon: ResendIcon
    // },
    {
        title: t('views.user.send-sms'),
        event: () => emits('click:send-sms',props.user),
        icon: MessageBubbleIcon,
        permission: 'users.send_sms'
    },
    {
        title: t('views.user.start-chat'),
        event: () => emits('click:start-chat',props.user),
        icon: SoportIcon,
        permission: 'support_chat.initiate',
        customerOnly: true,
    },
    {
        title: t('views.user.send-email'),
        event: () => emits('click:send-email',props.user),
        icon: MessageIcon,
        permission: 'users.send_email'
    },
]

const visibleItems = computed(() =>
    items.filter((item) => (!item.permission || userStore.hasPermission(item.permission))
      && (!item.customerOnly || isCustomer.value))
)

const isCustomer = computed(() => {
    const roles = props.user.relationships?.roles ?? [];
    return roles.length === 0 || roles.every((role) => role.attributes?.name === 'User');
});

interface ItemIcon{
    title: string
    event: Function
    icon: any
    permission?: string
    customerOnly?: boolean
}
</script>

<style scoped></style>
