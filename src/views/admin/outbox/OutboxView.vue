<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import {
  getOutboxStats,
  listOutboxEvents,
  markOutboxEventDead,
  requeueOutboxEvent,
  retryOutboxEvent,
  type OutboxEvent,
  type OutboxListParams,
  type OutboxStats,
} from "@/services/outboxApi";
import {
  getCurrentPage,
  getItems,
  getLastPage,
  getMeta,
  getPayload,
  getPerPage,
  getTotal,
  type PaginationMeta,
} from "@/utils/pagination";
import OutboxFilters from "./components/OutboxFilters.vue";
import OutboxStatsCards from "./components/OutboxStatsCards.vue";
import OutboxStatusBadge from "./components/OutboxStatusBadge.vue";
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

type OutboxAction = "retry" | "requeue" | "mark-dead";

const router = useRouter();
const helper = helperStore();
const userStore = UserStore();
const { runWithTwoFactor } = useTwoFactorGuard();

const events = ref<OutboxEvent[]>([]);
const stats = ref<OutboxStats | null>(null);
const meta = ref<PaginationMeta>({});
const filters = ref<OutboxListParams>({});
const loading = ref(false);
const loadingStats = ref(false);
const actionLoadingId = ref<string | number | null>(null);
const selectedAction = ref<{ action: OutboxAction; event: OutboxEvent } | null>(null);
const actionDialog = computed({
  get: () => Boolean(selectedAction.value),
  set: (value: boolean) => {
    if (!value) selectedAction.value = null;
  },
});

const currentPage = computed(() => getCurrentPage(meta.value));
const lastPage = computed(() => getLastPage(meta.value));
const total = computed(() => getTotal(meta.value));
const perPage = computed(() => getPerPage(meta.value));
const canViewStats = computed(() => userStore.hasPermission("outbox.stats"));

const cleanParams = (params: OutboxListParams): OutboxListParams =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null),
  ) as OutboxListParams;

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const loadStats = async () => {
  if (!canViewStats.value) return;

  try {
    loadingStats.value = true;
    const response = await getOutboxStats();
    stats.value = getPayload<OutboxStats>(response);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar estadísticas de Outbox", "error");
  } finally {
    loadingStats.value = false;
  }
};

const loadEvents = async (page = currentPage.value || 1) => {
  try {
    loading.value = true;
    const response = await listOutboxEvents(
      cleanParams({
        ...filters.value,
        page,
        per_page: perPage.value || 15,
      }),
    );
    events.value = getItems<OutboxEvent>(response);
    meta.value = getMeta(response);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar Outbox", "error");
  } finally {
    loading.value = false;
  }
};

const canRetry = (event: OutboxEvent): boolean =>
  userStore.hasPermission("outbox.retry") && ["failed", "dead"].includes(event.status ?? "");

const canRequeue = (event: OutboxEvent): boolean =>
  userStore.hasPermission("outbox.requeue") && event.status !== "processed";

const canMarkDead = (event: OutboxEvent): boolean =>
  userStore.hasPermission("outbox.mark-dead") && ["pending", "failed"].includes(event.status ?? "");

const openAction = (action: OutboxAction, event: OutboxEvent) => {
  selectedAction.value = { action, event };
};

const executeAction = async () => {
  if (!selectedAction.value) return;
  const { action, event } = selectedAction.value;

  try {
    actionLoadingId.value = event.id;
    if (action === "retry") await retryOutboxEvent(event.id);
    if (action === "requeue") await requeueOutboxEvent(event.id);
    if (action === "mark-dead") await markOutboxEventDead(event.id);
    helper.showNotify("Acción ejecutada correctamente", "success");
    selectedAction.value = null;
    await Promise.all([loadEvents(), loadStats()]);
  } catch (error: any) {
    helper.showNotify(
      error?.message ?? "El evento no puede procesarse en su estado actual",
      "error",
    );
  } finally {
    actionLoadingId.value = null;
  }
};

const runAction = async () => runWithTwoFactor(executeAction, "finance.financial_configuration");

onMounted(async () => {
  await Promise.all([loadEvents(1), loadStats()]);
});
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 font-weight-bold mb-0">Outbox</h1>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="loadEvents()">Refrescar</VBtn>
    </div>

    <OutboxStatsCards v-if="canViewStats" class="mb-4" :stats="stats" :loading="loadingStats" />
    <OutboxFilters v-model="filters" class="mb-4" :loading="loading" @apply="loadEvents(1)" @reset="loadEvents(1)" />

    <VCard rounded="lg">
      <VTable>
        <thead>
          <tr>
            <th>ID</th>
            <th>Event type</th>
            <th>Status</th>
            <th>Attempts</th>
            <th>Available</th>
            <th>Locked</th>
            <th>Processed</th>
            <th>Failed</th>
            <th>Operation key</th>
            <th>Created</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="11" class="text-center py-8">
              <VProgressCircular indeterminate />
            </td>
          </tr>
          <tr v-else-if="events.length === 0">
            <td colspan="11" class="text-center py-8 text-medium-emphasis">No hay eventos Outbox.</td>
          </tr>
          <tr v-for="event in events" v-else :key="event.id">
            <td>{{ event.uuid || event.id }}</td>
            <td>{{ event.event_type || "-" }}</td>
            <td><OutboxStatusBadge :status="event.status" /></td>
            <td>{{ event.attempts ?? 0 }} / {{ event.max_attempts ?? "-" }}</td>
            <td>{{ formatDate(event.available_at) }}</td>
            <td>{{ formatDate(event.locked_until) }}</td>
            <td>{{ formatDate(event.processed_at) }}</td>
            <td>{{ formatDate(event.failed_at) }}</td>
            <td class="text-truncate" style="max-width: 180px">{{ event.operation_key || "-" }}</td>
            <td>{{ formatDate(event.created_at) }}</td>
            <td class="text-right">
              <VBtn icon="mdi-eye" size="small" variant="text" @click="router.push({ name: 'admin-outbox-show', params: { id: event.id } })" />
              <VBtn v-if="canRetry(event)" icon="mdi-reload" size="small" variant="text" color="warning" :loading="actionLoadingId === event.id" @click="openAction('retry', event)" />
              <VBtn v-if="canRequeue(event)" icon="mdi-playlist-plus" size="small" variant="text" color="info" :loading="actionLoadingId === event.id" @click="openAction('requeue', event)" />
              <VBtn v-if="canMarkDead(event)" icon="mdi-close-octagon" size="small" variant="text" color="error" :loading="actionLoadingId === event.id" @click="openAction('mark-dead', event)" />
            </td>
          </tr>
        </tbody>
      </VTable>
      <VDivider />
      <div class="d-flex align-center justify-space-between pa-4">
        <span class="text-body-2 text-medium-emphasis">Total: {{ total }}</span>
        <div class="d-flex align-center ga-2">
          <VBtn size="small" variant="text" :disabled="currentPage <= 1 || loading" @click="loadEvents(currentPage - 1)">Anterior</VBtn>
          <span class="text-body-2">{{ currentPage }} / {{ lastPage }}</span>
          <VBtn size="small" variant="text" :disabled="currentPage >= lastPage || loading" @click="loadEvents(currentPage + 1)">Siguiente</VBtn>
        </div>
      </div>
    </VCard>

    <VDialog v-model="actionDialog" max-width="440">
      <VCard rounded="lg">
        <VCardTitle>Confirmar acción</VCardTitle>
        <VCardText>
          Esta acción se ejecutará sobre el evento
          <strong>{{ selectedAction?.event.uuid || selectedAction?.event.id }}</strong>.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="selectedAction = null">Cancelar</VBtn>
          <VBtn color="primary" :loading="Boolean(actionLoadingId)" @click="runAction">Confirmar</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
