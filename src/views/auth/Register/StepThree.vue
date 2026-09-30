<template>
  <VRow>
    <VCol class="text-center h4 font-weight-bold">
      {{ $t("views.register.step-one.general-data") }}
    </VCol>
  </VRow>
  <VRow>
    <InputComponent
      id="email"
      :name="$t('views.register.email')"
      v-model="form.email"
      :rules="[validator.required]"
    />
    <InputComponent
      id="code_phone"
      :name="$t('views.register.code_phone')"
      v-model="form.code_phone"
      :rules="[validator.required]"
    />
    <InputComponent
      id="phone"
      :name="$t('views.register.phone')"
      v-model="form.phone"
      :rules="[]"
    />
  </VRow>
  <VRow>
    <InputComponent
      id="birth"
      :name="$t('views.register.birth')"
      type="date"
      v-model="form.birth"
      :rules="[validator.required]"
    />
    <VCol cols="8"></VCol>
  </VRow>
</template>

<script setup lang="ts">
import InputComponent from "@/components/InputComponent.vue";
import * as validator from "@/validator";
import { storeToRefs } from "pinia";
import { RegisterStore } from "@/stores/RegisterStore";

const registerStore = RegisterStore();
const { form } = storeToRefs(registerStore);
</script>
