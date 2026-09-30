<template>
  <div>
    <div class="d-flex flex-wrap justify-space-between align-center ga-3 mb-4">
      <h3 class="text-primary">Resumen administrativo</h3>
      <VBtn variant="outlined" :loading="loading" @click="load">Actualizar</VBtn>
    </div>

    <VAlert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</VAlert>
    <VSkeletonLoader v-if="loading && !summary" type="article, table" />

    <template v-if="summary">
      <VRow>
        <VCol cols="12" sm="6" md="3"><VCard><VCardText><div class="text-caption">Comprado</div><strong>{{ money(summary.orders.bought_cop) }}</strong></VCardText></VCard></VCol>
        <VCol cols="12" sm="6" md="3"><VCard><VCardText><div class="text-caption">Vendido</div><strong>{{ money(summary.orders.sold_cop) }}</strong></VCardText></VCard></VCol>
        <VCol cols="12" sm="6" md="3"><VCard><VCardText><div class="text-caption">Promedio</div><strong>{{ money(summary.orders.average_cop) }}</strong></VCardText></VCard></VCol>
        <VCol cols="12" sm="6" md="3"><VCard><VCardText><div class="text-caption">Saldo XCOP</div><strong>{{ money(summary.user.xcop_balance) }}</strong></VCardText></VCard></VCol>
      </VRow>

      <VCard class="mt-4">
        <VCardTitle class="d-flex flex-wrap align-center justify-space-between ga-2">
          <span>Estado de la cuenta</span>
          <VChip :color="statusColor(summary.user.administrative_status)">{{ statusLabel(summary.user.administrative_status) }}</VChip>
        </VCardTitle>
        <VCardText>
          <p v-if="summary.user.administrative_status_reason"><strong>Motivo interno:</strong> {{ summary.user.administrative_status_reason }}</p>
          <p><strong>Roles:</strong> {{ summary.user.roles.join(", ") || "Sin rol" }}</p>
          <p><strong>KYC:</strong> {{ statusLabel(summary.user.kyc_status) }}</p>
          <p><strong>Correo:</strong> {{ summary.user.email }} · {{ summary.user.email_verified_at ? "Verificado" : "No verificado" }}</p>
          <p><strong>Teléfono:</strong> {{ summary.user.phone }} · {{ summary.user.phone_verified_at ? "Verificado" : "No verificado" }}</p>
          <div class="d-flex flex-wrap ga-2 mt-3">
            <VBtn v-if="canStatus" color="warning" variant="outlined" @click="openStatus">Cambiar estado</VBtn>
            <VBtn v-if="canReset" variant="outlined" @click="openReset('email')">Reiniciar correo</VBtn>
            <VBtn v-if="canReset" variant="outlined" @click="openReset('phone')">Reiniciar teléfono</VBtn>
            <VBtn v-if="canResend" variant="outlined" @click="openResend('email')">Reenviar correo</VBtn>
            <VBtn v-if="canResend" variant="outlined" @click="openResend('phone')">Reenviar teléfono</VBtn>
          </div>
        </VCardText>
      </VCard>

      <VRow class="mt-1">
        <VCol cols="12" md="6">
          <VCard height="100%"><VCardTitle>Última conexión</VCardTitle><VCardText v-if="summary.user.last_connection">
            <div>{{ summary.user.last_connection.created_at || "Sin fecha" }}</div>
            <div>{{ summary.user.last_connection.ip || "Sin IP" }}</div>
            <div>{{ summary.user.last_connection.device || "Sin dispositivo" }} · {{ summary.user.last_connection.browser || "Sin navegador" }}</div>
            <div>{{ summary.user.last_connection.city || "" }} {{ summary.user.last_connection.country || "" }}</div>
          </VCardText><VCardText v-else>Sin conexiones registradas.</VCardText></VCard>
        </VCol>
        <VCol cols="12" md="6"><VCard height="100%"><VCardTitle>Totales</VCardTitle><VCardText>
          <div>Órdenes: {{ summary.orders.count }}</div><div>Wallets: {{ summary.wallets.length }}</div><div>Cuentas: {{ summary.accounts.length }}</div><div>Empresas: {{ summary.companies.length }}</div>
        </VCardText></VCard></VCol>
      </VRow>

      <VCard class="mt-4"><VCardTitle>Wallets</VCardTitle><VTable density="compact"><thead><tr><th>Alias</th><th>Moneda</th><th>Dirección</th><th>Favorita</th></tr></thead><tbody><tr v-for="item in summary.wallets" :key="item.id"><td>{{ item.alias || "-" }}</td><td>{{ item.currency || "-" }}</td><td class="text-truncate" style="max-width: 360px">{{ item.address }}</td><td>{{ item.favorite ? "Sí" : "No" }}</td></tr><tr v-if="summary.wallets.length === 0"><td colspan="4">Sin wallets.</td></tr></tbody></VTable></VCard>
      <VCard class="mt-4"><VCardTitle>Cuentas de pago</VCardTitle><VTable density="compact"><thead><tr><th>Nombre</th><th>Banco</th><th>Cuenta</th><th>Moneda</th></tr></thead><tbody><tr v-for="item in summary.accounts" :key="item.id"><td>{{ item.name || "-" }}</td><td>{{ item.bank || "-" }}</td><td>{{ item.account_number || "-" }}</td><td>{{ item.currency || "-" }}</td></tr><tr v-if="summary.accounts.length === 0"><td colspan="4">Sin cuentas.</td></tr></tbody></VTable></VCard>
      <VCard class="mt-4"><VCardTitle>Empresas</VCardTitle><VTable density="compact"><thead><tr><th>Empresa</th><th>Identificación</th><th>Estado</th><th>KYB</th></tr></thead><tbody><tr v-for="item in summary.companies" :key="item.id"><td>{{ item.legal_name }}</td><td>{{ item.tax_id || "-" }}</td><td>{{ statusLabel(item.workflow_status) }}</td><td>{{ statusLabel(item.kyb_status) }}</td></tr><tr v-if="summary.companies.length === 0"><td colspan="4">Sin empresas.</td></tr></tbody></VTable></VCard>
    </template>

    <VDialog v-model="dialog" max-width="560">
      <VCard>
        <VCardTitle>{{ dialogTitle }}</VCardTitle>
        <VCardText>
          <VSelect v-if="action === 'status'" v-model="form.status" :items="statusOptions" item-title="title" item-value="value" label="Nuevo estado" />
          <VSelect v-if="action === 'resend' && form.kind === 'phone'" v-model="form.channel" :items="[{ title: 'SMS', value: 'sms' }, { title: 'WhatsApp', value: 'whatsapp' }]" item-title="title" item-value="value" label="Canal" />
          <VTextarea v-if="action !== 'resend'" v-model="form.reason" label="Motivo administrativo" rows="3" />
          <VAlert type="warning" variant="tonal">La acción quedará registrada en auditoría.</VAlert>
        </VCardText>
        <VCardActions><VSpacer /><VBtn @click="dialog = false">Cancelar</VBtn><VBtn color="primary" :loading="saving" @click="confirmAction">Confirmar</VBtn></VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { User } from "@/interfaces/User/User.model";
import { apiClient } from "@/services/apiClient";
import { UserStore } from "@/stores/UserStore";
import { statusLabel } from "@/utils/statusLabels";
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const props = defineProps<{ user: User }>();
const store = UserStore();
const { runWithTwoFactor } = useTwoFactorGuard();
const canStatus = computed(() => store.hasPermission("users.status"));
const canReset = computed(() => store.hasPermission("users.reset-verification"));
const canResend = computed(() => store.hasPermission("users.resend-verification"));
const loading = ref(false); const saving = ref(false); const error = ref(""); const summary = ref<any>(null); const dialog = ref(false); const action = ref<"status" | "reset" | "resend">("status");
const form = reactive({ status: "active", kind: "email", channel: "sms", reason: "" });
const statusOptions = [{ title: "Activa", value: "active" }, { title: "Suspendida", value: "suspended" }, { title: "Bloqueada", value: "blocked" }];
const dialogTitle = computed(() => action.value === "status" ? "Cambiar estado administrativo" : action.value === "reset" ? `Reiniciar verificación de ${form.kind}` : `Reenviar verificación de ${form.kind}`);
const statusColor = (value: string) => value === "active" ? "success" : value === "suspended" ? "warning" : "error";
const money = (value: string) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 2 }).format(Number(value || 0));
const message = (caught: any) => caught?.response?.data?.message ?? caught?.message ?? "No fue posible completar la acción.";

const load = async () => { loading.value = true; error.value = ""; try { summary.value = (await apiClient.get<any>(`/admin/users/${props.user.id}/summary`)).data.data; } catch (caught) { error.value = message(caught); } finally { loading.value = false; } };
const openStatus = () => { action.value = "status"; form.status = summary.value?.user?.administrative_status ?? "active"; form.reason = ""; dialog.value = true; };
const openReset = (kind: "email" | "phone") => { action.value = "reset"; form.kind = kind; form.reason = ""; dialog.value = true; };
const openResend = (kind: "email" | "phone") => { action.value = "resend"; form.kind = kind; form.channel = kind === "email" ? "email" : "sms"; form.reason = ""; dialog.value = true; };
const submit = async () => {
  if (action.value !== "resend" && form.reason.trim().length < 5) { error.value = "El motivo debe tener al menos 5 caracteres."; return; }
  saving.value = true; error.value = "";
  try {
    if (action.value === "status") await apiClient.patch(`/admin/users/${props.user.id}/administrative-status`, { status: form.status, reason: form.reason.trim() }, { idempotent: true, financialScope: "admin.security" });
    else if (action.value === "reset") await apiClient.post(`/admin/users/${props.user.id}/reset-verification`, { kind: form.kind, reason: form.reason.trim() }, { financialScope: "admin.security" });
    else await apiClient.post(`/admin/users/${props.user.id}/resend-verification`, { kind: form.kind, channel: form.channel });
    dialog.value = false; await load();
  } catch (caught) { error.value = message(caught); }
  finally { saving.value = false; }
};
const confirmAction = async () => action.value === "resend" ? submit() : runWithTwoFactor(submit, "admin.security");

onMounted(load);
</script>
