<template>
  <VContainer>
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <h1 class="text-h5">
          {{ admin ? "Bandeja de soporte" : "Mis tickets" }}
        </h1>
        <p class="text-medium-emphasis">
          Seguimiento privado de solicitudes y conversaciones.
        </p>
      </div>
      <VBtn v-if="!admin" data-test="new-ticket" @click="creating = true"
        >Crear ticket</VBtn
      >
    </div>

    <VRow v-if="admin" class="mb-3">
      <VCol cols="12" sm="4"
        ><VSelect
          v-model="filters.status"
          clearable
          label="Estado"
          :items="statusFilterOptions" item-title="title" item-value="value"
      /></VCol>
      <VCol cols="12" sm="4"
        ><VSelect
          v-model="filters.priority"
          clearable
          label="Prioridad"
          :items="priorityFilterOptions" item-title="title" item-value="value"
      /></VCol>
      <VCol cols="12" sm="4"
        ><VTextField
          v-model="filters.search"
          label="Buscar asunto"
          @keyup.enter="load"
      /></VCol>
    </VRow>
    <div v-if="admin" class="d-flex justify-end mb-3">
      <VBtn data-test="apply-ticket-filters" :loading="loading" @click="load(1)">Aplicar filtros</VBtn>
    </div>

    <VAlert v-if="error" type="error" variant="tonal" class="mb-4">{{
      error
    }}</VAlert>
    <VProgressLinear v-if="loading" indeterminate class="mb-3" />
    <VRow>
      <VCol cols="12" md="4">
        <VList v-if="tickets.length" lines="two" border rounded>
          <VListItem
            v-for="ticket in tickets"
            :key="ticket.public_reference"
            data-test="ticket-row"
            :active="current?.public_reference === ticket.public_reference"
            @click="select(ticket.public_reference)"
          >
            <VListItemTitle>{{ ticket.subject }}</VListItemTitle>
            <VListItemSubtitle
              >{{ statusLabel(ticket.status) }} · {{ priorityLabel(ticket.priority) }}</VListItemSubtitle
            >
          </VListItem>
        </VList>
        <VAlert
          v-else-if="!loading"
          data-test="empty"
          type="info"
          variant="tonal"
          >No hay tickets para estos filtros.</VAlert
        >
        <div v-if="lastPage > 1" class="d-flex align-center justify-space-between mt-3">
          <VBtn
            data-test="tickets-previous-page"
            size="small"
            variant="text"
            :disabled="currentPage <= 1 || loading"
            @click="load(currentPage - 1)"
          >Anterior</VBtn>
          <span class="text-caption">{{ currentPage }} / {{ lastPage }} ({{ total }})</span>
          <VBtn
            data-test="tickets-next-page"
            size="small"
            variant="text"
            :disabled="currentPage >= lastPage || loading"
            @click="load(currentPage + 1)"
          >Siguiente</VBtn>
        </div>
      </VCol>

      <VCol cols="12" md="8">
        <VCard v-if="current" data-test="conversation">
          <VCardTitle>{{ current.subject }}</VCardTitle>
          <VCardSubtitle
            >{{ statusLabel(current.status) }} · {{ priorityLabel(current.priority) }}</VCardSubtitle
          >
          <VCardText>
            <div
              v-for="message in current.messages || []"
              :key="message.id"
              class="message mb-3"
              :class="`message--${message.author_type}`"
            >
              <strong>{{
                message.author_type === "agent" ? "Soporte" : "Usuario"
              }}</strong>
              <p class="mb-1">{{ message.body }}</p>
              <VBtn
                v-for="file in message.attachments || []"
                :key="file.public_reference"
                class="mr-2 mt-1"
                size="small"
                variant="text"
                prepend-icon="mdi-download"
                :loading="downloadingAttachment === file.public_reference"
                :disabled="Boolean(downloadingAttachment)"
                @click="downloadAttachment(file)"
              >
                {{ file.original_name }}
              </VBtn>
            </div>
            <VTextarea v-model="replyBody" label="Respuesta" />
            <VFileInput
              v-model="replyFile"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              label="Adjunto privado"
            />
            <div class="d-flex flex-wrap ga-2">
              <VBtn
                data-test="reply"
                :disabled="replyBody.trim().length < 2"
                @click="reply"
                >Responder</VBtn
              >
              <VBtn
                v-if="current.status !== 'closed'"
                variant="outlined"
                :disabled="admin && adminReason.trim().length < 3"
                @click="close"
                >Cerrar</VBtn
              >
              <VBtn
                v-else
                variant="outlined"
                :disabled="admin && adminReason.trim().length < 3"
                @click="reopen"
                >Reabrir</VBtn
              >
            </div>
            <VRow v-if="admin" class="mt-3">
              <VCol cols="12" sm="4"
                ><VTextField
                  v-model.number="targetAdminId"
                  type="number"
                  label="ID agente"
              /></VCol>
              <VCol cols="12" sm="4"
                ><VSelect
                  v-model="adminPriority"
                  :items="priorityFilterOptions" item-title="title" item-value="value"
                  label="Prioridad"
              /></VCol>
              <VCol cols="12" sm="4"
                ><VSelect
                  v-model="adminStatus"
                  :items="statusFilterOptions" item-title="title" item-value="value"
                  label="Estado"
              /></VCol>
              <VCol cols="12"
                ><VTextField v-model="adminReason" label="Motivo obligatorio"
              /></VCol>
              <VCol cols="12"
                ><VBtn
                  :disabled="adminReason.trim().length < 3"
                  @click="saveAdministration"
                  >Guardar administracion</VBtn
                ></VCol
              >
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VDialog v-model="creating" max-width="560">
      <VCard title="Nuevo ticket">
        <VCardText>
          <VTextField v-model="draft.subject" label="Asunto" />
          <VTextarea v-model="draft.body" label="Describe tu solicitud" />
          <VTextField
            v-model.number="draft.order_id"
            type="number"
            label="ID de orden (opcional)"
          />
          <VFileInput
            v-model="draft.attachment"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            label="Adjunto privado"
          />
        </VCardText>
        <VCardActions
          ><VBtn variant="text" @click="creating = false">Cancelar</VBtn
          ><VBtn data-test="create" :disabled="!canCreate" @click="create"
            >Crear</VBtn
          ></VCardActions
        >
      </VCard>
    </VDialog>
  </VContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  assignSupportTicket,
  closeSupportTicket,
  createSupportTicket,
  getSupportTicket,
  listSupportTickets,
  reopenSupportTicket,
  replySupportTicket,
  updateSupportTicket,
  type SupportTicket,
  type SupportAttachment,
} from "@/services/supportTicketsApi";
import { downloadAuthenticatedBlob } from "@/services/apiClient";
import { statusLabel, statusOptions } from "@/utils/statusLabels";
import { getCurrentPage, getItems, getLastPage, getMeta, getPerPage, getTotal, type PaginationMeta } from "@/utils/pagination";

const props = withDefaults(defineProps<{ admin?: boolean }>(), {
  admin: false,
});
const admin = computed(() => props.admin);
const statuses = ["open", "in_progress", "waiting_user", "resolved", "closed"];
const priorities = ["low", "normal", "high", "urgent"];
const statusFilterOptions = statusOptions(statuses);
const priorityLabels: Record<string, string> = { low: "Baja", normal: "Normal", high: "Alta", urgent: "Urgente" };
const priorityFilterOptions = priorities.map((value) => ({ value, title: priorityLabels[value] ?? value }));
const priorityLabel = (value: string) => priorityLabels[value] ?? value;
const tickets = ref<SupportTicket[]>([]);
const meta = ref<PaginationMeta>({});
const currentPage = computed(() => getCurrentPage(meta.value));
const lastPage = computed(() => getLastPage(meta.value));
const total = computed(() => getTotal(meta.value));
const perPage = computed(() => getPerPage(meta.value));
const current = ref<SupportTicket | null>(null);
const loading = ref(false);
const error = ref("");
const creating = ref(false);
const downloadingAttachment = ref<string | null>(null);
const filters = reactive({ status: "", priority: "", search: "" });
const draft = reactive<{
  subject: string;
  body: string;
  order_id?: number;
  attachment?: File;
}>({ subject: "", body: "" });
const replyBody = ref("");
const replyFile = ref<File>();
const targetAdminId = ref<number>();
const adminPriority = ref("normal");
const adminStatus = ref("open");
const adminReason = ref("");
const canCreate = computed(
  () => draft.subject.trim().length >= 3 && draft.body.trim().length >= 3,
);

const payloadData = <T,>(response: { data: { data?: T } | T }): T =>
  ((response.data as { data?: T }).data ?? response.data) as T;
const load = async (page = currentPage.value || 1) => {
  loading.value = true;
  error.value = "";
  try {
    const response = await listSupportTickets(admin.value, {
      ...filters,
      page,
      per_page: perPage.value || 15,
    });
    tickets.value = getItems<SupportTicket>(response);
    meta.value = getMeta(response);
  } catch {
    tickets.value = [];
    meta.value = {};
    error.value = "No fue posible cargar los tickets.";
  } finally {
    loading.value = false;
  }
};
const select = async (reference: string) => {
  const response = await getSupportTicket(reference, admin.value);
  current.value = payloadData<SupportTicket>(response);
  adminPriority.value = current.value.priority;
  adminStatus.value = current.value.status;
};
const create = async () => {
  if (!canCreate.value) return;
  await createSupportTicket(draft);
  creating.value = false;
  Object.assign(draft, {
    subject: "",
    body: "",
    order_id: undefined,
    attachment: undefined,
  });
  await load(1);
};
const reply = async () => {
  if (!current.value) return;
  const response = await replySupportTicket(
    current.value.public_reference,
    admin.value,
    replyBody.value,
    replyFile.value,
  );
  current.value = payloadData<SupportTicket>(response);
  replyBody.value = "";
  replyFile.value = undefined;
};
const close = async () => {
  if (!current.value || (admin.value && adminReason.value.trim().length < 3))
    return;
  const reference = current.value.public_reference;
  await closeSupportTicket(reference, admin.value, adminReason.value.trim());
  if (admin.value) adminReason.value = "";
  await select(reference);
};
const reopen = async () => {
  if (!current.value || (admin.value && adminReason.value.trim().length < 3))
    return;
  const reference = current.value.public_reference;
  await reopenSupportTicket(reference, admin.value, adminReason.value.trim());
  if (admin.value) adminReason.value = "";
  await select(reference);
};
const downloadAttachment = async (file: SupportAttachment) => {
  if (!file.download_endpoint || downloadingAttachment.value) return;

  downloadingAttachment.value = file.public_reference;
  error.value = "";
  try {
    await downloadAuthenticatedBlob(file.download_endpoint, file.original_name);
  } catch {
    error.value = "No fue posible descargar el adjunto.";
  } finally {
    downloadingAttachment.value = null;
  }
};

const saveAdministration = async () => {
  if (!current.value || adminReason.value.trim().length < 3) return;
  if (targetAdminId.value && targetAdminId.value !== current.value.assignee?.id)
    await assignSupportTicket(
      current.value.public_reference,
      targetAdminId.value,
      adminReason.value,
    );
  await updateSupportTicket(current.value.public_reference, {
    priority: adminPriority.value,
    status: adminStatus.value,
    reason: adminReason.value,
  });
  await select(current.value.public_reference);
};

onMounted(load);
</script>

<style scoped>
.message {
  border-left: 3px solid rgb(var(--v-theme-primary));
  padding: 10px 14px;
  background: rgba(var(--v-theme-primary), 0.05);
}
.message--agent {
  border-left-color: rgb(var(--v-theme-warning));
}
</style>
