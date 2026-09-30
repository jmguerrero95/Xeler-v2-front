<template>
    <div>
        <div class="">
            <div class="w-50" :class="$vuetify.display.xs ? 'mx-auto w-100': ''" style="max-width: 250px;">
                <InputComponent
                    v-model="form.passwordCurrent"
                    name="Contraseña Actual"
                    :appendIcon="!shows.passwordCurrent ? 'mdi-eye' : 'mdi-eye-off'"
                    :type="shows.passwordCurrent ? 'text' : 'password'"
                    @click:append-icon="shows.passwordCurrent = !shows.passwordCurrent"
                />
            </div>
            
            <div class="d-flex  mt-5 flex-column flex-sm-row align-center" style="gap: 30px;">
                <div :class="$vuetify.display.smAndDown ? 'w-100' : 'w-50'" style="max-width: 250px;">
                    <InputComponent
                        v-model="form.newPassword"
                        name="Contraseña Nueva"
                        :type="shows.newPassword ? 'text' : 'password'"
                        :appendIcon="!shows.newPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-icon="shows.newPassword = !shows.newPassword"
                    />
                </div>
                <div :class="$vuetify.display.smAndDown ? 'w-100' : 'w-50'" style="max-width: 250px;">
                    <InputComponent
                        v-model="form.confirmPassword"
                        name="Confirmar Contraseña"
                        :type="shows.confirmPassword ? 'text' : 'password'"
                        :appendIcon="!shows.confirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append-icon="shows.confirmPassword = !shows.confirmPassword"
                    />
                </div>
            </div>
            <span class="text-table">
                La contraseña debe cumplir con:<br>
                <ul class="ml-8">
                    <li>1 mayúscula</li>
                    <li>1 caractér especial (./_*?¿)</li>
                    <li>1 número</li>
                    <li>mínimo 8 dígitos</li>
                </ul>
            </span>
            <div class="mt-5 text-center text-sm-left" :class="$vuetify.display.smAndDown ? 'mx-auto': ''">
                <VBtnPrimary style="width: 115px !important" :disabled="!validPasswordNew" @click="updatePassword">
                    Guardar
                </VBtnPrimary>
            </div>
        </div>
        <VSpacer class="my-16" />
        <TwoFactor/>
    </div>
</template>

<script setup lang="ts">
import InputComponent from "@/components/InputComponent.vue";
import { helperStore } from "@/helper";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";
import TwoFactor from "@/views/admin/profile/PasswordTab/TwoFactor.vue";
import { reactive,computed } from "vue";
import { UserStore } from "@/stores/UserStore";
import { useRouter } from "vue-router";

const helper = helperStore()
const twoFactor = TwoFactorAuthStore()
const userStore = UserStore()
const router = useRouter()

const validPasswordNew = computed(():boolean => {
    if(form.confirmPassword == '' || form.newPassword == '' || form.passwordCurrent == '' ) return false
    if( form.confirmPassword != form.newPassword) return false
    return true
})

const changePassword = async () => {
    try{
        const url = 'users/change/profile/password'
        const data = {
            password: form.newPassword,
            old_password: form.passwordCurrent,
            two_factor_code: twoFactor.code || undefined
            // old_password: form.newPassword
        }
        const res = await helper.http(url,'put',{ data }, 'Contraseña Cambiada con éxito')
        form.passwordCurrent = ''
        form.confirmPassword = ''
        form.newPassword = ''
        userStore.clearAuth()
        await router.push({ name: 'Login' })
    }catch(e){

    }
}

const updatePassword = () => {
    if(localStorage.getItem('2fa')){
        twoFactor.modal = true
        twoFactor.newFlow = true
        twoFactor.requirePasswordAndTotp = false
        twoFactor.financialFlow = false
        twoFactor.callback = {
            fn: changePassword
        }
        // twoFactor.ejectFunction2(changePassword)
        return
    }
    changePassword();
}

const form = reactive<ChangePassword>({
    confirmPassword: "",
    newPassword: "",
    passwordCurrent: "",
});
const shows = reactive<ChangePasswordShow>({
    confirmPassword: false,
    newPassword: false,
    passwordCurrent: false
})
interface ChangePassword {
    passwordCurrent: string;
    newPassword: string;
    confirmPassword: string;
}
interface ChangePasswordShow {
    passwordCurrent: boolean;
    newPassword: boolean;
    confirmPassword: boolean;
}
</script>

<style scoped></style>
