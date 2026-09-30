<template>
    <svg width="30" height="27" viewBox="0 0 30 27" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd"
            d="M6.76794 26.6329C2.90991 26.6329 0 23.4989 0 19.3439V11.785C0 7.62995 2.91003 4.49695 6.76794 4.49695H17.6079C19.4946 4.52064 21.2881 5.32079 22.5659 6.70894C23.8436 8.10725 24.5031 9.96191 24.3949 11.8529V19.3439C24.4889 21.2134 23.829 23.0423 22.5629 24.4209C21.288 25.8063 19.4994 26.6062 17.6168 26.6329L6.76794 26.6329ZM2.29895 11.785V19.3439C2.29895 22.2259 4.177 24.3169 6.76794 24.3169H17.6079C18.8539 24.2956 20.0365 23.7642 20.8799 22.8469C21.7318 21.9129 22.1716 20.6751 22.0999 19.4129V11.785C22.1854 10.5014 21.7458 9.23811 20.8818 8.28495C20.0353 7.36423 18.8473 6.83227 17.5967 6.81394L6.76978 6.81395C4.17798 6.81295 2.29895 8.89995 2.29895 11.785ZM9.93091 16.9849L4.97693 13.0029C4.48071 12.6017 4.39954 11.8758 4.79504 11.3749C4.98474 11.1357 5.26172 10.9819 5.56506 10.9476C5.86829 10.9133 6.17273 11.0012 6.41101 11.1919L11.3569 15.1689C11.6012 15.3629 11.9038 15.4686 12.2158 15.4689C12.532 15.4696 12.8391 15.3639 13.0879 15.1689L17.9799 11.2019C18.1825 11.0356 18.4366 10.9447 18.6989 10.9449C19.0493 10.9442 19.3809 11.1037 19.599 11.3779C19.9968 11.8769 19.9187 12.603 19.424 13.0059L14.5238 16.9819C13.1837 18.0532 11.2815 18.0574 9.93677 16.9919L9.93091 16.9849Z"
            fill="currentColor" />
        <circle v-if="active" cx="22.5332" cy="7.5" r="4" :fill="colorNotification" />
        <circle v-if="active" cx="22.5332" cy="7.5" r="5.5" stroke="#F7F8FA" stroke-width="3" stroke-linejoin="round" />
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