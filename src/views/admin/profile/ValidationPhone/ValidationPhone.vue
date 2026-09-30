<template>
  <div class="text-center mt-2">
    <VBtn :disabled="!isValidPhone" @click="openModal">Validar</VBtn>
  </div>
  <DialogGlobalVue :dialog="openDialog" @close-dialog="openDialog = false">
    <template #title>
      {{ $t("views.profile.personal-data.validation-phone.title") }}
    </template>

    <template #content>
      <p v-if="challenges.deliveryStatus !== 'disabled'" class="text-table">
        {{ $t("views.profile.personal-data.validation-phone.content") }}
      </p>
      <VRow>
        <VCol cols="4" class="mx-auto">
          <VSelect
            v-model="channel"
            :items="channelOptions"
            item-title="title"
            item-value="value"
            label="Canal"
          />
        </VCol>
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

const { t } = useI18n();
const emits = defineEmits(["updatePhone"]);
const openDialog = ref(false);
const code = ref("");
const userStore = UserStore();
const helper = helperStore();
const challenges = IdentityChallengeStore();
const channel = ref<"sms" | "whatsapp">("sms");
const channelOptions = [
  { title: "SMS", value: "sms" },
  { title: "WhatsApp", value: "whatsapp" },
];
const { codePhone, phone } = defineProps<{
  codePhone: string;
  phone: string;
  isValidPhone: boolean;
}>();

const openModal = async () => {
  const isEqualsPhone = phone == userStore.userAuth?.attributes.phone;
  openDialog.value = true;
  if (!isEqualsPhone) {
    await updatePhone();
  }
  await sendCode();
};

const updatePhone = (): Promise<boolean> => {
  return new Promise<boolean>(async (resolve, reject) => {
    const url = "users/update/profile";
    const data = {
      code_phone: codePhone,
      phone,
    };
    try {
      await helper.http(url, "put", { data });
      emits("updatePhone");
      resolve(true);
    } catch {
      reject(false);
    }
  });
};

const sendCode = async () => {
  const url = "verification/phone/send";
  const response = await helper.http(url, "post", {
    data: { channel: channel.value },
  });
  challenges.begin(response.data.data);
};

const verificateCode = async () => {
  if (!challenges.reference || challenges.isExpired) {
    return;
  }
  const url = "verification/phone/verify";
  await helper.http(
    url,
    "post",
    {
      data: { challenge_reference: challenges.reference, code: code.value },
    },
    t("views.profile.personal-data.validation-phone.success"),
  );
  emits("updatePhone");
  challenges.clear();
  code.value = "";

  openDialog.value = false;
};
</script>

<style scoped></style>
