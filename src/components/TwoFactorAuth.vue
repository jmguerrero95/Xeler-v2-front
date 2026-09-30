<template>
  <DialogGlobal
    @close-dialog="closeModal"
    class-title="text-center mb-0 text-primary"
    :widthDialog="'500px'"
    footer
    :dialog="twoFactorAuthStore.modal"
  >
    <template #title>
      {{ !with2fa() ? "Confirmar Contraseña" : "Authenticación a dos pasos" }}
    </template>
    <div class="d-flex justify-center">
      <div style="width: 300px">
        <InputComponent
          v-if="twoFactorAuthStore.requirePasswordAndTotp || twoFactorAuthStore.passwordOnly"
          v-model="twoFactorAuthStore.password"
          name="current_password"
          placeholder="Contraseña actual"
          type="password"
        />
        <InputComponent
          v-if="!twoFactorAuthStore.passwordOnly"
          v-model="twoFactorAuthStore.code"
          name=""
          :placeholder="!with2fa() ? 'Contraseña' : 'Código de la aplicación'"
          :type="typeInput"
          :appendIcon="appendIcon"
          @click:append-icon="showPassword = !showPassword"
        >
        </InputComponent>
      </div>
    </div>
    <template #actions>
      <div
        class="paddingBtn d-flex w-100 justify-center justify-sm-space-between flex-wrap gap-2"
      >
        <div class="order-1 order-sm-0">
          <VBtnPrimary variant="outlined" @click="closeModal()">
            {{ $t("buttons.cancel") }}
          </VBtnPrimary>
        </div>
        <div class="order-0 order-sm-1">
          <VBtnPrimary
            variant="elevated"
            @click="twoFactorAuthStore.ejectFunction"
            v-if="!twoFactorAuthStore.newFlow"
          >
            Continuar
          </VBtnPrimary>
          <VBtnPrimary
            variant="elevated"
            @click="twoFactorAuthStore.ejectFunction2"
            v-else
          >
            Continuar
          </VBtnPrimary>
        </div>
      </div>
    </template>
  </DialogGlobal>
</template>

<script setup lang="ts">
import DialogGlobal from "./global/DialogGlobal.vue";
import InputComponent from "./InputComponent.vue";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";
import { ref, computed } from "vue";
const showPassword = ref(false);

const twoFactorAuthStore = TwoFactorAuthStore();
const closeModal = () => {
  twoFactorAuthStore.cancelAction?.();
  twoFactorAuthStore.cancelAction = null;
  twoFactorAuthStore.clearLoginChallenge();
  twoFactorAuthStore.code = "";
  twoFactorAuthStore.password = "";
  twoFactorAuthStore.requirePasswordAndTotp = false;
  twoFactorAuthStore.passwordOnly = false;
  twoFactorAuthStore.financialFlow = true;
  twoFactorAuthStore.modal = false;
};

const with2fa = (): boolean =>
  Boolean(
    twoFactorAuthStore.loginChallengeToken || localStorage.getItem("2fa"),
  );
const appendIcon = computed((): string => {
  if (with2fa()) return "";
  if (showPassword.value) return "mdi-eye-off";
  return "mdi-eye";
});

const typeInput = computed((): string => {
  if (with2fa()) return "text";
  if (showPassword.value) return "text";
  return "password";
});
</script>

<style scoped></style>
