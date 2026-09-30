<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  severity?: string | null;
}>();

const color = computed(() => {
  const normalized = String(props.severity ?? "unknown").toLowerCase();
  return normalized === "critical"
    ? "error"
    : normalized === "high"
      ? "deep-orange"
      : normalized === "medium"
        ? "warning"
        : normalized === "low"
          ? "info"
          : "grey";
});
</script>

<template>
  <VChip :color="color" size="small" variant="tonal">
    {{ severity || "-" }}
  </VChip>
</template>
