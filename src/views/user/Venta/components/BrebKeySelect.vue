<template>
  <div class="mt-4">
    <label class="text-primary font-weight-bold">Llave Bre-B para recibir el pago</label>
    <VSelect
      class="mt-2"
      :model-value="modelValue"
      :items="compatibleKeys"
      item-value="selection_id"
      item-title="label"
      :loading="loading"
      no-data-text="No tienes llaves Bre-B verificadas para este contexto"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <RouterLink :to="{ name: 'user-breb-keys' }" class="text-primary">Administrar llaves Bre-B</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { brebApi, type BrebKey } from "@/services/brebApi";
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps<{ modelValue: number | null; companyId?: number | null }>();
const emit = defineEmits<{ (e: "update:modelValue", value: number | null): void }>();
const keys = ref<BrebKey[]>([]);
const loading = ref(false);
const compatibleKeys = computed(() => keys.value.filter((key) => key.status === "verified" && (
  props.companyId ? key.owner_type === "company" && key.company_id === props.companyId : key.owner_type === "user"
)).map((key) => ({ ...key, label: `${key.is_favorite ? "★ " : ""}${key.masked_value} - ${key.holder_name}` })));

const load = async () => {
  loading.value = true;
  try {
    keys.value = await brebApi.list();
    const favorite = compatibleKeys.value.find((key) => key.is_favorite);
    if (!props.modelValue && favorite) emit("update:modelValue", favorite.selection_id);
  } finally { loading.value = false; }
};

watch(() => props.companyId, () => { emit("update:modelValue", null); load(); });
onMounted(load);
</script>
