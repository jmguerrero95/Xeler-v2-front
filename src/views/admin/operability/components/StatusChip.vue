<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  value?: string | boolean | number | null;
}>();

const color = computed(() => {
  const normalized = String(props.value ?? "unknown").toLowerCase();
  return normalized.includes("ready") && !normalized.includes("not")
    ? "success"
    : ["pass", "ok", "healthy", "closed", "true", "ledger"].includes(normalized)
      ? "success"
      : ["warning", "medium", "half_open", "shadow"].includes(normalized)
        ? "warning"
        : ["fail", "failed", "critical", "high", "open", "false", "not_ready"].includes(normalized)
          ? "error"
          : "grey";
});
</script>

<template>
  <VChip :color="color" size="small" variant="tonal">
    {{ value ?? "-" }}
  </VChip>
</template>
