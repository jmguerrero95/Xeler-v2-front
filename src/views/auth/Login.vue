<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts" name="userLogin">
import { ref } from "vue";
import InputComponent from "@/components/InputComponent.vue";
import { helperStore } from "@/helper";
import * as validator from "@/validator";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";
import { UserStore } from "@/stores/UserStore";
import { handleInitialLoginResponse } from "@/services/loginFlow";
import type { UserAuth } from "@/interfaces/User/User.auth";

const helper = helperStore();
const twoFactorAuthStore = TwoFactorAuthStore();
twoFactorAuthStore.url = "login/f2a";
const userStore = UserStore();
const { permiss } = storeToRefs(userStore);
const router = useRouter();
const { formRef } = storeToRefs(helper);
const form = ref({
  email: "",
  password: "",
});

const showPassword = ref(false);
const submitting = ref(false);
const SigIn = async () => {
  if (submitting.value || !formRef.value) return;
  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }
  submitting.value = true;
  try {
    const res = await helper.http("login", "post", { data: form.value });
    handleInitialLoginResponse(res.data, twoFactorAuthStore, setAllLogin);
  } finally {
    submitting.value = false;
  }
};

const setAllLogin = (data: { user: UserAuth; token: string }) => {
  const { user, token } = data;
  userStore.setAuth(token, user);

  permiss.value = [];
  userStore.uploadPermiss();
  router.push({ name: userStore.defaultAuthenticatedRoute() });
};
</script>

<template>
  <v-toolbar color="transparent" class="text-center">
    <v-toolbar-title class="font-weight-medium text-primary">
      {{ $t("views.login.title") }}
    </v-toolbar-title>
  </v-toolbar>
  <div class="">
    <VForm ref="formRef" @submit.prevent="SigIn">
      <template #default>
        <VRow>
          <VCol cols="12">
            <InputComponent
              id="email"
              without-label
              placeholder="Email"
              name="Email"
              v-model="form.email"
              :rules="[validator.required]"
            />
          </VCol>
          <VCol cols="12">
            <InputComponent
              without-label
              :placeholder="$t('views.users.password')"
              :name="$t('views.users.password')"
              v-model="form.password"
              :rules="[validator.required]"
              :type="!showPassword ? 'password' : 'text'"
              :appendIcon="!showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-icon="showPassword = !showPassword"
            />
          </VCol>
        </VRow>
      </template>
    </VForm>
  </div>
  <div class="text-center mt-6">
    <VBtnPrimary
      type="submit"
      :loading="submitting"
      :disabled="submitting"
      @click="SigIn"
    >
      {{ $t("views.login.button") }}
    </VBtnPrimary>
  </div>
  <VRow>
    <VCol class="text-table text-center mt-3">
      {{ $t("views.login.you-donnot-have-an-account") }}
      <RouterLink
        :to="{ name: 'Register' }"
        class="text-primary font-weight-bold"
        style="text-decoration: none"
      >
        {{ $t("views.login.register") }}
      </RouterLink>
    </VCol>
  </VRow>
  <VRow>
    <VCol class="text-table text-center">
      ¿Olvidaste tu contraseña?<br />
      <RouterLink
        :to="{ name: 'recover-password' }"
        class="text-primary font-weight-bold"
        style="text-decoration: none"
      >
        Recuperar Contraseña
      </RouterLink>
    </VCol>
  </VRow>
</template>
