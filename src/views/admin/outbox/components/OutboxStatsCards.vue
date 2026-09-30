<script setup lang="ts">
import type { OutboxStats } from "@/services/outboxApi";

defineProps<{
  stats?: OutboxStats | null;
  loading?: boolean;
}>();

const getCount = (stats: OutboxStats | null | undefined, key: string): number =>
  Number(stats?.totals?.[key] ?? stats?.counts_by_status?.[key] ?? 0);
</script>

<template>
  <VRow>
    <VCol v-for="status in ['pending', 'processing', 'processed', 'failed', 'dead']" :key="status" cols="12" sm="6" md="2">
      <VCard class="pa-4" rounded="lg">
        <div class="text-caption text-medium-emphasis text-uppercase">{{ status }}</div>
        <div class="text-h5 font-weight-bold mt-1">
          <VProgressCircular v-if="loading" indeterminate size="20" width="2" />
          <span v-else>{{ getCount(stats, status) }}</span>
        </div>
      </VCard>
    </VCol>
    <VCol cols="12" md="2">
      <VCard class="pa-4" rounded="lg">
        <div class="text-caption text-medium-emphasis text-uppercase">oldest pending</div>
        <div class="text-body-2 font-weight-medium mt-1 text-truncate">
          {{ stats?.oldest_pending || "-" }}
        </div>
      </VCard>
    </VCol>
  </VRow>
</template>
