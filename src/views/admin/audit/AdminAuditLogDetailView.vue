<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { helperStore } from "@/helper";
import { getAdminAuditLog, type AdminAuditLog } from "@/services/adminAuditApi";
import { getPayload } from "@/utils/pagination";
import JsonViewer from "@/views/admin/operability/components/JsonViewer.vue";

const route = useRoute();
const router = useRouter();
const helper = helperStore();
const loading = ref(false);
const log = ref<AdminAuditLog | null>(null);
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : "-";

const load = async () => {
  try {
    loading.value = true;
    const res = await getAdminAuditLog(route.params.id as string);
    log.value = getPayload<AdminAuditLog>(res);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar el audit log", "error");
  } finally {
    loading.value = false;
  }
};
onMounted(load);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 font-weight-bold mb-0">Audit Log</h1>
      <VBtn variant="text" prepend-icon="mdi-arrow-left" @click="router.back()">Volver</VBtn>
    </div>
    <VProgressCircular v-if="loading" indeterminate />
    <VRow v-else-if="log">
      <VCol cols="12" md="6">
        <VCard rounded="lg"><VCardTitle>General</VCardTitle><VCardText>
          <p><strong>User:</strong> {{ log.user?.name || log.user_id || "-" }}</p>
          <p><strong>Action:</strong> {{ log.action || "-" }}</p>
          <p><strong>Entity:</strong> {{ log.entity_type || "-" }} #{{ log.entity_id || "-" }}</p>
          <p><strong>Request ID:</strong> {{ log.request_id || "-" }}</p>
          <p data-test="audit-reason"><strong>Motivo:</strong> {{ log.reason || "-" }}</p>
          <p><strong>IP:</strong> {{ log.ip || "-" }}</p>
          <p><strong>Created:</strong> {{ formatDate(log.created_at) }}</p>
          <p><strong>User agent:</strong> {{ log.user_agent || "-" }}</p>
        </VCardText></VCard>
      </VCol>
      <VCol cols="12" md="6"><JsonViewer :value="log.metadata || {}" /></VCol>
      <VCol cols="12" md="6"><JsonViewer :value="log.before || {}" /></VCol>
      <VCol cols="12" md="6"><JsonViewer :value="log.after || {}" /></VCol>
    </VRow>
  </div>
</template>
