<template>
    <div v-if="!kycAccept" class="rounded-xl color-border-degree ">
        <div class="bg-kyc pb-5 rounded-t-xl rounded-b-xl">
            <div class="w-100 text-center py-4">
                <KycIcon/>
            </div>
            <div class="w-100 text-center d-flex  align-center justify-center" style="gap:6px">
                <VIcon :icon="HuellaIcon" size="27" class="text-primary"></VIcon>
                <label
                    class="text-primary font-weight-bold"
                    style="font-size: 22px"
                >
                    {{ $t("menu-right.complete-your-kyc") }}
                </label>
                <VIcon :icon="ArrowIcon" class="text-primary"></VIcon>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import ArrowIcon from "@/assets/icons/layout/MenuRight/ArrowIcon.vue";
import KycIcon from "@/assets/icons/layout/MenuRight/KycIcon.vue";
import HuellaIcon from "@/assets/icons/HuellaIcon.vue";
import { helperStore } from "@/helper";
import { computed } from "vue";
import { KYC_STATUS } from "@/enums/Kyc.enum";
import { UserStore } from "@/stores/UserStore";

const userStore = UserStore()

const kycAccept = computed(():boolean => {
    const kyc = userStore.userAuth?.relationships?.kyc?.attributes?.status == KYC_STATUS.ACCEPT ? '1' : '0'
    if(!localStorage.getItem('kyc')){
        localStorage.setItem('kyc',kyc)
    }else{
        localStorage.removeItem('kyc')
        localStorage.setItem('kyc',kyc)
    }
    return !!localStorage.getItem('kyc')
})

userStore.updateUserAuth()
</script>

<style scoped lang="scss">
@use "@/scss/variables.scss" as *;
.texto {
    background: linear-gradient(180deg, #5043e9 6.77%, #16b4e6 77.6%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.13);
}

.bg-kyc {
    filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
    background: linear-gradient(180deg, #5043e9 0%, #ffffff 80%);
    margin-left: 1px;
    margin-right: 1px;
}
</style>
