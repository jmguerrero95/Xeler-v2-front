<script setup lang="ts">
import { reactive, watch } from "vue";
import type { OutboxListParams } from "@/services/outboxApi";

const props = defineProps<{
  modelValue: OutboxListParams;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: OutboxListParams): void;
  (event: "apply"): void;
  (event: "reset"): void;
}>();

const localFilters = reactive<OutboxListParams>({ ...props.modelValue });

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
    delete localFilters[key as keyof OutboxListParams];
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
          :items="['pending', 'processing', 'processed', 'failed', 'dead']"
          clearable
          density="compact"
          label="Estado"
          variant="outlined"
        />
      </VCol>
      <VCol cols="12" md="3">
        <VTextField
          v-model="localFilters.event_type"
          density="compact"
          label="Event type"
          variant="outlined"
        />
      </VCol>
      <VCol cols="12" md="3">
        <VTextField
          v-model="localFilters.operation_key"
          density="compact"
          label="Operation key"
          variant="outlined"
        />
      </VCol>
      <VCol cols="12" md="2">
        <VTextField
          v-model="localFilters.aggregate_type"
          density="compact"
          label="Aggregate type"
          variant="outlined"
        />
      </VCol>
      <VCol cols="12" md="2">
        <VTextField
          v-model="localFilters.aggregate_id"
          density="compact"
          label="Aggregate id"
          variant="outlined"
        />
      </VCol>
      <VCol cols="12" md="2">
        <VTextField
          v-model="localFilters.created_from"
          density="compact"
          label="Creado desde"
          type="date"
          variant="outlined"
        />
      </VCol>
      <VCol cols="12" md="2">
        <VTextField
          v-model="localFilters.created_to"
          density="compact"
          label="Creado hasta"
          type="date"
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
