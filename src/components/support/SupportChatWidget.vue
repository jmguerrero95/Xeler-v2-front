<template>
  <div class="support-chat" data-test="support-chat-widget">
    <VCard v-if="open" class="support-panel" elevation="0" data-test="support-chat-panel">
      <VCardTitle class="chat-header d-flex align-center"><div class="header-copy"><span>Soporte</span><small>{{ conversation?.status_label || 'Estamos para ayudarte' }}</small></div><VSpacer/><VBtn class="header-action" icon="mdi-volume-high" variant="text" :aria-label="sound?'Desactivar sonido':'Activar sonido'" @click="toggleSound"/><VBtn class="header-action" icon="mdi-minus" variant="text" aria-label="Contraer chat" @click="open=false"/></VCardTitle>
      <VDivider/>
      <VCardText ref="scrollBox" class="messages" @scroll="onScroll">
        <VBtn v-if="nextCursor" size="small" variant="text" @click="older">Cargar mensajes anteriores</VBtn>
        <div v-if="!messages.length" class="empty"><VIcon icon="mdi-message-text-outline" size="32"/><p>Escríbenos. El equipo de soporte responderá aquí.</p></div>
        <div v-for="message in messages" :key="message.id" class="bubble" :class="message.sender==='user'?'mine':'theirs'"><strong>{{ message.sender==='user'?'Tú':'Soporte' }}</strong><p v-if="message.body">{{ message.body }}</p><div v-if="message.attachments?.length" class="message-attachments"><VBtn v-for="file in message.attachments" :key="file.reference" class="attachment-link" size="small" variant="text" @click="download(file)"><VIcon start icon="mdi-paperclip"/>{{ file.name }}</VBtn></div><small>{{ format(message.created_at) }}</small></div>
        <VBtn v-if="newBelow" class="new-message" size="small" @click="bottom">Nuevo mensaje</VBtn>
      </VCardText>
      <VAlert v-if="blocked" type="warning" variant="tonal" class="mx-3 mb-2">Tu acceso al chat de soporte está restringido.</VAlert>
      <VAlert v-if="error" type="error" variant="tonal" class="mx-3 mb-2">{{ error }} <VBtn variant="text" @click="retry">Reintentar</VBtn></VAlert>
      <VCardActions v-if="!blocked" class="composer" data-test="support-chat-composer">
        <input ref="filePicker" class="file-picker" data-test="support-file-picker" type="file" multiple :accept="allowed" :disabled="sending" aria-label="Seleccionar archivos para adjuntar" @change="selectFiles"/>
        <div v-if="files.length" class="selected-files" data-test="selected-files"><div v-for="(file,index) in files" :key="`${file.name}-${file.size}-${index}`" class="file-chip"><VIcon icon="mdi-file-outline"/><span :title="file.name">{{ file.name }}</span><small>{{ fileSize(file.size) }}</small><VBtn icon="mdi-close" density="compact" variant="text" :aria-label="`Quitar ${file.name}`" @click="removeFile(index)"/></div></div>
        <div class="composer-row"><VBtn class="attach-button" icon="mdi-paperclip" variant="text" aria-label="Adjuntar archivo" :disabled="sending" @click="openFilePicker"/><VTextarea v-model="body" class="message-input" rows="2" auto-grow hide-details placeholder="Escribe un mensaje" maxlength="4000" :disabled="sending" @keydown.enter.exact.prevent="submit"/><VBtn class="send-button" icon="mdi-send" color="primary" aria-label="Enviar mensaje" :loading="sending" :disabled="!canSend" @click="submit"/></div>
        <small class="composer-help">Puedes enviar un mensaje, un archivo o ambos.</small>
      </VCardActions>
    </VCard>
    <VTooltip :text="open ? 'Cerrar soporte' : 'Soporte'" location="start"><template #activator="{ props }"><VBtn v-bind="props" class="launcher" color="primary" icon size="large" :aria-label="open ? 'Cerrar soporte' : 'Abrir soporte'" @click="activate"><VBadge v-if="unread" color="error" :content="unread>99?'99+':unread"><VIcon>{{ open ? 'mdi-close' : 'mdi-chat-processing' }}</VIcon></VBadge><VIcon v-else>{{ open ? 'mdi-close' : 'mdi-chat-processing' }}</VIcon></VBtn></template></VTooltip>
    <VSnackbar v-model="notice" timeout="4500">Tienes un nuevo mensaje de soporte</VSnackbar>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import usePusher from "@/pusher";
import { UserStore } from "@/stores/UserStore";
import { chatMessages, chatSummary, readChat, sendChat, uuid, type ChatConversation, type ChatMessage } from "@/services/supportChatApi";
import { downloadAuthenticatedBlob } from "@/services/apiClient";
import { useSupportChatSound } from "@/composables/useSupportChatSound";

const store = UserStore();
const { playNotification, toggleSound, isSoundEnabled, unlock } = useSupportChatSound();

const open = ref(false);
const conversation = ref<ChatConversation | null>(null);
const blockedWithoutConversation = ref(false);
const messages = ref<ChatMessage[]>([]);
const body = ref("");
const files = ref<File[]>([]);
const sending = ref(false);
const error = ref("");
const retryId = ref("");
const nextCursor = ref<string>();
const newBelow = ref(false);
const notice = ref(false);
const scrollBox = ref<HTMLElement>();
const filePicker = ref<HTMLInputElement>();
const pusherConnected = ref(false);
let pusher: ReturnType<typeof usePusher> | undefined;

const blocked = computed(() => conversation.value?.blocked ?? blockedWithoutConversation.value);
const unread = computed(() => conversation.value?.unread ?? 0);
const allowed = ".jpg,.jpeg,.png,.webp,.pdf,.txt,.csv,.docx,.xlsx";
const canSend = computed(() => !sending.value && (body.value.trim().length > 0 || files.value.length > 0) && files.value.length <= 5);

const download = (file: any) => downloadAuthenticatedBlob(file.download_url, file.name);
const format = (v: string) => new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(new Date(v));
const fileSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const openFilePicker = () => filePicker.value?.click();
const selectFiles = (event: Event) => {
  const chosen = Array.from((event.target as HTMLInputElement).files || []);
  if (chosen.length > 5) {
    error.value = "Puedes adjuntar máximo 5 archivos.";
    files.value = chosen.slice(0, 5);
  } else files.value = chosen;
  (event.target as HTMLInputElement).value = "";
};
const removeFile = (index: number) => { files.value = files.value.filter((_, current) => current !== index) };

const mergeMessages = (incoming: ChatMessage[]) => {
  const all = new Map(messages.value.map(m => [m.id, m]));
  incoming.forEach(m => all.set(m.id, m));
  messages.value = [...all.values()].sort((a, b) => a.id - b.id);
};

const load = async (scrollToBottom = true, preserve = false) => {
  const previousReference = conversation.value?.reference;
  const s = await chatSummary();
  conversation.value = s.data.data;
  blockedWithoutConversation.value = s.data.blocked;
  if (conversation.value) {
    const r = await chatMessages(conversation.value.reference);
    if (preserve && previousReference === conversation.value.reference) mergeMessages(r.data.data);
    else messages.value = r.data.data;
    nextCursor.value = r.data.meta?.next_cursor;
  } else messages.value = [];
  await nextTick();
  if (scrollToBottom) bottom();
};

const refresh = async (incoming = false) => {
  const previous = new Set(messages.value.map(m => m.id));
  const wasNearBottom = isNearBottom();
  await load(false, true);
  const fresh = messages.value.some(m => !previous.has(m.id) && m.sender === 'agent');
  if (incoming && fresh) {
    notice.value = !open.value;
    playNotification();
    if (open.value && wasNearBottom) {
      bottom();
      await markRead();
    } else if (open.value) newBelow.value = true;
  }
};

const activate = async () => {
  open.value = !open.value;
  unlock();
  if (open.value) {
    await load();
    await markRead();
  }
};

const markRead = async () => {
  if (conversation.value) {
    await readChat(conversation.value.reference);
    conversation.value.unread = 0;
  }
};

const submit = async () => {
  if (!canSend.value) return;
  sending.value = true;
  error.value = "";
  retryId.value ||= uuid();
  try {
    await sendChat(conversation.value?.reference, body.value, retryId.value, files.value);
    body.value = "";
    files.value = [];
    retryId.value = "";
    await load();
  } catch {
    error.value = "No se pudo enviar.";
  } finally {
    sending.value = false;
  }
};
const retry = () => submit();

const older = async () => {
  if (!conversation.value || !nextCursor.value) return;
  const el = scrollBox.value;
  const old = el?.scrollHeight || 0;
  const r = await chatMessages(conversation.value.reference, false, nextCursor.value);
  messages.value = [...r.data.data.filter(x => !messages.value.some(m => m.id === x.id)), ...messages.value];
  nextCursor.value = r.data.meta.next_cursor;
  await nextTick();
  if (el) el.scrollTop = el.scrollHeight - old;
};

const isNearBottom = () => {
  const el = scrollBox.value;
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80;
};

const bottom = () => {
  const el = scrollBox.value;
  if (el) el.scrollTop = el.scrollHeight;
  newBelow.value = false;
};

const onScroll = () => {
  if (isNearBottom()) newBelow.value = false;
};

const resync = async () => {
  const wasOpen = open.value;
  if (wasOpen) {
    await load(false, true);
    await markRead();
  } else {
    await load();
  }
};

const handlePusherStateChange = (state: string) => {
  pusherConnected.value = state === "connected";
  if (state === "connected") {
    resync();
  }
};

onMounted(async () => {
  await load();
  const id = (store.authUser as any)?.id;
  if (id) {
    try {
      pusher = new usePusher(`private-support.user.${id}`, ".support.chat.updated", (event: any) => refresh(event?.action === 'message' && event?.sender_type === 'agent'));
      const pusherInstance = (pusher as any).pusher;
      pusherInstance.connection.bind('state_change', (states: { previous: string; current: string }) => {
        handlePusherStateChange(states.current);
      });
    } catch {}
  }
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
<style scoped>
.support-chat{position:fixed;right:24px;bottom:max(24px,env(safe-area-inset-bottom));z-index:1200}.launcher{float:right;width:56px!important;height:56px!important;border-radius:50%!important;box-shadow:0 8px 24px rgba(59,40,120,.3);transition:transform .18s ease,box-shadow .18s ease}.launcher:hover,.launcher:focus-visible{transform:translateY(-2px);box-shadow:0 12px 28px rgba(59,40,120,.38)}.support-panel{width:min(400px,calc(100vw - 24px));height:min(620px,calc(100vh - 90px));display:flex;flex-direction:column;margin-bottom:14px;overflow:hidden;border:1px solid rgba(71,84,103,.18);border-radius:14px!important;box-shadow:0 18px 42px rgba(16,24,40,.22)!important;background:rgb(var(--v-theme-surface))}.chat-header{min-height:68px;padding:12px 14px}.header-copy{display:grid;line-height:1.2}.header-copy small{font-size:.78rem;font-weight:400;color:rgb(var(--v-theme-on-surface-variant))}.header-action{min-width:36px!important;min-height:36px!important;border-radius:50%!important}.messages{overflow:auto;flex:1;padding:14px 16px;background:linear-gradient(180deg,rgba(248,250,252,.9),rgba(255,255,255,.96))}.bubble{max-width:82%;padding:10px 12px;margin:9px 0;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere;box-shadow:0 1px 2px rgba(16,24,40,.08)}.bubble p{margin:4px 0}.bubble small{display:block;opacity:.7;font-size:.72rem}.mine{margin-left:auto;background:rgb(var(--v-theme-primary));color:white;border-bottom-right-radius:4px}.theirs{background:#eef2f6;color:#1d2939;border-bottom-left-radius:4px}.message-attachments{display:grid;gap:3px;margin:4px 0}.attachment-link{justify-content:flex-start;text-transform:none;max-width:100%}.composer{display:grid;gap:8px;padding:12px 14px 14px;background:rgb(var(--v-theme-surface));border-top:1px solid rgba(71,84,103,.16)}.composer-row{display:flex;align-items:flex-end;gap:6px}.message-input{flex:1}.attach-button,.send-button{width:40px!important;height:40px!important;flex:0 0 40px;border-radius:50%!important}.composer-help{color:#667085;font-size:.72rem}.file-picker{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}.selected-files{display:grid;gap:6px}.file-chip{display:flex;align-items:center;gap:7px;min-width:0;padding:6px 8px;border:1px solid rgba(71,84,103,.18);border-radius:8px;background:#f8fafc}.file-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:.84rem}.file-chip small{color:#667085;white-space:nowrap}.file-chip .v-btn{flex:0 0 auto}.empty{text-align:center;color:#667085;padding:42px 20px}.empty p{margin:8px 0 0}.new-message{position:sticky;bottom:4px;left:50%;transform:translateX(-50%)}@media(max-width:600px){.support-chat{right:10px;bottom:max(72px,env(safe-area-inset-bottom))}.support-panel{width:calc(100vw - 20px);height:calc(100vh - 150px);max-height:620px}.messages{padding:12px}.chat-header{min-height:62px}.bubble{max-width:88%}}
</style>
