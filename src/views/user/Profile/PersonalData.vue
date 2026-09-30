<template>
  <VForm ref="formRef" @submit.prevent="valid" class="mb-5">
    <div v-if="showAlerts" class="d-flex flex-column mb-4 gap-3">
      <VAlert type="warning" v-if="!phoneVerified">
        Verificar Teléfono
      </VAlert>
      <VAlert type="warning" v-if="!emailVerified">
        Verificar Correo Electrónico
      </VAlert>
      <VAlert
        v-if="kycStatusMessage"
        :type="kycAlertType"
        variant="tonal"
      >
        {{ kycStatusMessage }}
      </VAlert>
    </div>

    <VRow>
      <VCol sm="6" cols="12">
        <NewInputComponentVue
          v-model="form.first_name"
          :name="$t('views.profile.personal-data.name')"
          :rules="[validator.required]"
          :disabled="isKycLocked"
        />
      </VCol>
      <VCol sm="6" cols="12">
        <NewInputComponentVue
          v-model="form.second_name"
          :name="$t('views.profile.personal-data.second-name')"
          :disabled="isKycLocked"
        />
      </VCol>
      <VCol sm="6" cols="12">
        <NewInputComponentVue
          v-model="form.last_name"
          :name="$t('views.profile.personal-data.lastname')"
          :rules="[validator.required]"
          :disabled="isKycLocked"
        />
      </VCol>
      <VCol sm="6" cols="12">
        <NewInputComponentVue
          v-model="form.second_last_name"
          :name="$t('views.profile.personal-data.second-lastname')"
          :disabled="isKycLocked"
        />
      </VCol>

      <VCol sm="6" cols="12">
        <div class="d-flex align-center gap-2">
          <div class="flex-grow-1">
            <NewInputComponentVue
              v-model="form.email"
              :name="$t('views.profile.personal-data.email')"
              :rules="[validator.required]"
              :disabled="emailVerified"
            />
          </div>
          <VIcon
            size="25"
            :icon="emailVerified ? 'mdi-check-circle' : 'mdi-alert-circle'"
            :color="emailVerified ? 'success' : 'error'"
          />
        </div>
        <ValidationEmail
          v-if="!emailVerified && permitValidateEmail"
          :email="form.email"
          :is-valid-email="validator.email(form.email) === true"
          @update-email="getUserData"
        />
      </VCol>

      <VCol sm="6" cols="12">
        <div class="d-flex align-start gap-2">
          <div class="flex-grow-1">
            <div class="phone-field-group">
              <div class="phone-code-field">
                <NewInputComponentVue
                  v-model="form.code_phone"
                  name="Indicativo"
                  :rules="phoneCodeRules"
                  :disabled="phoneVerified"
                  inputmode="numeric"
                  autocomplete="tel-country-code"
                  @keypress="handlePhoneKeypress"
                />
              </div>
              <div class="phone-number-field">
                <NewInputComponentVue
                  v-model="form.phone"
                  :name="$t('views.profile.personal-data.phone')"
                  :rules="phoneNumberRules"
                  :disabled="phoneVerified"
                  inputmode="numeric"
                  autocomplete="tel-national"
                  @keypress="handlePhoneKeypress"
                />
              </div>
            </div>
          </div>
          <VIcon
            class="phone-status-icon"
            size="25"
            :icon="phoneVerified ? 'mdi-check-circle' : 'mdi-alert-circle'"
            :color="phoneVerified ? 'success' : 'error'"
          />
        </div>
        <ValidationPhone
          v-if="permitValidatePhone"
          :code-phone="form.code_phone"
          :phone="form.phone"
          :is-valid-phone="isPhoneValid"
          @update-phone="getUserData"
        />
      </VCol>

      <VCol sm="6" cols="12">
        <SelectComponentVue
          :items="userStore.typeDocuments"
          v-model="form.type_documents_id"
          :name="$t('views.type_documents.title')"
          itemTitle="attributes.type_document"
          itemValue="id"
          :disabled="isKycLocked"
        />
      </VCol>
      <VCol sm="6" cols="12">
        <NewInputComponentVue
          v-model="form.document"
          :name="$t('views.profile.personal-data.document')"
          :rules="documentRules"
          autocomplete="off"
          :disabled="isKycLocked"
          @keypress="handleDocumentKeypress"
          @paste="handlePasteDocument"
        />
      </VCol>
      <VCol sm="6" cols="12">
        <NewInputComponentVue
          v-model="form.birth"
          type="date"
          :name="$t('views.profile.personal-data.birthday')"
          :rules="[validator.required]"
          :disabled="isKycLocked"
        />
      </VCol>
      <VCol sm="6" cols="12">
        <SelectComponentVue
          :items="location.nationalities"
          v-model="form.nationality_id"
          :name="$t('views.nationalityi.title')"
          itemTitle="attributes.name"
          itemValue="id"
          :disabled="isKycLocked"
        />
      </VCol>

      <VCol sm="6" cols="12">
        <SelectComponentVue
          v-model="form.country_id"
          :items="location.countries"
          itemTitle="attributes.name"
          itemValue="id"
          name="País"
          :disabled="isKycLocked"
        />
      </VCol>
      <VCol sm="6" cols="12">
        <SelectComponentVue
          v-model="form.department_id"
          :items="location.departments"
          itemTitle="attributes.name"
          itemValue="id"
          name="Departamento"
          :disabled="!form.country_id || isKycLocked"
        />
      </VCol>
      <VCol sm="6" cols="12">
        <SelectComponentVue
          v-model="form.municipalitie_id"
          :items="location.municipalities"
          itemTitle="attributes.name"
          itemValue="id"
          name="Municipio"
          :disabled="!form.department_id || isKycLocked"
        />
      </VCol>

      <VCol sm="6" cols="12">
        <NewInputComponentVue
          v-model="form.address"
          :name="$t('views.profile.personal-data.address')"
          :disabled="isKycLocked"
        />
      </VCol>
    </VRow>
  </VForm>
  <VBtnPrimary class="mx-auto mt-5" type="submit" @click.prevent="valid">
    {{ $t("commons.update") }}
  </VBtnPrimary>
</template>

<script setup lang="ts">
import * as validator from "@/validator";
import { getUserAuth, helperStore } from "@/helper";
import { ref, watch, computed, reactive, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import type { Profile } from "@/interfaces/User/User.dto";
import { storeToRefs } from "pinia";
import NewInputComponentVue from "@/components/InputComponent.vue";
import SelectComponentVue from "@/components/SelectComponent.vue";
import { UserStore } from "@/stores/UserStore";
import ValidationPhone from "./ValidationPhone/ValidationPhone.vue";
import ValidationEmail from "./ValidationEmail/ValidationEmail.vue";
import { KYC_STATUS } from "@/enums/Kyc.enum";
import { useLocationStore } from "@/stores/LocationStore";

const location = useLocationStore();
const { t } = useI18n();
const userStore = UserStore();
const { updateUserAuth } = userStore;
const helper = helperStore();
const { formRef } = storeToRefs(helper);
const { userAuth } = storeToRefs(userStore);


const form = reactive<Profile>({
  address: "",
  birth: "",
  code_phone: "",
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
  country_id: "",
  department_id: "",
  municipalitie_id: "",
});

const isKycLocked = computed((): boolean => {
  const status = userAuth.value?.relationships?.kyc?.attributes?.status ?? false;
  return status === KYC_STATUS.IN_VERIFICATION || status === KYC_STATUS.ACCEPT;
});

const emailVerified = computed(() =>
  Boolean(userAuth.value?.attributes.email_verified_at)
);

const phoneVerified = computed(() =>
  Boolean(userAuth.value?.attributes.phone_verified_at)
);

const normalizedCodePhone = computed(() => String(form.code_phone ?? "").replace(/\D+/g, ""));
const normalizedPhone = computed(() => String(form.phone ?? "").replace(/\D+/g, ""));

const hasPhoneValue = computed(() => {
  return Boolean(normalizedCodePhone.value || normalizedPhone.value);
});

const hasPhoneComplete = computed(() => {
  return Boolean(normalizedCodePhone.value && normalizedPhone.value);
});

const isPhoneValid = computed(() => {
  if (!hasPhoneValue.value) return false;

  return (
    normalizedCodePhone.value.length >= 1 &&
    normalizedCodePhone.value.length <= 4 &&
    normalizedPhone.value.length >= 7 &&
    normalizedPhone.value.length <= 15
  );
});

const phoneCodeRules = computed(() => [
  (value: string) => {
    const code = String(value ?? "").replace(/\D+/g, "");
    if (!hasPhoneValue.value) return true;
    if (!code) return "Debe ingresar el indicativo del país";
    if (code.length > 4) return "El indicativo no es válido";
    return true;
  },
]);

const phoneNumberRules = computed(() => [
  (value: string) => {
    const phone = String(value ?? "").replace(/\D+/g, "");
    if (!hasPhoneValue.value) return true;
    if (!phone) return "Debe ingresar el teléfono celular";
    if (phone.length < 7 || phone.length > 15) return "El teléfono celular no es válido";
    return true;
  },
]);

const hasPhoneToVerify = computed(() => {
  return Boolean(hasPhoneComplete.value && isPhoneValid.value);
});

const permitValidatePhone = computed((): boolean => {
  if (!userAuth.value) return false;
  if (!hasPhoneToVerify.value) return false;

  if (!phoneVerified.value) return true;

  return (
    String(userAuth.value?.attributes.code_phone ?? "") !== String(form.code_phone ?? "") ||
    String(userAuth.value?.attributes.phone ?? "") !== String(form.phone ?? "")
  );
});

const permitValidateEmail = computed((): boolean => {
  if (!userAuth.value) return false;
  return !emailVerified.value || userAuth.value?.attributes.email !== form.email;
});

const showAlerts = computed(() =>
  !emailVerified.value || !phoneVerified.value || !!kycStatusMessage.value
);

const initializeForm = () => {
  if (userAuth.value) {
    const userDetail = userAuth.value.relationships?.userDetail;
    form.address = userDetail?.attributes.address ?? "";
    form.birth = userDetail?.attributes.birth ?? "";
    form.code_phone = userAuth.value.attributes.code_phone ?? "";
    form.country_id = userDetail?.relationships?.country?.id ?? "";
    form.department_id = userDetail?.relationships?.department?.id ?? "";
    form.municipalitie_id = userDetail?.relationships?.municipalitie?.id ?? "";
    form.email = userAuth.value.attributes.email ?? "";
    form.document = userDetail?.attributes.document ?? "";
    form.first_name = userAuth.value.attributes.first_name ?? "";
    form.last_name = userAuth.value.attributes.last_name ?? "";
    form.phone = userAuth.value.attributes.phone ?? "";
    form.second_last_name = userAuth.value.attributes.second_last_name ?? "";
    form.second_name = userAuth.value.attributes.second_name ?? "";
    form.username = userAuth.value.attributes.username ?? "";
    form.type_documents_id = userDetail?.attributes.type_documents_id ?? "";
    form.nationality_id = userDetail?.attributes.nationality_id ?? "";

    const user = getUserAuth();
    if (user) {
      user.phone_verified_at = userAuth.value.attributes.phone_verified_at;
      user.email_verified_at = userAuth.value.attributes.email_verified_at;
      localStorage.setItem("user", JSON.stringify(user));
    }
  }
};

const documentRules = computed(() => {
  const rules = [validator.required];

  const selectedType = form.type_documents_id;
  const tipoDocumento = userStore.typeDocuments.find(
    doc => doc.id === selectedType
  )?.attributes?.type_document?.toLowerCase();

  if (tipoDocumento === "cédula") {
    rules.push((v: string) =>
      /^\d+$/.test(v) || "La cédula debe contener solo números"
    );
  } else if (tipoDocumento === "pasaporte") {
    rules.push((v: string) =>
      /^[a-zA-Z0-9]+$/.test(v) || "El pasaporte debe ser alfanumérico sin caracteres especiales"
    );
  }

  return rules;
});

const handleDocumentKeypress = (e: KeyboardEvent) => {
  const selectedType = form.type_documents_id;
  const tipoDocumento = userStore.typeDocuments.find(
    doc => doc.id === selectedType
  )?.attributes?.type_document?.toLowerCase();

  const key = e.key;

  if (tipoDocumento === "cédula") {
    if (!/^\d$/.test(key)) {
      e.preventDefault();
    }
  } else if (tipoDocumento === "pasaporte") {
    if (!/^[a-zA-Z0-9]$/.test(key)) {
      e.preventDefault();
    }
  }
};

const handlePhoneKeypress = (e: KeyboardEvent) => {
  if (["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
    return;
  }

  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
};

const handlePasteDocument = (e: ClipboardEvent) => {
  e.preventDefault();
};

watch(userAuth, () => {
  initializeForm();
}, { immediate: true });

watch(
  () => form.country_id,
  (id) => {
    form.department_id = "";
    form.municipalitie_id = "";
    if (id) {
      location.fetchDepartments(String(id));
    } else {
      location.departments = [];
    }
  }
);

watch(
  () => form.code_phone,
  (value) => {
    const normalized = String(value ?? "").replace(/\D+/g, "");
    if (String(value ?? "") !== normalized) {
      form.code_phone = normalized;
    }
  }
);

watch(
  () => form.phone,
  (value) => {
    const normalized = String(value ?? "").replace(/\D+/g, "");
    if (String(value ?? "") !== normalized) {
      form.phone = normalized;
    }
  }
);

watch(
  () => form.type_documents_id,
  () => {
    form.document = "";
  }
);

watch(
  () => form.department_id,
  (id) => {
    form.municipalitie_id = "";
    if (id) {
      location.fetchMunicipalities(String(id));
    } else {
      location.municipalities = [];
    }
  }
);

const valid = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  if (hasPhoneValue.value && !isPhoneValid.value) {
    return;
  }

  updateData();
};

const getUserData = async () => {
  await updateUserAuth();
};

const updateData = async () => {
  try {
    const url = "users/update/profile";
    await helper.http(url, "put", { data: form }, t("commons.update-successfull"));
    await getUserData();
  } catch (error) {
    console.error("Error updating profile:", error);
  }
};

onMounted(async () => {
  await Promise.all([
    userStore.updateUserAuth(),
    userStore.getTypeDocuments(),
    location.fetchCountries(),
    location.fetchNationalities(),
  ]);

  if (form.country_id) {
    await location.fetchDepartments(String(form.country_id));
    if (form.department_id) {
      await location.fetchMunicipalities(String(form.department_id));
    }
  }
});

watch(
  () => form.country_id,
  async (id) => {
    form.department_id = "";
    form.municipalitie_id = "";
    if (id) {
      await location.fetchDepartments(String(id));
    } else {
      location.departments = [];
    }
  }
);

watch(
  () => form.department_id,
  async (id) => {
    form.municipalitie_id = "";
    if (id) {
      await location.fetchMunicipalities(String(id));
    } else {
      location.municipalities = [];
    }
  }
);

const kycStatus = computed(() => userAuth.value?.relationships?.kyc?.attributes?.status);
const kycStatusMessage = ref<string | null>(null);
const kycAlertType = ref<"info" | "warning" | "success" | "error">("info");

watch(kycStatus, (newStatus) => {
  switch (newStatus) {
    case KYC_STATUS.IN_VERIFICATION:
      kycStatusMessage.value = "KYC en verificación";
      kycAlertType.value = "info";
      break;
    case KYC_STATUS.ACCEPT:
      kycStatusMessage.value = "KYC aceptado";
      kycAlertType.value = "success";
      break;
    case KYC_STATUS.REJECT:
      kycStatusMessage.value = "KYC rechazado";
      kycAlertType.value = "error";
      break;
    default:
      kycStatusMessage.value = null;
      kycAlertType.value = "info";
      break;
  }
}, { immediate: true });
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}

.phone-field-group {
  display: grid;
  grid-template-columns: minmax(110px, 0.35fr) minmax(0, 1fr);
  gap: 12px;
  width: 100%;
}

.phone-status-icon {
  margin-top: 38px;
}

@media (max-width: 600px) {
  .phone-field-group {
    grid-template-columns: 1fr;
  }

  .phone-status-icon {
    margin-top: 38px;
  }
}
</style>
