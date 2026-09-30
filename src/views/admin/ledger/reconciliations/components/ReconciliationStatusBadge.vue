<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  status?: string | null;
}>();

const color = computed(() => {
  const colors: Record<string, string> = {
    open: "warning",
    pending: "warning",
    resolved: "success",
    ignored: "grey",
    reopened: "info",
  };

  return colors[props.status ?? ""] ?? "default";
});
</script>

<template>
  <VChip size="small" :color="color" variant="flat">
    {{ status || "-" }}
  </VChip>
</template>
