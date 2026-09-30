<template>
    <svg width="27" height="30" viewBox="0 0 27 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd"
            d="M17.8333 20.5V15.5C17.7728 12.1847 15.0681 9.52861 11.7522 9.5286C8.43628 9.52859 5.73157 12.1846 5.67114 15.5L5.67126 20.5C5.67212 21.203 5.48499 21.8935 5.12927 22.5H18.3762C18.0201 21.8937 17.8326 21.2031 17.8333 20.5ZM21.8872 24.5H1.61719C1.25989 24.5 0.92981 24.3094 0.751221 24C0.57251 23.6906 0.57251 23.3094 0.751221 23C0.92981 22.6906 1.25989 22.5 1.61719 22.5C2.729 22.5072 3.63635 21.6119 3.64404 20.5L3.64417 15.5C3.71472 11.0724 7.3241 7.52014 11.7522 7.52014C16.1803 7.52014 19.7897 11.0724 19.8601 15.5V20.5C19.8678 21.6119 20.7751 22.5071 21.887 22.5C22.2443 22.4999 22.5743 22.6905 22.7531 22.9999C22.9318 23.3092 22.9318 23.6904 22.7532 23.9999C22.5746 24.3093 22.2445 24.4999 21.8872 24.5ZM14.3822 28C13.8302 28.9269 12.8311 29.4948 11.7522 29.4948C10.6733 29.4948 9.67419 28.9269 9.12219 28C8.9425 27.6889 8.9436 27.3053 9.12488 26.9952C9.30615 26.6851 9.63989 26.496 9.99915 26.5H13.5061C13.8651 26.4963 14.1985 26.6855 14.3796 26.9956C14.5607 27.3056 14.5616 27.689 14.3821 28H14.3822Z"
            fill="currentColor" />
        <circle v-if="active" cx="19.5332" cy="7.5" r="4" :fill="colorNotification" />
        <circle v-if="active" cx="19.5332" cy="7.5" r="5.5" stroke="#F7F8FA" stroke-width="3" stroke-linejoin="round" />
    </svg>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { ref } from 'vue'
import { computed } from 'vue';
import { colors } from './IconHeader'
const isMobile = ref(useDisplay().smAndDown);
defineProps({
    active: {
        type: Boolean,
        default: false
    }
})

const colorNotification = computed(()=> {
    return isMobile.value ? colors['icon-act-mob'] : colors['icon-act-web']
})
</script>

<style scoped></style>