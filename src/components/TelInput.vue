<template>
  <VLabel class="pl-3 text-capitalize font-weight-light text-table">{{
    !withoutLabel ? name : ""
  }}</VLabel>
  <vue-tel-input
    v-model="modelValue"
    :autoDefaultCountry="false"
    defaultCountry="co"
    styleClasses="v-text-field__slot"
    style="min-height: 40px"
    :inputOptions="{ placeholder, styleClasses: 'text-primary', autocomplete: 'tel', inputmode: 'tel', name: 'phone' }"
    @onInput="updateModel"
    validCharactersOnly
    :disabled="disabled"
  >
  </vue-tel-input>
  <div class="w-100 text-center ma-0 pa-0">
    <VLabel v-if="error" class="tel-input-error text-error font-weight-bold">
      {{ error }}
    </VLabel>
  </div>
</template>

<script setup lang="ts">
import { ref, toRefs } from "vue";
import { VueTelInput } from "vue-tel-input";

const emits = defineEmits<{
  (e: "update:model-value", value: string): void;
  (e: "isValid", bool: boolean): void;
  (e: "phoneCode", code: string): void;
  (e: "phone", phone: string): void;
  (e: "country", value: Country): void;
}>();
const props = defineProps<{
  modelValue: any;
  name?: string;
  rules?: any | any[];
  required?: boolean;
  withoutLabel?: boolean;
  disabled?: boolean;
  placeholder?: string;
}>();
const { modelValue } = toRefs(props);

const error = ref("");

const updateModel = (formatedPhone: string, objectPhone: ObjectPhone) => {
  error.value = "";
  emits("update:model-value", formatedPhone);
  emits("isValid", objectPhone.valid);
  emits("phoneCode", objectPhone.countryCallingCode);
  emits("phone", objectPhone.nationalNumber);
  emits("country", objectPhone.country);

  if (!modelValue.value && props.required) {
    error.value = "El número de teléfono es obligatorio.";
  } else if (!objectPhone.valid && modelValue.value) {
    error.value = "El formato del teléfono no es válido.";
  }
};

interface ObjectPhone {
  countryCallingCode: string;
  nationalNumber: string;
  number: string;
  country: Country;
  countryCode: string;
  valid: boolean;
  formatted: string;
}

interface Country {
  name: string;
  iso2: string;
  dialCode: string;
}
</script>

<style lang="scss">
@use "@/scss/variables.scss" as *;
input.vti__input::placeholder {
  color: $color-primary;
  opacity: 0.4;
}

.v-text-field__slot {
  background: linear-gradient(white, white) padding-box,
    linear-gradient(
        180deg,
        rgba(2, 0, 36, 1) 0%,
        rgba(80, 67, 233, 1) 0%,
        rgba(22, 180, 229, 1) 100%
      )
      border-box;
  border: 1px solid transparent;
  border-radius: 20px;
  text-align: center;
  color: #5d5fef;
}

.tel-input-error {
  display: block;
  height: auto;
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 0 8px;
  white-space: normal;
}
</style>
