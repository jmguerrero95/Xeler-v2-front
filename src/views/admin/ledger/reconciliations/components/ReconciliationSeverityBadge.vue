<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  severity?: string | null;
}>();

const color = computed(() => {
  const colors: Record<string, string> = {
    low: "info",
    medium: "warning",
    high: "deep-orange",
    critical: "error",
  };

  return colors[props.severity ?? ""] ?? "default";
});
</script>

<template>
  <VChip size="small" :color="color" variant="flat">
    {{ severity || "-" }}
  </VChip>
</template>
