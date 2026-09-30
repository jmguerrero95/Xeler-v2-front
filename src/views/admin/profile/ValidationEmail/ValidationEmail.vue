<template>
  <div class="text-center mt-2">
    <VBtn :disabled="!isValidEmail" @click="openModal">Validar</VBtn>
  </div>
  <DialogGlobalVue :dialog="openDialog" @close-dialog="openDialog = false">
    <template #title>
      {{ $t("views.profile.personal-data.validation-email.title") }}
    </template>

    <template #content>
      <p v-if="challenges.deliveryStatus !== 'disabled'" class="text-table">
        {{ $t("views.profile.personal-data.validation-phone.content") }}
      </p>
      <p v-if="flow === 'change' && challenges.reference">Te enviamos un código al nuevo correo.</p>
      <VRow>
        <VCol v-if="flow === 'change'" cols="12" sm="6" class="mx-auto"><NewInputComponentVue v-model="currentPassword" type="password" placeholder="Contraseña actual" name="" /></VCol>
        <VCol v-if="flow === 'change' && hasTwoFactor" cols="12" sm="6" class="mx-auto"><NewInputComponentVue v-model="twoFactorCode" placeholder="Código 2FA" name="" /></VCol>
        <VCol cols="12" class="text-center"><VBtnPrimary v-if="flow === 'change'" :disabled="!currentPassword || (hasTwoFactor && twoFactorCode.length !== 6)" @click.prevent="requestChange">Enviar código</VBtnPrimary></VCol>
        <VCol cols="4" class="mx-auto">
          <NewInputComponentVue
            v-model="code"
            :name="
              $t(
                'views.profile.personal-data.validation-phone.code-verification',
              )
            "
          />
        </VCol>
        <VCol cols="12" class="text-center">
          <VBtnPrimary :disabled="!code || challenges.isExpired" @click.prevent="verificateCode">
            {{ $t("commons.verificate") }}
          </VBtnPrimary>
        </VCol>
        <VCol cols="12">
          <IdentityChallengeResend :on-resend="sendCode" />
        </VCol>
      </VRow>
    </template>
  </DialogGlobalVue>
</template>

<script setup lang="ts">
import DialogGlobalVue from "@/components/global/DialogGlobal.vue";
import NewInputComponentVue from "@/components/InputComponent.vue";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { IdentityChallengeStore } from "@/stores/IdentityChallengeStore";
import IdentityChallengeResend from "@/components/identity/IdentityChallengeResend.vue";
import { apiClient } from "@/services/apiClient";

const { t } = useI18n();
const emits = defineEmits(["updateEmail"]);
const openDialog = ref(false);
const code = ref("");
const flow = ref<"current" | "change">("current");
const targetEmail = ref("");
const currentPassword = ref("");
const twoFactorCode = ref("");
const hasTwoFactor = !!localStorage.getItem("2fa");
const userStore = UserStore();
const helper = helperStore();
const challenges = IdentityChallengeStore();
const { email } = defineProps<{
  email: string;
  isValidEmail: boolean;
}>();

const openModal = async () => {
  targetEmail.value = email;
  flow.value = targetEmail.value === userStore.userAuth?.attributes.email ? "current" : "change";
  challenges.clear();
  code.value = "";
  currentPassword.value = "";
  twoFactorCode.value = "";
  openDialog.value = true;
  if (flow.value === "current") await sendCode();
};

const requestChange = async () => {
  if (flow.value !== "change") return;
  const response = await apiClient.post("identity/email/change", { email: targetEmail.value, current_password: currentPassword.value, two_factor_code: hasTwoFactor ? twoFactorCode.value : undefined });
  challenges.begin((response.data as { data: Parameters<typeof challenges.begin>[0] }).data);
};

const sendCode = async () => {
  if (flow.value === "change") return requestChange();
  const url = "verification/email/send";
  const response = await helper.http(url, "post", {});
  challenges.begin(response.data.data);
};

const verificateCode = async () => {
  if (!challenges.reference || challenges.isExpired) {
    return;
  }
  await apiClient.post(flow.value === "current" ? "verification/email/verify" : "identity/email/change/confirm", { challenge_reference: challenges.reference, code: code.value });
  emits("updateEmail");
  challenges.clear();
  code.value = "";
  openDialog.value = false;
};
</script>

<style scoped></style>
