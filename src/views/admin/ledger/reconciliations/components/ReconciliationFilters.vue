<script setup lang="ts">
import { reactive, watch } from "vue";
import type { ReconciliationListParams } from "@/services/reconciliationsApi";

const props = defineProps<{
  modelValue: ReconciliationListParams;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: ReconciliationListParams): void;
  (event: "apply"): void;
  (event: "reset"): void;
}>();

const localFilters = reactive<ReconciliationListParams>({ ...props.modelValue });

watch(
  () => props.modelValue,
  (value) => Object.assign(localFilters, value),
  { deep: true },
);

const apply = () => {
  emit("update:modelValue", { ...localFilters });
  emit("apply");
};

const reset = () => {
  Object.keys(localFilters).forEach((key) => {
    delete localFilters[key as keyof ReconciliationListParams];
  });
  emit("update:modelValue", {});
  emit("reset");
};
</script>

<template>
  <VCard class="pa-4" rounded="lg">
    <VRow dense>
      <VCol cols="12" md="2">
        <VSelect
          v-model="localFilters.status"
          :items="['open', 'resolved', 'ignored']"
          clearable
          density="compact"
          label="Estado"
          variant="outlined"
        />
      </VCol>
      <VCol cols="12" md="2">
        <VSelect
          v-model="localFilters.severity"
          :items="['low', 'medium', 'high', 'critical']"
          clearable
          density="compact"
          label="Severidad"
          variant="outlined"
        />
      </VCol>
      <VCol cols="12" md="2">
        <VTextField
          v-model="localFilters.balance_type"
          density="compact"
          label="Balance type"
          variant="outlined"
        />
      </VCol>
      <VCol cols="12" md="2">
        <VTextField
          v-model="localFilters.entity_type"
          density="compact"
          label="Entity type"
          variant="outlined"
        />
      </VCol>
      <VCol cols="12" md="2">
        <VSelect
          v-model="localFilters.unresolved"
          :items="[
            { title: 'Sí', value: true },
            { title: 'No', value: false },
          ]"
          clearable
          density="compact"
          label="Sin resolver"
          variant="outlined"
        />
      </VCol>
      <VCol cols="12" md="6">
        <VTextField
          v-model="localFilters.operation_key"
          density="compact"
          label="Operation key"
          variant="outlined"
        />
      </VCol>
      <VCol cols="12" md="8" class="d-flex justify-end ga-2">
        <VBtn variant="text" :disabled="loading" @click="reset">Limpiar</VBtn>
        <VBtn color="primary" :loading="loading" @click="apply">Filtrar</VBtn>
      </VCol>
    </VRow>
  </VCard>
</template>
