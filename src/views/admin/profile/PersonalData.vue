<template>
  <VForm ref="formRef" @submit.prevent="valid">
    <VRow>
      <VCol sm="6" xs="12">
        <NewInputComponentVue
          v-model="form.first_name"
          :name="$t('views.profile.personal-data.name')"
          :rules="[validator.required]"
          :disabled="
            statusKyc == KYC_STATUS.IN_VERIFICATION ||
            statusKyc == KYC_STATUS.ACCEPT
          "
        />
      </VCol>
      <VCol sm="6" xs="12">
        <NewInputComponentVue
          v-model="form.second_name"
          :name="$t('views.profile.personal-data.second-name')"
          :disabled="
            statusKyc == KYC_STATUS.IN_VERIFICATION ||
            statusKyc == KYC_STATUS.ACCEPT
          "
        />
      </VCol>
      <VCol sm="6" xs="12">
        <NewInputComponentVue
          v-model="form.last_name"
          :name="$t('views.profile.personal-data.lastname')"
          :rules="[validator.required]"
          :disabled="
            statusKyc == KYC_STATUS.IN_VERIFICATION ||
            statusKyc == KYC_STATUS.ACCEPT
          "
        />
      </VCol>
      <VCol sm="6" xs="12">
        <NewInputComponentVue
          v-model="form.second_last_name"
          :name="$t('views.profile.personal-data.second-lastname')"
          :disabled="
            statusKyc == KYC_STATUS.IN_VERIFICATION ||
            statusKyc == KYC_STATUS.ACCEPT
          "
        />
      </VCol>
      <VCol sm="6" xs="12">
        <div class="d-flex align-center mx-auto">
          <div class="" style="width: 90%">
            <NewInputComponentVue
              v-model="form.email"
              :name="$t('views.profile.personal-data.email')"
              :rules="[validator.required]"
            />
          </div>
          <div class="ml-4 mt-5">
            <VIcon
              size="25"
              :icon="
                !userAuth?.attributes.email_verified_at
                  ? 'mdi-block-helper'
                  : 'mdi-check'
              "
              :color="!userAuth?.attributes.email_verified_at ? 'error' : 'ok'"
            />
          </div>
        </div>
        <ValidationEmail
          :email="form.email"
          @update-email="getUserData"
          :isValidEmail="permitValidateEmail"
        />
      </VCol>
      <VCol sm="6" xs="12">
        <div class="d-flex align-center mx-auto">
          <div class="" style="width: 90%">
            <TelInput
              v-model="phoneFormat"
              @phone="(phone) => (form.phone = phone)"
              @phoneCode="(code) => (form.code_phone = code)"
              :name="$t('views.profile.personal-data.phone')"
              required
              @isValid="(bool) => (isPhoneValid = bool)"
            />
          </div>
          <div class="ml-4 mt-5">
            <VIcon
              size="25"
              :icon="
                permitValidatePhone || !isPhoneValid
                  ? 'mdi-block-helper'
                  : 'mdi-check'
              "
              :color="permitValidatePhone || !isPhoneValid ? 'error' : 'ok'"
            />
          </div>
        </div>
        <ValidationPhone
          :code-phone="form.code_phone"
          :phone="form.phone"
          @update-phone="getUserData"
          :isValidPhone="permitValidatePhone"
        />
      </VCol>
      <VCol sm="6" xs="12">
        <SelectComponentVue
          :items="userStore.typeDocuments"
          v-model="form.type_documents_id"
          :name="$t('views.type_documents.title')"
          itemTitle="attributes.type_document"
          itemValue="id"
          :disabled="
            statusKyc == KYC_STATUS.IN_VERIFICATION ||
            statusKyc == KYC_STATUS.ACCEPT
          "
        />
      </VCol>
      <VCol sm="6" xs="12">
        <NewInputComponentVue
          v-model="form.document"
          :name="$t('views.profile.personal-data.document')"
          :rules="[validator.required]"
          :disabled="
            statusKyc == KYC_STATUS.IN_VERIFICATION ||
            statusKyc == KYC_STATUS.ACCEPT
          "
        />
      </VCol>
      <VCol sm="6" xs="12">
        <NewInputComponentVue
          v-model="form.birth"
          type="date"
          :name="$t('views.profile.personal-data.birthday')"
          :rules="[validator.required]"
          :disabled="
            statusKyc == KYC_STATUS.IN_VERIFICATION ||
            statusKyc == KYC_STATUS.ACCEPT
          "
        />
      </VCol>
      <VCol sm="6" xs="12">
        <SelectComponentVue
          :items="location.nationalities"
          v-model="form.nationality_id"
          :name="$t('views.nationalityi.title')"
          itemTitle="attributes.name"
          itemValue="id"
          :disabled="
            statusKyc == KYC_STATUS.IN_VERIFICATION ||
            statusKyc == KYC_STATUS.ACCEPT
          "
        />
      </VCol>
      <VCol sm="6" xs="12">
        <SelectComponentVue
          :items="location.countries"
          v-model="form.country_id"
          :name="$t('views.countries.title')"
          itemTitle="attributes.name"
          itemValue="id"
          :disabled="
            statusKyc == KYC_STATUS.IN_VERIFICATION ||
            statusKyc == KYC_STATUS.ACCEPT
          "
        />
      </VCol>
      <VCol sm="6" xs="12">
        <SelectComponentVue
          :items="location.departments"
          v-model="form.department_id"
          :name="$t('views.departaments.title')"
          itemTitle="attributes.name"
          itemValue="id"
          :rules="[validator.required]"
          :disabled="
            statusKyc == KYC_STATUS.IN_VERIFICATION ||
            statusKyc == KYC_STATUS.ACCEPT
          "
        />
      </VCol>
      <VCol sm="6" xs="12">
        <SelectComponentVue
          :items="location.municipalities"
          v-model="form.municipalitie_id"
          :name="$t('views.municipalities.title')"
          itemTitle="attributes.name"
          itemValue="id"
          :disabled="
            statusKyc == KYC_STATUS.IN_VERIFICATION ||
            statusKyc == KYC_STATUS.ACCEPT
          "
        />
      </VCol>
      <VCol sm="6" xs="12">
        <NewInputComponentVue
          v-model="form.address"
          :name="$t('views.profile.personal-data.address')"
          :disabled="
            statusKyc == KYC_STATUS.IN_VERIFICATION ||
            statusKyc == KYC_STATUS.ACCEPT
          "
        />
      </VCol>
    </VRow>
  </VForm>
  <VBtnPrimary class="mx-auto mt-3" type="submit" @click.prevent="valid">
    {{ $t("commons.update") }}
  </VBtnPrimary>
</template>

<script setup lang="ts">
import * as validator from "@/validator";
import { helperStore } from "@/helper";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { Profile } from "@/interfaces/User/User.dto";
import { reactive } from "vue";
import { storeToRefs } from "pinia";
import NewInputComponentVue from "@/components/InputComponent.vue";
import SelectComponentVue from "@/components/SelectComponent.vue";
import TelInput from "@/components/TelInput.vue";
import { UserStore } from "@/stores/UserStore";
import ValidationPhone from "./ValidationPhone/ValidationPhone.vue";
import ValidationEmail from "./ValidationEmail/ValidationEmail.vue";
import { KYC_STATUS } from "@/enums/Kyc.enum";
import { computed } from "vue";
const { t } = useI18n();
const valid = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid || !isPhoneValid.value) {
    return;
  }
  updateData();
};
const userStore = UserStore();
const phoneFormat = ref("");
const { userAuth } = storeToRefs(userStore);
userStore.getTypeDocuments();
import { useLocationStore } from "@/stores/LocationStore";

const location = useLocationStore();

const form = reactive<Profile>({
  address: "",
  birth: "",
  code_phone: "",
  country_id: "",
  department_id: "",
  municipalitie_id: "",
  type_documents_id: "",
  email: "",
  document: "",
  first_name: "",
  last_name: "",
  phone: "",
  second_last_name: "",
  second_name: "",
  username: "",
  nationality_id: "",
});

const getUserData = () => {
  userStore.updateUserAuth().then(() => {
    phoneFormat.value =
      "+" +
      userAuth.value?.attributes.code_phone +
      userAuth.value?.attributes.phone;

    form.address =
      userAuth.value?.relationships?.userDetail?.attributes.address ?? "";
    form.birth =
      userAuth.value?.relationships?.userDetail?.attributes.birth ?? "";
    form.code_phone = userAuth.value?.attributes.code_phone ?? "";
    form.country_id =
      userAuth.value?.relationships?.userDetail?.relationships?.country?.id ??
      "";
    form.department_id =
      userAuth.value?.relationships?.userDetail?.relationships?.department?.id ??
      "";
    form.municipalitie_id =
      userAuth.value?.relationships?.userDetail?.relationships?.municipalitie
        ?.id ?? "";
    form.email = userAuth.value?.attributes.email ?? "";
    form.document =
      userAuth.value?.relationships?.userDetail?.attributes.document ?? "";
    form.first_name = userAuth.value?.attributes.first_name ?? "";
    form.last_name = userAuth.value?.attributes.last_name ?? "";
    form.phone = userAuth.value?.attributes.phone ?? "";
    form.second_last_name = userAuth.value?.attributes.second_last_name ?? "";
    form.second_name = userAuth.value?.attributes.second_name ?? "";
    form.username = userAuth.value?.attributes.username ?? "";
    form.type_documents_id =
      userAuth.value?.relationships?.userDetail?.attributes.type_documents_id ??
      "";
    form.nationality_id =
      userAuth.value?.relationships?.userDetail?.attributes.nationality_id ?? "";
  });
};

const helper = helperStore();
const { formRef } = storeToRefs(helper);
const isPhoneValid = ref(false);
const statusKyc = computed((): KYC_STATUS | false => {
  const status =
    userAuth.value?.relationships?.kyc?.attributes?.status ?? false;
  return status;
});
userStore.getTypeDocuments();

getUserData();
const updateData = () => {
  const url = "users/update/profile";
  helper.http(url, "put", { data: form }, t("commons.update-successfull"));
};

const permitValidatePhone = computed((): boolean => {
  if (!userAuth.value?.attributes.phone_verified_at) return true;
  return isPhoneValid.value && userAuth.value?.attributes.phone != form.phone;
});

const permitValidateEmail = computed((): boolean => {
  if (!userAuth.value?.attributes.email_verified_at) return true;
  return userAuth.value?.attributes.email != form.email;
});

onMounted(() => {
  location.fetchCountries();
  location.fetchNationalities();
});

watch(
  () => form.country_id,
  (id) => {
    form.department_id = "";
    form.municipalitie_id = "";
    location.fetchDepartments(String(id));
  }
);

watch(
  () => form.department_id,
  (id) => {
    form.municipalitie_id = "";
    location.fetchMunicipalities(String(id));
  }
);
</script>

<style scoped lang="scss">
/*.v-text-field__slot {
  background: linear-gradient(white, white) padding-box, linear-gradient(180deg, rgba(2,0,36,1) 0%, rgba(80,67,233,1) 0%, rgba(22,180,229,1) 100%) border-box;
  border: 1px solid transparent;
  border-radius: 20px;
  text-align: center;
  color: #5D5FEF;
}*/
</style>
