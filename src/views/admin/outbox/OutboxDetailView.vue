<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import {
  getOutboxEvent,
  markOutboxEventDead,
  requeueOutboxEvent,
  retryOutboxEvent,
  type OutboxEvent,
} from "@/services/outboxApi";
import { getPayload } from "@/utils/pagination";
import OutboxStatusBadge from "./components/OutboxStatusBadge.vue";
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const props = defineProps<{
  id: string | number;
}>();

const router = useRouter();
const helper = helperStore();
const userStore = UserStore();
const { runWithTwoFactor } = useTwoFactorGuard();
const event = ref<OutboxEvent | null>(null);
const loading = ref(false);
const actionLoading = ref(false);
const selectedAction = ref<"retry" | "requeue" | "mark-dead" | null>(null);
const actionDialog = computed({
  get: () => Boolean(selectedAction.value),
  set: (value: boolean) => {
    if (!value) selectedAction.value = null;
  },
});

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const payloadJson = computed(() => JSON.stringify(event.value?.payload ?? {}, null, 2));
const headersJson = computed(() => JSON.stringify(event.value?.headers ?? {}, null, 2));

const canRetry = computed(() =>
  userStore.hasPermission("outbox.retry") && ["failed", "dead"].includes(event.value?.status ?? ""),
);
const canRequeue = computed(() =>
  userStore.hasPermission("outbox.requeue") && event.value?.status !== "processed",
);
const canMarkDead = computed(() =>
  userStore.hasPermission("outbox.mark-dead") && ["pending", "failed"].includes(event.value?.status ?? ""),
);

const loadEvent = async () => {
  try {
    loading.value = true;
    const response = await getOutboxEvent(props.id);
    event.value = getPayload<OutboxEvent>(response);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar el evento", "error");
  } finally {
    loading.value = false;
  }
};

const executeAction = async (action: "retry" | "requeue" | "mark-dead") => {
  if (!event.value) return;

  try {
    actionLoading.value = true;
    if (action === "retry") await retryOutboxEvent(event.value.id);
    if (action === "requeue") await requeueOutboxEvent(event.value.id);
    if (action === "mark-dead") await markOutboxEventDead(event.value.id);
    helper.showNotify("Acción ejecutada correctamente", "success");
    selectedAction.value = null;
    await loadEvent();
  } catch (error: any) {
    helper.showNotify(error?.message ?? "El evento no puede procesarse en su estado actual", "error");
  } finally {
    actionLoading.value = false;
  }
};

const runAction = async (action: "retry" | "requeue" | "mark-dead") =>
  runWithTwoFactor(() => executeAction(action), "finance.financial_configuration");

const confirmAction = (action: "retry" | "requeue" | "mark-dead") => {
  selectedAction.value = action;
};

onMounted(loadEvent);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <div>
        <VBtn variant="text" prepend-icon="mdi-arrow-left" class="mb-2" @click="router.back()">Volver</VBtn>
        <h1 class="text-h5 font-weight-bold mb-0">Detalle Outbox</h1>
      </div>
      <div v-if="event" class="d-flex ga-2">
        <VBtn v-if="canRetry" color="warning" :loading="actionLoading" @click="confirmAction('retry')">Retry</VBtn>
        <VBtn v-if="canRequeue" color="info" :loading="actionLoading" @click="confirmAction('requeue')">Requeue</VBtn>
        <VBtn v-if="canMarkDead" color="error" :loading="actionLoading" @click="confirmAction('mark-dead')">Mark dead</VBtn>
      </div>
    </div>

    <VCard v-if="loading" class="pa-8 text-center" rounded="lg">
      <VProgressCircular indeterminate />
    </VCard>

    <VAlert v-else-if="!event" type="warning" variant="tonal">No se encontró el evento.</VAlert>

    <VRow v-else>
      <VCol cols="12" md="6">
        <VCard class="pa-4" rounded="lg">
          <h2 class="text-subtitle-1 font-weight-bold mb-4">Datos generales</h2>
          <VList density="compact">
            <VListItem title="ID" :subtitle="String(event.id)" />
            <VListItem title="UUID" :subtitle="event.uuid || '-'" />
            <VListItem title="Event type" :subtitle="event.event_type || '-'" />
            <VListItem title="Status">
              <template #subtitle><OutboxStatusBadge :status="event.status" /></template>
            </VListItem>
            <VListItem title="Attempts" :subtitle="`${event.attempts ?? 0} / ${event.max_attempts ?? '-'}`" />
            <VListItem title="Operation key" :subtitle="event.operation_key || '-'" />
            <VListItem title="Idempotency key" :subtitle="event.idempotency_key || '-'" />
          </VList>
        </VCard>
      </VCol>
      <VCol cols="12" md="6">
        <VCard class="pa-4" rounded="lg">
          <h2 class="text-subtitle-1 font-weight-bold mb-4">Fechas</h2>
          <VList density="compact">
            <VListItem title="Available at" :subtitle="formatDate(event.available_at)" />
            <VListItem title="Locked until" :subtitle="formatDate(event.locked_until)" />
            <VListItem title="Processed at" :subtitle="formatDate(event.processed_at)" />
            <VListItem title="Failed at" :subtitle="formatDate(event.failed_at)" />
            <VListItem title="Created at" :subtitle="formatDate(event.created_at)" />
            <VListItem title="Updated at" :subtitle="formatDate(event.updated_at)" />
          </VList>
        </VCard>
      </VCol>
      <VCol cols="12">
        <VCard class="pa-4" rounded="lg">
          <h2 class="text-subtitle-1 font-weight-bold mb-3">Último error</h2>
          <pre class="json-viewer">{{ event.last_error || "-" }}</pre>
        </VCard>
      </VCol>
      <VCol cols="12" md="6">
        <VCard class="pa-4" rounded="lg">
          <h2 class="text-subtitle-1 font-weight-bold mb-3">Payload</h2>
          <pre class="json-viewer">{{ payloadJson }}</pre>
        </VCard>
      </VCol>
      <VCol cols="12" md="6">
        <VCard class="pa-4" rounded="lg">
          <h2 class="text-subtitle-1 font-weight-bold mb-3">Headers</h2>
          <pre class="json-viewer">{{ headersJson }}</pre>
        </VCard>
      </VCol>
    </VRow>

    <VDialog v-model="actionDialog" max-width="440">
      <VCard rounded="lg">
        <VCardTitle>Confirmar acción</VCardTitle>
        <VCardText>
          Esta acción se ejecutará sobre el evento
          <strong>{{ event?.uuid || event?.id }}</strong>.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="selectedAction = null">Cancelar</VBtn>
          <VBtn color="primary" :loading="actionLoading" @click="selectedAction && runAction(selectedAction)">Confirmar</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.json-viewer {
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  max-height: 420px;
  overflow: auto;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
