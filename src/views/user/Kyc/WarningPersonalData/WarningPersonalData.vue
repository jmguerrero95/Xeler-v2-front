<template>
  <div v-if="load" class="d-flex mb-4" style="flex-flow: column; gap: 12px">
    <VAlert v-if="!kycInformation.type_documents_id" type="warning">{{
      $t("views.profile.kyc.warning.failed-type-document")
    }}</VAlert>
    <VAlert v-if="!kycInformation.document" type="warning">{{
      $t("views.profile.kyc.warning.failed-document")
    }}</VAlert>
    <VAlert v-if="!kycInformation.country_id" type="warning">{{
      $t("views.profile.kyc.warning.failed-country")
    }}</VAlert>
    <VAlert v-if="!kycInformation.nationality_id" type="warning">{{
      $t("views.profile.kyc.warning.failed-nationality")
    }}</VAlert>
  </div>
</template>

<script setup lang="ts">
import { UserStore } from "@/stores/UserStore";
import { ref } from "vue";

defineProps<{
  modelValue: boolean;
}>();
const emits = defineEmits<{
  (e: "update:model-value", value: boolean): void;
  (e: "personalData", value: KycUpload): void;
}>();
const userStore = UserStore();
const load = ref(false);
const kycInformation = ref<KycUpload>({
  type_documents_id: "",
  document: "",
  country_id: "",
  nationality_id: "",
});

userStore
  .updateUserAuth()
  .then(() => {
    const user = userStore.userAuth;
    kycInformation.value.type_documents_id =
      user?.relationships?.userDetail.attributes.type_documents_id ?? "";
    kycInformation.value.document =
      user?.relationships?.userDetail.attributes.document ?? "";
    kycInformation.value.country_id =
      user?.relationships?.userDetail.relationships?.country?.id ?? "";
    kycInformation.value.nationality_id =
      user?.relationships?.userDetail.relationships?.nationality?.id ?? "";

    let band = true;
    for (let key in kycInformation.value) {
      if (!kycInformation.value[key as keyof KycUpload]) {
        band = false;
        break;
      }
    }

    emits("update:model-value", band);
    emits("personalData", kycInformation.value);
  })
  .finally(() => (load.value = true));

interface KycUpload {
  type_documents_id: number | "";
  document: string;
  country_id: number | "";
  nationality_id: number | "";
}
</script>
