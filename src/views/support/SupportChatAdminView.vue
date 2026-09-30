<template>
  <VContainer fluid @pointerdown.once="unlock">
    <div class="d-flex justify-space-between align-center mb-4"><div><h1 class="text-h5">Chat de soporte</h1><p class="text-medium-emphasis">Atiende conversaciones y contacta clientes.</p></div><div><VBtn icon="mdi-volume-high" variant="text" :aria-label="sound?'Desactivar sonido':'Activar sonido'" @click="toggleSound"/><VBtn v-if="can('support_chat.initiate')" prepend-icon="mdi-message-plus" @click="initiating=true">Iniciar conversación</VBtn></div></div>
    <VAlert v-if="error" type="error" variant="tonal" class="mb-3">{{error}}</VAlert>
    <VRow><VCol cols="12" md="4"><VCard>
      <VTabs v-model="filter" show-arrows @update:model-value="changeFilter"><VTab value="unassigned">Pendientes <VBadge v-if="pending" :content="pending" color="error"/></VTab><VTab value="mine">Mis conversaciones <VBadge v-if="personalUnread" :content="personalUnread" color="error"/></VTab><VTab value="waiting_customer">Esperando cliente</VTab><VTab value="closed">Cerradas</VTab><VTab v-if="can('support_chat.view_all')" value="all">Todas</VTab></VTabs>
      <VList lines="two"><VListItem v-for="c in conversations" :key="c.reference" :active="current?.reference===c.reference" @click="select(c)"><VListItemTitle>{{c.customer?.name||'Cliente'}}</VListItemTitle><VListItemSubtitle>{{c.status_label}} · {{c.assigned_to?.name||'Sin asignar'}}</VListItemSubtitle><template #append><VBadge v-if="c.unread" :content="c.unread" color="error"/></template></VListItem><VListItem v-if="!conversations.length" title="No hay conversaciones"/></VList>
      <VPagination v-if="lastPage>1" v-model="page" :length="lastPage" density="compact" aria-label="Páginas de conversaciones" @update:model-value="load"/>
    </VCard></VCol>
    <VCol cols="12" md="8"><VCard v-if="current">
      <VCardTitle class="d-flex align-center"><span>{{current.customer?.name}}</span><VSpacer/><VChip>{{current.status_label}}</VChip></VCardTitle><VCardSubtitle>{{current.customer?.email}} · {{current.assigned_to?.name||'Sin asignar'}}</VCardSubtitle>
      <VCardActions class="flex-wrap"><VBtn v-if="!current.assigned_to" @click="claim">Tomar conversación</VBtn><div v-if="can('support_chat.assign')"><VSelect v-model="assignee" :items="agents" item-title="name" item-value="id" density="compact" label="Asignar agente" style="min-width:240px" @update:model-value="assign"/><VBtn v-if="agentPage<agentLastPage" size="small" variant="text" :loading="loadingAgents" @click="loadMoreAgents">Cargar más agentes</VBtn></div><VBtn v-if="can('support_chat.close')&&current.status!=='closed'" variant="outlined" @click="close">Cerrar</VBtn><VBtn v-if="can('support_chat.close')&&current.status==='closed'" variant="outlined" @click="reopen">Reabrir</VBtn><VBtn v-if="can('support_chat.block')&&!current.blocked" color="error" variant="outlined" @click="blocking=true">Bloquear chat</VBtn><VBtn v-if="can('support_chat.block')&&current.blocked" variant="outlined" @click="unblock">Desbloquear chat</VBtn></VCardActions><VDivider/>
      <VCardText ref="messagePanel" class="messages" @scroll="onMessagePanelScroll">
        <div class="text-center">
          <VBtn v-if="nextCursor" size="small" variant="text" :loading="loadingOlder" @click="loadOlder">Cargar mensajes anteriores</VBtn>
        </div>
        <div v-if="newMessagesCount > 0" class="new-messages-banner">
          <span>{{ newMessagesCount === 1 ? '1 mensaje nuevo' : `${newMessagesCount} mensajes nuevos` }}</span>
          <VBtn size="x-small" variant="text" @click="scrollToBottom">Ir al final</VBtn>
        </div>
        <div v-for="m in messages" :key="m.id" class="bubble" :class="m.sender==='agent'?'mine':'theirs'"><strong>{{m.sender==='agent'?'Tú':'Cliente'}}</strong><p v-if="m.body">{{m.body}}</p><div v-if="m.attachments?.length" class="message-attachments"><VBtn v-for="a in m.attachments" :key="a.reference" class="attachment-link" size="small" variant="text" @click="download(a)"><VIcon start icon="mdi-paperclip"/>{{a.name}}</VBtn></div><small>{{format(m.created_at)}}</small></div>
      </VCardText>
      <VCardActions v-if="can('support_chat.reply')&&current.status!=='closed'" class="composer" data-test="admin-chat-composer"><input ref="filePicker" class="file-picker" data-test="admin-support-file-picker" type="file" multiple :accept="allowed" :disabled="sending" aria-label="Seleccionar archivos para adjuntar" @change="selectFiles"/><div v-if="files.length" class="selected-files"><div v-for="(file,index) in files" :key="`${file.name}-${file.size}-${index}`" class="file-chip"><VIcon icon="mdi-file-outline"/><span :title="file.name">{{file.name}}</span><small>{{fileSize(file.size)}}</small><VBtn icon="mdi-close" density="compact" variant="text" :aria-label="`Quitar ${file.name}`" @click="removeFile(index)"/></div></div><div class="composer-row"><VBtn class="attach-button" icon="mdi-paperclip" variant="text" aria-label="Adjuntar archivo" :disabled="sending" @click="openFilePicker"/><VTextarea v-model="body" class="message-input" placeholder="Escribe una respuesta" rows="2" hide-details :disabled="sending" @keydown.enter.exact.prevent="send"/><VBtn class="send-button" icon="mdi-send" color="primary" aria-label="Enviar respuesta" :loading="sending" :disabled="!canSend" @click="send"/></div><small class="composer-help">Puedes enviar un mensaje, un archivo o ambos.</small></VCardActions>
    </VCard><VAlert v-else type="info" variant="tonal">Selecciona una conversación.</VAlert></VCol></VRow>
    <VDialog v-model="initiating" max-width="560"><VCard title="Iniciar conversación"><VCardText><VTextField v-model="search" label="Buscar cliente" @update:model-value="find"/><VSelect v-model="customer" :items="customers" item-title="label" item-value="id" label="Cliente"/><VBtn v-if="customerPage<customerLastPage" block variant="text" :loading="loadingCustomers" @click="loadMoreCustomers">Cargar más clientes</VBtn><input ref="initiateFilePicker" class="file-picker" type="file" multiple :accept="allowed" aria-label="Seleccionar archivos para adjuntar" @change="selectInitiateFiles"/><div v-if="initiateFiles.length" class="selected-files"><div v-for="(file,index) in initiateFiles" :key="`${file.name}-${file.size}-${index}`" class="file-chip"><VIcon icon="mdi-file-outline"/><span :title="file.name">{{file.name}}</span><small>{{fileSize(file.size)}}</small><VBtn icon="mdi-close" density="compact" variant="text" :aria-label="`Quitar ${file.name}`" @click="removeInitiateFile(index)"/></div></div><div class="composer-row"><VBtn class="attach-button" icon="mdi-paperclip" variant="text" aria-label="Adjuntar archivo" @click="openInitiateFilePicker"/><VTextarea v-model="proactiveBody" label="Mensaje" maxlength="4000" rows="2" auto-grow hide-details placeholder="Escribe un mensaje"/></div><small class="composer-help">Puedes enviar un mensaje, un archivo o ambos.</small></VCardText><VCardActions><VBtn @click="initiating=false">Cancelar</VBtn><VBtn color="primary" :disabled="!customer||(!proactiveBody.value.trim() && !initiateFiles.value.length)" @click="initiate">Enviar mensaje</VBtn></VCardActions></VCard></VDialog>
    <VDialog v-model="blocking" max-width="520"><VCard title="Bloquear chat"><VCardText><p>El cliente no podrá enviar nuevos mensajes mientras el bloqueo esté activo. Podrá seguir consultando el historial.</p><VTextarea v-model="reason" label="Motivo obligatorio"/></VCardText><VCardActions><VBtn @click="blocking=false">Cancelar</VBtn><VBtn color="error" :disabled="reason.trim().length<3" @click="block">Bloquear chat</VBtn></VCardActions></VCard></VDialog>
  </VContainer>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { UserStore } from "@/stores/UserStore";
import usePusher from "@/pusher";
import { useRoute } from "vue-router";
import { adminChatConversation, assignChat, blockChat, chatMessages, claimChat, closeChat, findCustomers, inboxChat, initiateChat, listAgents, readChat, reopenChat, sendChat, staffChatSummary, unblockChat, uuid, type ChatConversation, type ChatMessage } from "@/services/supportChatApi";
import { downloadAuthenticatedBlob } from "@/services/apiClient";
import { useSupportChatSound } from "@/composables/useSupportChatSound";

const store = UserStore();
const route = useRoute();
const { playNotification, toggleSound, isSoundEnabled, unlock } = useSupportChatSound();

const conversations = ref<ChatConversation[]>([]);
const current = ref<ChatConversation | null>(null);
const messages = ref<ChatMessage[]>([]);
const filter = ref("unassigned");
const pending = ref(0);
const unassignedCount = ref(0);
const mineCount = ref(0);
const waitingStaffCount = ref(0);
const waitingCustomerCount = ref(0);
const personalUnread = ref(0);
const lastActivityId = ref(0);
const page = ref(1);
const lastPage = ref(1);
const nextCursor = ref<string>();
const loadingOlder = ref(false);
const messagePanel = ref<HTMLElement>();
const body = ref("");
const files = ref<File[]>([]);
const filePicker = ref<HTMLInputElement>();
const sending = ref(false);
const error = ref("");
const initiating = ref(false);
const search = ref("");
const customers = ref<any[]>([]);
const customer = ref<number>();
const customerPage = ref(1);
const customerLastPage = ref(1);
const loadingCustomers = ref(false);
const proactiveBody = ref("");
const blocking = ref(false);
const reason = ref("");
const agents = ref<any[]>([]);
const agentPage = ref(1);
const agentLastPage = ref(1);
const loadingAgents = ref(false);
const assignee = ref<number>();
const pusherConnected = ref(false);
let pusher: ReturnType<typeof usePusher> | undefined;
let timer: number | undefined;

const initiateFiles = ref<File[]>([]);
const initiateFilePicker = ref<HTMLInputElement>();

const newMessagesCount = ref(0);
const isNearBottom = ref(true);

const can = (p: string) => store.hasRole("Superadmin") || store.hasPermission(p);
const format = (v: string) => new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" }).format(new Date(v));
const download = (a: any) => downloadAuthenticatedBlob(`admin/support-chat/attachments/${a.reference}`, a.name);
const allowed = ".jpg,.jpeg,.png,.webp,.pdf,.txt,.csv,.docx,.xlsx";
const canSend = computed(() => !sending.value && (body.value.trim().length > 0 || files.value.length > 0) && files.value.length <= 5);
const fileSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const openFilePicker = () => filePicker.value?.click();
const selectFiles = (event: Event) => { const chosen = Array.from((event.target as HTMLInputElement).files || []); files.value = chosen.slice(0, 5); (event.target as HTMLInputElement).value = "" };
const removeFile = (index: number) => { files.value = files.value.filter((_, current) => current !== index) };

const load = async () => { const r = await inboxChat(filter.value, page.value); conversations.value = r.data.data; pending.value = r.data.counts.pending; lastPage.value = r.data.meta.last_page };
const changeFilter = () => { page.value = 1; void load() };

const mergeMessages = (incoming: ChatMessage[]) => { const all = new Map(messages.value.map(m => [m.id, m])); incoming.forEach(m => all.set(m.id, m)); messages.value = [...all.values()].sort((a, b) => a.id - b.id) };

const select = async (c: ChatConversation, preserve = false) => { current.value = c; assignee.value = c.assigned_to?.id; const r = await chatMessages(c.reference, true); if (preserve) mergeMessages(r.data.data); else messages.value = r.data.data; nextCursor.value = r.data.meta.next_cursor; await readChat(c.reference, true); c.unread = 0; newMessagesCount.value = 0; isNearBottom.value = true; await nextTick(); scrollToBottom() };

const loadOlder = async () => { if (!current.value || !nextCursor.value || loadingOlder.value) return; loadingOlder.value = true; const panel = messagePanel.value; const oldHeight = panel?.scrollHeight || 0; try { const r = await chatMessages(current.value.reference, true, nextCursor.value); const known = new Set(messages.value.map(m => m.id)); messages.value = [...r.data.data.filter(m => !known.has(m.id)), ...messages.value]; nextCursor.value = r.data.meta.next_cursor; await nextTick(); if (panel) panel.scrollTop += panel.scrollHeight - oldHeight } finally { loadingOlder.value = false } };

const scrollToBottom = () => {
  const panel = messagePanel.value;
  if (panel) {
    panel.scrollTop = panel.scrollHeight;
    isNearBottom.value = true;
    newMessagesCount.value = 0;
  }
};

const onMessagePanelScroll = () => {
  const panel = messagePanel.value;
  if (!panel) return;
  const threshold = 100;
  isNearBottom.value = panel.scrollHeight - panel.scrollTop - panel.clientHeight < threshold;
  if (isNearBottom.value) {
    newMessagesCount.value = 0;
  }
};

const loadGlobalSummary = async () => { const r = await staffChatSummary(); const next = r.data.data.last_activity_id || 0; const increased = next > lastActivityId.value; pending.value = r.data.data.pending_count ?? 0; unassignedCount.value = r.data.data.unassigned_count ?? 0; mineCount.value = r.data.data.mine_count ?? 0; waitingStaffCount.value = r.data.data.waiting_staff_count ?? 0; waitingCustomerCount.value = r.data.data.waiting_customer_count ?? 0; personalUnread.value = r.data.data.personal_unread_count ?? 0; lastActivityId.value = Math.max(lastActivityId.value, next); return increased };

const lostScope = (e: any) => [403, 404].includes(Number(e?.response?.status ?? e?.original?.response?.status));
const clearCurrent = () => { current.value = null; messages.value = []; nextCursor.value = undefined; assignee.value = undefined; files.value = []; body.value = "" };

const refresh = async (withSound = true) => { const reference = current.value?.reference; const increased = await loadGlobalSummary(); await load(); if (reference) { try { const detail = await adminChatConversation(reference); current.value = detail.data.data; assignee.value = current.value.assigned_to?.id; const recent = await chatMessages(reference, true); const previousCount = messages.value.length; mergeMessages(recent.data.data); if (recent.data.data.length > previousCount && current.value) { if (isNearBottom.value) { scrollToBottom(); } else { newMessagesCount.value += recent.data.data.length - previousCount; } } } catch (e) { if (lostScope(e)) { clearCurrent(); error.value = "Esta conversación ya no está disponible para ti." } else throw e } } if (withSound && increased) playNotification() };

const send = async () => { if (!current.value || (!body.value.trim() && !files.value.length)) return; sending.value = true; try { await sendChat(current.value.reference, body.value, uuid(), files.value, true); body.value = ""; files.value = []; await refresh(false); await nextTick(); scrollToBottom(); } finally { sending.value = false } };
const claim = async () => { if (current.value) { await claimChat(current.value.reference); await refresh(false) } };
const assign = async () => { if (current.value && assignee.value) { await assignChat(current.value.reference, assignee.value); await refresh(false) } };
const close = async () => { if (current.value) { await closeChat(current.value.reference); await refresh(false) } };
const reopen = async () => { if (current.value) { await reopenChat(current.value.reference); await refresh(false) } };

const customerItems = (items: any[]) => items.map(x => ({ ...x, label: `${x.name} · ${x.email}` }));
const find = () => { clearTimeout(timer); customerPage.value = 1; timer = window.setTimeout(async () => { if (search.value.length >= 2) { loadingCustomers.value = true; try { const r = await findCustomers(search.value, 1); customers.value = customerItems(r.data.data); customerLastPage.value = r.data.meta.last_page } finally { loadingCustomers.value = false } } }, 300) };
const loadMoreCustomers = async () => { if (customerPage.value >= customerLastPage.value) return; loadingCustomers.value = true; try { const r = await findCustomers(search.value, ++customerPage.value); const known = new Set(customers.value.map(x => x.id)); customers.value.push(...customerItems(r.data.data).filter(x => !known.has(x.id))); customerLastPage.value = r.data.meta.last_page } finally { loadingCustomers.value = false } };
const loadMoreAgents = async () => { if (agentPage.value >= agentLastPage.value) return; loadingAgents.value = true; try { const r = await listAgents(++agentPage.value); const known = new Set(agents.value.map(x => x.id)); agents.value.push(...r.data.data.filter(x => !known.has(x.id))); agentLastPage.value = r.data.meta.last_page } finally { loadingAgents.value = false } };
const initiate = async () => { if (!customer.value) return; await initiateChat(customer.value, proactiveBody.value, uuid(), initiateFiles.value); initiating.value = false; proactiveBody.value = ""; initiateFiles.value = []; await load() };

const openInitiateFilePicker = () => initiateFilePicker.value?.click();
const selectInitiateFiles = (event: Event) => { const chosen = Array.from((event.target as HTMLInputElement).files || []); initiateFiles.value = chosen.slice(0, 5); (event.target as HTMLInputElement).value = "" };
const removeInitiateFile = (index: number) => { initiateFiles.value = initiateFiles.value.filter((_, current) => current !== index) };

const block = async () => { if (current.value?.customer) { await blockChat(current.value.customer.id, reason.value); blocking.value = false; reason.value = ""; await refresh(false) } };
const unblock = async () => { if (current.value?.customer) { await unblockChat(current.value.customer.id); await refresh(false) } };

const resync = async () => {
  if (current.value) {
    await refresh(false);
  } else {
    await Promise.all([load(), loadGlobalSummary()]);
  }
};

const handlePusherStateChange = (state: string) => {
  pusherConnected.value = state === "connected";
  if (state === "connected") {
    resync();
  }
};

onMounted(async () => {
  await Promise.all([load(), loadGlobalSummary()]);
  const requested = Number(route.query.customer);
  if (can('support_chat.initiate') && Number.isInteger(requested) && requested > 0) {
    const response = await findCustomers('', 1, requested);
    const match = response.data.data[0];
    if (match) {
      customer.value = match.id;
      customers.value = customerItems([match]);
      initiating.value = true;
    }
  }
  if (can('support_chat.assign')) {
    const r = await listAgents();
    agents.value = r.data.data;
    agentLastPage.value = r.data.meta.last_page;
  }
  try {
    pusher = new usePusher("private-support.staff", ".support.chat.updated", (event: any) => refresh(event?.action === 'message' && event?.sender_type === 'user'));
    const pusherInstance = (pusher as any).pusher;
    pusherInstance.connection.bind('state_change', (states: { previous: string; current: string }) => {
      handlePusherStateChange(states.current);
    });
  } catch {}
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resync();
  });
  window.addEventListener("focus", resync);
});

onBeforeUnmount(() => {
  pusher?.unMounted();
  document.removeEventListener("visibilitychange", () => {});
  window.removeEventListener("focus", resync);
});
</script>
<style scoped>.messages{height:440px;overflow:auto;padding:14px 16px;background:linear-gradient(180deg,rgba(248,250,252,.9),rgba(255,255,255,.96))}.bubble{max-width:78%;padding:10px 14px;margin:8px 0;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere;box-shadow:0 1px 2px rgba(16,24,40,.08)}.mine{margin-left:auto;background:rgb(var(--v-theme-primary));color:#fff;border-bottom-right-radius:4px}.theirs{background:#eef2f6;color:#1d2939;border-bottom-left-radius:4px}.bubble p{margin:4px 0}.bubble small{display:block;opacity:.65;font-size:.72rem}.message-attachments{display:grid;gap:3px;margin:4px 0}.attachment-link{justify-content:flex-start;text-transform:none;max-width:100%}.composer{display:grid;gap:8px;padding:12px 14px 14px;border-top:1px solid rgba(71,84,103,.16)}.composer-row{display:flex;align-items:flex-end;gap:6px}.message-input{flex:1}.attach-button,.send-button{width:40px!important;height:40px!important;flex:0 0 40px;border-radius:50%!important}.composer-help{color:#667085;font-size:.72rem}.file-picker{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}.selected-files{display:grid;gap:6px}.file-chip{display:flex;align-items:center;gap:7px;min-width:0;padding:6px 8px;border:1px solid rgba(71,84,103,.18);border-radius:8px;background:#f8fafc}.file-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:.84rem}.file-chip small{color:#667085;white-space:nowrap}.file-chip .v-btn{flex:0 0 auto}@media(max-width:600px){.messages{height:calc(100vh - 300px);min-height:260px;padding:12px}.bubble{max-width:88%}}</style>
