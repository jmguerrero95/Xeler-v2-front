<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import InputComponent from "@/components/InputComponent.vue";
import { helperStore } from "@/helper";
import * as validator from "@/validator";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { toast } from "vue3-toastify";
import { IdentityChallengeStore } from "@/stores/IdentityChallengeStore";
import IdentityChallengeResend from "@/components/identity/IdentityChallengeResend.vue";

const form = reactive({
  email: "",
  password: "",
  password_confirmation: "",
  code: "",
});
const dialog = ref(false);
const helper = helperStore();
const router = useRouter();
const { formRef } = storeToRefs(helper);
const showPassword = ref(false);
const challenges = IdentityChallengeStore();
const restoredEmail = challenges.restorePasswordReset();
if (restoredEmail) {
  form.email = restoredEmail;
  dialog.value = true;
}

const emailValid = computed(() => validator.email(form.email) === true);

const sendCodeVerification = async () => {
  const url = "send/reset/password/code";
  const normalizedEmail = form.email.trim().toLowerCase();
  if (!normalizedEmail) return;

  try {
    const response = await helper.http(url, "post", {
      data: { email: normalizedEmail },
    });
    form.email = normalizedEmail;
    challenges.begin(
      {
        ...response.data.data,
        purpose: "password_reset",
        channel: "email",
      },
      true,
      normalizedEmail,
    );
    dialog.value = true;
  } catch (e) {
    console.error(e);
    toast.error("Error al enviar el código de verificación");
  }
};
const changePassword = async () => {
  if (!formRef.value) {
    return;
  }
  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }
  if (!challenges.reference) {
    dialog.value = false;
    return;
  }
  if (challenges.isExpired) {
    toast.error(
      "El codigo expiro. Solicita uno nuevo cuando termine el contador.",
    );
    return;
  }
  try {
    await helper.http("reset/password", "post", {
      data: {
        challenge_reference: challenges.reference,
        code: form.code,
        password: form.password,
        password_confirmation: form.password_confirmation,
      },
    });
    form.password = "";
    form.password_confirmation = "";
    form.code = "";
    challenges.clear();
    toast.success("Cambio Realizado");
    router.push({ name: "Login" });
  } catch {
    if (challenges.isExpired) challenges.clear();
  }
};
</script>

<template>
  <v-toolbar color="transparent" class="text-center">
    <v-toolbar-title class="font-weight-medium text-primary">
      Recuperar Contraseña
    </v-toolbar-title>
  </v-toolbar>
  <div v-show="!dialog" class="">
    <VForm ref="formRef" class="mx-3" @submit.prevent="() => {}">
      <template #default>
        <VRow>
          <VCol cols="12">
            <InputComponent
              id-element="password-reset-email"
              :placeholder="$t('views.users.email')"
              withoutLabel
              :name="$t('views.users.email')"
              v-model="form.email"
              :rules="[validator.required]"
            />
          </VCol>
        </VRow>
      </template>
    </VForm>
    <div class="text-center mt-5">
      <VBtnPrimary
        data-test="password-reset-request"
        @click="sendCodeVerification"
        :disabled="!emailValid"
      >
        Continuar
      </VBtnPrimary>
    </div>
  </div>
  <div v-show="dialog" class="text-table">
    <VRow dense>
      <VCol cols="12" class="text-center">
        <span v-if="challenges.deliveryStatus === 'disabled'">
          El canal no esta disponible temporalmente.
        </span>
        <span v-else> Introduzca el codigo de la solicitud registrada. </span>
      </VCol>
      <VCol cols="12" sm="4" class="mx-auto">
        <InputComponent
          id-element="password-reset-code"
          v-model="form.code"
          name="Codigo de verificacion"
          withoutLabel
        >
        </InputComponent>
      </VCol>
    </VRow>
    <VRow dense>
      <VCol cols="12" class="text-center">
        Introduzca la nueva contraseña.
      </VCol>
      <VCol cols="12" sm="4" class="mx-auto">
        <InputComponent
          id-element="password-reset-password"
          :name="$t('views.users.password')"
          withoutLabel
          :placeholder="$t('views.users.password')"
          v-model="form.password"
          :rules="[validator.required, validator.password]"
          :type="!showPassword ? 'password' : 'text'"
          :appendIcon="!showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-icon="showPassword = !showPassword"
        />
        <InputComponent
          id-element="password-reset-password-confirmation"
          name="Confirmar contrasena"
          withoutLabel
          placeholder="Confirmar contrasena"
          v-model="form.password_confirmation"
          :rules="[validator.required]"
          :type="!showPassword ? 'password' : 'text'"
        />
        <br />
        <span class="text-table">
          La contraseña debe cumplir con:<br />
          <ul class="ml-8">
            <li>1 mayúscula</li>
            <li>1 caractér especial (./_*?¿)</li>
            <li>1 número</li>
            <li>mínimo 8 dígitos</li>
          </ul>
        </span>
      </VCol>
    </VRow>
    <div class="text-center mt-5">
      <VBtnPrimary
        data-test="password-reset-confirm"
        @click="changePassword"
        :disabled="
          !(
            form.code &&
            form.password &&
            form.password_confirmation &&
            challenges.reference &&
            !challenges.isExpired
          )
        "
      >
        Continuar
      </VBtnPrimary>
      <IdentityChallengeResend :on-resend="sendCodeVerification" />
    </div>
  </div>
  <VRow>
    <VCol class="text-center text-table mt-3">
      {{ $t("views.register.you-have-an-account") }}
      <RouterLink
        :to="{ name: 'Login' }"
        class="text-primary font-weight-bold"
        style="text-decoration: none"
      >
        {{ $t("views.register.login") }}
      </RouterLink>
    </VCol>
  </VRow>
</template>
