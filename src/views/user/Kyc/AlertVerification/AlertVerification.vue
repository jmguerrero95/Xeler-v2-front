<template>
    <div v-if="statusKyc" class="d-flex mt-8" style="flex-flow:column ; gap:12px">
        <VAlertWarning v-if="statusKyc === KYC_STATUS.IN_VERIFICATION " >
            {{ $t('views.profile.kyc.alert-verification.in-verification') }}
        </VAlertWarning>
        <VAlertError v-if="statusKyc === KYC_STATUS.REJECT " >
            {{ $t('views.profile.kyc.alert-verification.reject') }}
        </VAlertError>
        <VAlertSuccess v-if="statusKyc === KYC_STATUS.ACCEPT " >
            {{ $t('views.profile.kyc.alert-verification.accept') }}
        </VAlertSuccess>
    </div>
</template>

<script setup lang="ts">
import { UserStore } from '@/stores/UserStore'
import { KYC_STATUS } from '@/enums/Kyc.enum'
import { storeToRefs }  from 'pinia'
import { computed } from 'vue'
const userStore = UserStore()
const { userAuth } = storeToRefs(userStore)

const emits = defineEmits<{
    (e: 'existKyc',value: KYC_STATUS | false): void
}>()
const statusKyc = computed((): KYC_STATUS | false =>{
    const status = userAuth.value?.relationships?.kyc?.attributes?.status ?? false
    emits('existKyc', status)
    if(status == KYC_STATUS.ACCEPT){
        localStorage.setItem('kyc','1');
    }
    return status
})
</script>

<style scoped>

</style>