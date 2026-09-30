<template>
    <div class="text-table">
        <div class="font-22 d-flex flex-sm-row flex-column align-center">
            <VIcon class="order-1 order-sm-0" color="primary" :icon="SecurityIcon" size="63" inline />
            <div class="order-0 order-sm-1">Autenticación de 2 Factores</div>
        </div>
        <div class="text-justify">
            La autenticación de dos factores es un método para proteger tu
            cuenta web. Cuando está activado, debes ingresar no solo tu
            contraseña, sino también un código especial. Puedes recibir este
            código en la aplicación móvil. Incluso si otra persona encuentra tu
            contraseña, no podra acceder con ese código, esto evita que te
            suplanten o hagan operaciones a nombre tuyo.
        </div>
        <div class="d-flex justify-space-between mt-5 align-center flex-column flex-sm-row" style="gap:40px">
            <div>
                <VBtnPrimary 
                    style="width: 110px !important"
                    @click="enabledOrDisabled"
                    :color="!userStore.userAuth?.attributes.google_authentication ? 'primary' : 'warning'"
                    >
                    
                    {{ !!userStore.userAuth?.attributes.google_authentication ? 'Deshabilitar 2FA' : 'Habilitar 2FA' }}
                </VBtnPrimary>
            </div>
            <div>Estado Actual: 
                <VChip :color="!!userStore.userAuth?.attributes.google_authentication ? 'ok' : 'warning'">
                    {{ !!userStore.userAuth?.attributes.google_authentication ? 'Habilitado' : 'No Habilitado' }}
                </VChip>
            </div>
        </div>
    </div>
    <dialog-global :dialog="modal" @close-dialog="modal = false">
        <template #title>
            <span class="font-weight-light"
                >Habilitar Autenticación 2FA</span
            >
        </template>
        <div class="">
            <div>
                <p>
                    Paso 1: Instala esta app des Google Play Store o App Store
                </p>
                <br />
                <p>
                    Paso 2: Escanea el código QR con Google Auhenticator, o
                    puedes agregar tu cuenta manualmente
                </p>
                <br />
                <p>
                    Agregar Manualmente: <br />
                    Nombre de la cuenta:
                    <span class="text-primary">XelerGo</span> <br />
                    Llave: <span class="text-primary">{{codeString}}</span>
                </p>
            </div>
            <div class="d-flex justify-space-between align-center flex-column flex-sm-row">
                <div class="text-primary">
                    <span class="" v-html="qr"></span>
                </div>
                <div class="text-center">
                    <div>
                        Ingresa el código de authenticator
                        <div
                            class="mx-auto"
                            style="max-width: 150px !important"
                        >
                            <InputComponent
                                v-model="code"
                                name=""
                                without-label
                            >
                            </InputComponent>
                        </div>
                    </div>
                    <div class="mt-3">
                        <VBtnPrimary @click="confirm" :disabled="!code"> Confirmar 2FA </VBtnPrimary>
                    </div>
                </div>
            </div>
        </div>
    </dialog-global>
</template>

<script setup lang="ts">
import SecurityIcon from "@/assets/icons/SecurityIcon.vue";
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import InputComponent from "@/components/InputComponent.vue";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import { ref } from "vue";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";

const twoFactor = TwoFactorAuthStore()
const helper = helperStore();
const userStore = UserStore()
userStore.updateUserAuth()
const modal = ref(false);
const code = ref("");
const qr = ref("");
const openModal = () => {
    modal.value = true;
    getQr();
};
const codeString = ref('')

const getQr = async () => {
    const url = "users/qr/auth";
    const res = await helper.http(url, 'post', { data: { current_password: twoFactor.password } });
    const { data } = res
    qr.value = (data.svg as string).replace(
        'fill="#000000"',
        'fill="currentColor"'
    );
    codeString.value = data.code
    modal.value = true;
};

const enabledOrDisabled = () => {
    twoFactor.password = ''
    twoFactor.code = ''
    twoFactor.passwordOnly = false
    if(userStore.userAuth?.attributes.google_authentication){
        twoFactor.modal = true
        twoFactor.newFlow = true
        twoFactor.requirePasswordAndTotp = true
        twoFactor.financialFlow = false
        twoFactor.callback = {
            fn: unenabledTAF
        }
        // twoFactor.ejectFunction2(changePassword)
        // return
        // unenabledTAF()
        return
    }
    twoFactor.modal = true
    twoFactor.newFlow = true
    twoFactor.requirePasswordAndTotp = false
    twoFactor.passwordOnly = true
    twoFactor.financialFlow = false
    twoFactor.callback = { fn: getQr }
}

const confirm = async () => {
    const url = 'users/validate/code/auth'
    const data = {
        google2fa_secret: code.value
    }
    const res = await helper.http(url,'post', { data });
    code.value = ''
    modal.value = false
    if(localStorage.getItem('2fa')){
        localStorage.removeItem('2fa')
    }
    localStorage.setItem('2fa','1')
    userStore.clearAuth()
    window.location.assign('/login')
}

const unenabledTAF = async () => {
    const url = 'users/disable/auth/code'
    const res = await helper.http(url, 'post', { data: {
        current_password: twoFactor.password,
        two_factor_code: twoFactor.code,
    }})
    if(localStorage.getItem('2fa')){
        localStorage.removeItem('2fa')
    }
    userStore.updateUserAuth()
}
</script>

<style scoped></style>
