<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(defineProps<{
  value: unknown;
  collapsed?: boolean;
  maxHeight?: string;
}>(), {
  collapsed: false,
  maxHeight: "360px",
});

const open = ref(!props.collapsed);
const content = computed(() => {
  if (props.value === undefined || props.value === null || props.value === "") return "{}";
  try {
    return JSON.stringify(props.value, null, 2);
  } catch {
    return String(props.value);
  }
});
</script>

<template>
  <VCard rounded="lg" variant="outlined">
    <VCardTitle class="d-flex align-center justify-space-between py-2">
      <span class="text-body-2 font-weight-bold">JSON</span>
      <VBtn size="small" variant="text" :icon="open ? 'mdi-chevron-up' : 'mdi-chevron-down'" @click="open = !open" />
    </VCardTitle>
    <VExpandTransition>
      <VCardText v-if="open" class="pt-0">
        <pre class="json-viewer" :style="{ maxHeight }">{{ content }}</pre>
      </VCardText>
    </VExpandTransition>
  </VCard>
</template>

<style scoped>
.json-viewer {
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.45;
}
</style>

