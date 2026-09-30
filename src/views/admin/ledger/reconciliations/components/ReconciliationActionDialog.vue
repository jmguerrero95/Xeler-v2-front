<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { UserStore } from "@/stores/UserStore";

const props = defineProps<{
  modelValue: boolean;
  action?: "resolve" | "ignore" | "reopen" | null;
  loading?: boolean;
  permission?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "confirm", notes: string): void;
}>();

const notes = ref("");
const userStore = UserStore();

const title = computed(() => {
  if (props.action === "resolve") return "Resolver reconciliación";
  if (props.action === "ignore") return "Ignorar reconciliación";
  return "Reabrir reconciliación";
});

const required = computed(() => props.action === "resolve" || props.action === "ignore");
const canConfirm = computed(() => !props.permission || userStore.hasPermission(props.permission));

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      notes.value = "";
      if (!canConfirm.value) emit("update:modelValue", false);
    }
  },
);

const confirm = () => {
  if (!canConfirm.value) {
    emit("update:modelValue", false);
    return;
  }
  emit("confirm", notes.value.trim());
};
</script>

<template>
  <VDialog :model-value="modelValue" max-width="520" @update:model-value="emit('update:modelValue', $event)">
    <VCard rounded="lg">
      <VCardTitle>{{ title }}</VCardTitle>
      <VCardText>
        <VTextarea
          v-model="notes"
          :label="required ? 'Nota obligatoria' : 'Nota opcional'"
          rows="4"
          variant="outlined"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn variant="text" @click="emit('update:modelValue', false)">Cancelar</VBtn>
        <VBtn color="primary" :loading="loading" :disabled="!canConfirm" @click="confirm">Confirmar</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
