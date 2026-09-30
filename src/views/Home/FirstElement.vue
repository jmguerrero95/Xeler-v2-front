<template>
    <VRow class="d-flex align-center">
        <VCol class="">
            <VImg class="mx-auto" :src="FirstImage" width="573px" height="369px" />
        </VCol>
        <VCol 
            class="text-primary font-weight-light text-h5 text-sm-h4 text-lg-h3 text-wrap text-sm-title-small text-md-headline-small text-lg-display-small"
            :class="[isMobile ? 'text-center':'']">
            <!-- <div class="text-primary font-weight-bold text-h1" > -->
            Xeler go es la plataforma más rápida y eficiente para comprar y vender <br> <VueTyper v-bind="propVueType"></VueTyper> en Colombia.
            <!-- </div> -->
            
        </VCol>
    </VRow>
    <VRow v-if="!isMobile && !isAutenticated()">
        <VCol cols="6" class="">
            <VRow class="d-flex justify-center mx-16 ">

                <VCol cols="8">
                    <InputComponent placeholder="Email" name="" v-model="email"></InputComponent>
                </VCol>
                <VCol cols="4" class="my-auto pt-6 ">
                    <VBtnPrimary 
                        style="min-height: 40px; min-width: 128px;" 
                        class=""
                        @click="goRegister"
                        >
                        Registrate
                    </VBtnPrimary>
                </VCol>
            </VRow>
        </VCol>
    </VRow>
</template>

<script setup lang="ts">
import FirstImage from '@/assets/images/home/FirstImage.png'
import InputComponent from '@/components/InputComponent.vue';
import { isAutenticated } from '@/helper';
import { ref } from 'vue'
import { useRouter } from 'vue-router';
import { useDisplay } from 'vuetify'
// import {VueTyper} from 'vue3-typer'
// import "vue3-typer/dist/vue-typer.css"

const isMobile = ref(useDisplay().smAndDown)
const email = ref('')

const propVueType = {
    'text':["Bitcoin","Ethereum","BitcoinCash","Litecoin","Dash"],
    'repeat':'Infinity',
    'shuffle':'false',
    'initial-action':'typing',
    'pre-type-delay':70,
    'type-delay':70,
    'pre-erase-delay':2000,
    'erase-delay':250,
    'erase-style':'select-all',
    'aret-animation':'blink',
    'erase-on-complete':false,
}
const router = useRouter()

const goRegister = ():void => {
    router.push({ name: 'Register', query: {
        email: email.value
    }})
}
</script>

<style scoped lang="scss">
@use "@/scss/variables.scss" as *;

.vue-typer{
    --char-typed-color: $color-primary;
    --char-selected-color: $color-primary;
    --char-typed-background-color: transparent;
    --char-selected-background-color: #ACCEF7;
}
</style>