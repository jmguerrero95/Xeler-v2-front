<script setup lang="ts">
defineProps<{
  title: string;
  value?: string | number | boolean | null;
  subtitle?: string | null;
  color?: string;
  loading?: boolean;
}>();
</script>

<template>
  <VCard rounded="lg" class="h-100">
    <VCardText>
      <div class="text-body-2 text-medium-emphasis mb-1">{{ title }}</div>
      <div class="text-h5 font-weight-bold" :class="color ? `text-${color}` : ''">
        <VProgressCircular v-if="loading" indeterminate size="22" />
        <span v-else>{{ value ?? "-" }}</span>
      </div>
      <div v-if="subtitle" class="text-caption text-medium-emphasis mt-1">{{ subtitle }}</div>
    </VCardText>
  </VCard>
</template>

