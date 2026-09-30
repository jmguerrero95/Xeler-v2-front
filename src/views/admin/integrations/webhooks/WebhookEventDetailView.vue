<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { helperStore } from "@/helper";
import { getWebhookEvent, type WebhookEvent } from "@/services/webhooksApi";
import { getPayload } from "@/utils/pagination";
import JsonViewer from "@/views/admin/operability/components/JsonViewer.vue";
import StatusChip from "@/views/admin/operability/components/StatusChip.vue";

const route = useRoute();
const router = useRouter();
const helper = helperStore();
const loading = ref(false);
const event = ref<WebhookEvent | null>(null);
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : "-";
const load = async () => {
  try {
    loading.value = true;
    const res = await getWebhookEvent(route.params.id as string);
    event.value = getPayload<WebhookEvent>(res);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar el webhook event", "error");
  } finally {
    loading.value = false;
  }
};
onMounted(load);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-4"><h1 class="text-h5 font-weight-bold mb-0">Webhook Event</h1><VBtn variant="text" prepend-icon="mdi-arrow-left" @click="router.back()">Volver</VBtn></div>
    <VProgressCircular v-if="loading" indeterminate />
    <VRow v-else-if="event">
      <VCol cols="12" md="6"><VCard rounded="lg"><VCardTitle>General</VCardTitle><VCardText>
        <p><strong>Provider:</strong> {{ event.provider || "-" }}</p><p><strong>Event:</strong> {{ event.event_type || event.event_id || "-" }}</p>
        <p><strong>Status:</strong> <StatusChip :value="event.status" /></p><p><strong>Signature:</strong> <StatusChip :value="event.signature_valid" /></p>
        <p><strong>Replay count:</strong> {{ event.replay_count ?? 0 }}</p><p><strong>Payload hash:</strong> {{ event.payload_hash || "-" }}</p>
        <p><strong>Received:</strong> {{ formatDate(event.received_at) }}</p><p><strong>Processed:</strong> {{ formatDate(event.processed_at) }}</p><p><strong>Failed:</strong> {{ formatDate(event.failed_at) }}</p>
      </VCardText></VCard></VCol>
      <VCol cols="12" md="6"><JsonViewer :value="event.metadata || {}" /></VCol>
    </VRow>
  </div>
</template>

