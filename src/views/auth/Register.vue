<script setup lang="ts" name="RegisterUserComponent">
defineOptions({ name: "RegisterUserView" });
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import InputComponent from "@/components/InputComponent.vue";
import { helperStore } from "@/helper";
import * as validator from "@/validator";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue3-toastify";
import { useI18n } from "vue-i18n";
import { RegisterStore } from "@/stores/RegisterStore";
import TelInput from "@/components/TelInput.vue";
import {
  removeRegistrationTurnstile,
  renderRegistrationTurnstile,
  resetRegistrationTurnstile,
} from "@/services/turnstile";
import type { NormalizedApiError } from "@/services/apiErrors";

const { t } = useI18n();
const helper = helperStore();
const router = useRouter();
const { formRef } = storeToRefs(helper);
const registerStore = RegisterStore();
const { form } = storeToRefs(registerStore);
const isPhoneValid = ref(false);
const phoneFormat = ref("");
const accepTerms = ref(false);
const registrationFieldErrors = ref<Record<string, string[]>>({});
const validationFallback = "Revisa los datos ingresados e inténtalo nuevamente.";
const knownValidationFields = new Set([
  "username",
  "first_name",
  "last_name",
  "email",
  "phone",
  "password",
  "password_confirmation",
]);
const genericValidationMessages = new Set([
  "validation failed.",
  "error validation",
]);
const antiBotMessage = "No fue posible validar la protección anti-bot. Inténtalo nuevamente.";
const turnstileContainer = ref<HTMLElement | null>(null);
const turnstileWidgetId = ref<string | null>(null);
const turnstileToken = ref("");

const fieldError = (field: string): string =>
  registrationFieldErrors.value[field]?.[0] ?? "";

const specificValidationMessages = computed(() =>
  Object.values(registrationFieldErrors.value)
    .flat()
    .filter((message) => !genericValidationMessages.has(message.trim().toLowerCase())),
);

const hasFieldError = (field: string): boolean => knownValidationFields.has(field) && !!fieldError(field);
const removeSpace = (event: KeyboardEvent) => {
  if (event.key == " ") {
    event.preventDefault();
  }
};

const route = useRoute();
const { email } = route.query;
if (email) {
  form.value.email = email as string;
}
const showPassword = ref(false);
const showPasswordConfirmation = ref(false);

const resetTurnstile = () => {
  turnstileToken.value = "";
  resetRegistrationTurnstile(turnstileWidgetId.value);
};

onMounted(async () => {
  if (!turnstileContainer.value) return;

  try {
    turnstileWidgetId.value = await renderRegistrationTurnstile(
      turnstileContainer.value,
      (token) => (turnstileToken.value = token),
      () => (turnstileToken.value = ""),
    );
  } catch {
    toast.error(antiBotMessage);
  }
});

onBeforeUnmount(() => removeRegistrationTurnstile(turnstileWidgetId.value));

const completeRegister = async () => {
  form.value.referred_by = route.query.ref as string;
  const data = {
    ...form.value,
    "cf-turnstile-response": turnstileToken.value,
  };
  await helper.http("register", "post", { data }, "", false, { silent: true });
  registerStore.reset();
  toast.success(t("views.register.success"));
  router.push({ name: "Login" });
};
const SigUp = async () => {
  registrationFieldErrors.value = {};
  if (!formRef.value) return;
  if (!isPhoneValid.value || !form.value.phone || !form.value.code_phone) {
    toast.error("Ingresa un número de teléfono válido.");
    return;
  }
  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }
  if (!turnstileToken.value) {
    toast.error(antiBotMessage);
    return;
  }

  try {
    await completeRegister();
  } catch (error) {
    const normalized = error as NormalizedApiError;
    if (normalized.status === 422) {
      registrationFieldErrors.value = normalized.validationErrors ?? {};
      const message = specificValidationMessages.value[0] ?? validationFallback;
      toast.error(message);
      return;
    }

    toast.error(normalized.messages?.[0] ?? "No fue posible completar el registro.");
  } finally {
    resetTurnstile();
  }
};

const eventOnlyLetter = {
  keypress: validator.keyPressOnlyLettersAndSpace,
};
</script>

<template>
  <v-toolbar color="transparent" class="text-center">
    <v-toolbar-title class="font-weight-light text-primary">
      {{ $t("views.register.title") }}
    </v-toolbar-title>
  </v-toolbar>
  <div class="">
    <VForm
      ref="formRef"
      class="mx-3"
      style="min-height: 212px"
      @submit.prevent="() => {}"
    >
      <template #default="{ isValid }">
        <VRow>
          <VCol cols="12">
            <InputComponent
              :placeholder="$t('views.users.username')"
              withoutLabel
              :name="$t('views.users.username')"
              v-model="form.username"
              :rules="[validator.required]"
              :events="{ keypress: removeSpace }"
            />
            <p v-if="hasFieldError('username')" class="registration-field-error" data-test="registration-error-username">
              {{ fieldError("username") }}
            </p>
          </VCol>
          <VCol cols="12">
            <InputComponent
              :events="eventOnlyLetter"
              :placeholder="$t('views.users.first_name')"
              withoutLabel
              :name="$t('views.users.first_name')"
              v-model="form.first_name"
              :rules="[validator.required]"
            />
            <p v-if="hasFieldError('first_name')" class="registration-field-error" data-test="registration-error-first-name">
              {{ fieldError("first_name") }}
            </p>
          </VCol>
          <VCol cols="12">
            <InputComponent
              :events="eventOnlyLetter"
              :placeholder="$t('views.users.last_name')"
              withoutLabel
              :name="$t('views.users.last_name')"
              v-model="form.last_name"
              :rules="[validator.required]"
            />
            <p v-if="hasFieldError('last_name')" class="registration-field-error" data-test="registration-error-last-name">
              {{ fieldError("last_name") }}
            </p>
          </VCol>
          <VCol cols="12">
            <InputComponent
              :placeholder="$t('views.users.email')"
              withoutLabel
              :name="$t('views.users.email')"
              v-model="form.email"
              :rules="[validator.required, validator.email]"
            />
            <p v-if="hasFieldError('email')" class="registration-field-error" data-test="registration-error-email">
              {{ fieldError("email") }}
            </p>
          </VCol>
          <VCol cols="12">
            <TelInput
              v-model="phoneFormat"
              @phone="(phone) => (form.phone = phone)"
              @phoneCode="(code) => (form.code_phone = code)"
              :name="$t('views.profile.personal-data.phone')"
              required
              @isValid="(bool) => (isPhoneValid = bool)"
              :placeholder="$t('views.profile.personal-data.phone')"
              without-label
            />
            <p v-if="hasFieldError('phone')" class="registration-field-error" data-test="registration-error-phone">
              {{ fieldError("phone") }}
            </p>
          </VCol>
          <VCol cols="12">
            <InputComponent
              :name="$t('views.users.password')"
              withoutLabel
              :placeholder="$t('views.users.password')"
              v-model="form.password"
              :rules="[validator.required, validator.password]"
              :type="!showPassword ? 'password' : 'text'"
              :appendIcon="!showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-icon="showPassword = !showPassword"
            />
            <p v-if="hasFieldError('password')" class="registration-field-error" data-test="registration-error-password">
              {{ fieldError("password") }}
            </p>
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
          <VCol cols="12">
            <InputComponent
              withoutLabel
              :placeholder="$t('views.users.password-confirmation')"
              :name="$t('views.users.password-confirmation')"
              v-model="form.password_confirmation"
              :rules="[
                validator.required,
                validator.password,
                validator.confirmPassword(
                  form.password_confirmation,
                  form.password,
                ),
              ]"
              :type="!showPasswordConfirmation ? 'password' : 'text'"
              :appendIcon="
                !showPasswordConfirmation ? 'mdi-eye' : 'mdi-eye-off'
              "
              @click:append-icon="
                showPasswordConfirmation = !showPasswordConfirmation
              "
            />
            <p v-if="hasFieldError('password_confirmation')" class="registration-field-error" data-test="registration-error-password-confirmation">
              {{ fieldError("password_confirmation") }}
            </p>
          </VCol>
        </VRow>
        <VCheckbox v-model="accepTerms">
          <template #label>
            <div
              v-html="$t('views.register.accept-terms-and-conditions')"
            ></div>
          </template>
        </VCheckbox>
        <div ref="turnstileContainer" class="d-flex justify-center mb-3" data-test="registration-turnstile"></div>
        <VAlert
          v-if="specificValidationMessages.length"
          type="error"
          variant="tonal"
          class="mb-3"
          data-test="registration-validation-summary"
        >
          <ul class="pl-5">
            <li v-for="message in specificValidationMessages" :key="message">{{ message }}</li>
          </ul>
        </VAlert>
        <div class="text-center mt-1">
          <VBtnPrimary @click="SigUp" :disabled="!accepTerms || !isValid || !isPhoneValid || !turnstileToken">
            {{ $t("views.register.button") }}
          </VBtnPrimary>
        </div>
      </template>
    </VForm>
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

<style scoped>
.registration-field-error {
  color: rgb(var(--v-theme-error));
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0.35rem 0 0;
}
</style>
