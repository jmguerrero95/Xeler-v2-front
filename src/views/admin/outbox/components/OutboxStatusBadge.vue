<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  status?: string | null;
}>();

const color = computed(() => {
  const colors: Record<string, string> = {
    pending: "warning",
    processing: "info",
    processed: "success",
    failed: "error",
    dead: "grey",
  };

  return colors[props.status ?? ""] ?? "default";
});
</script>

<template>
  <VChip size="small" :color="color" variant="flat">
    {{ status || "-" }}
  </VChip>
</template>
