<template>
  <v-container fluid>
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
      <div>
        <h2>Wallets operativas</h2>
        <p class="text-medium-emphasis mb-0">Inventario y umbrales operativos. Este módulo no mueve fondos.</p>
      </div>
      <v-btn v-if="canCreate" color="primary" prepend-icon="mdi-plus" @click="openCreate">Nueva wallet</v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = ''">{{ error }}</v-alert>

    <v-card>
      <v-card-text>
        <div class="d-flex flex-wrap ga-3 mb-4">
          <v-select v-model="filters.currency_id" :items="catalogs.currencies" item-title="name" item-value="id" label="Moneda" clearable density="compact" hide-details style="max-width: 220px" @update:model-value="load" />
          <v-select v-model="filters.red_id" :items="catalogs.networks" item-title="name" item-value="id" label="Red" clearable density="compact" hide-details style="max-width: 220px" @update:model-value="load" />
          <v-select v-model="filters.wallet_type" :items="typeOptions" item-title="title" item-value="value" label="Tipo" clearable density="compact" hide-details style="max-width: 220px" @update:model-value="load" />
          <v-select v-model="filters.status" :items="statusOptions" item-title="title" item-value="value" label="Estado" clearable density="compact" hide-details style="max-width: 220px" @update:model-value="load" />
        </div>

        <v-data-table :headers="headers" :items="wallets" :loading="loading" :items-per-page="-1" hide-default-footer>
          <template #item.identity="{ item }">
            <div class="font-weight-medium">{{ item.currency?.abbreviation || item.currency?.name }}</div>
            <small>{{ item.network?.name || "Sin red" }} · {{ typeLabel(item.wallet_type) }}</small>
          </template>
          <template #item.balances="{ item }">
            <div>Disponible: {{ item.available_balance }}</div>
            <small>Reservado: {{ item.reserved_balance }}</small>
          </template>
          <template #item.alerts="{ item }">
            <v-chip v-if="item.alerts.low_balance" color="warning" size="small" class="mr-1">Saldo bajo</v-chip>
            <v-chip v-if="item.alerts.over_maximum" color="error" size="small">Supera máximo</v-chip>
            <span v-if="!item.alerts.low_balance && !item.alerts.over_maximum">Sin alertas</span>
          </template>
          <template #item.status="{ item }"><v-chip :color="item.status === 'active' ? 'success' : item.status === 'maintenance' ? 'warning' : 'default'" size="small">{{ statusLabel(item.status) }}</v-chip></template>
          <template #item.actions="{ item }"><v-btn v-if="canUpdate" icon="mdi-pencil" size="small" variant="text" @click="openEdit(item)" /></template>
        </v-data-table>

        <div class="d-flex justify-end mt-4">
          <v-pagination v-if="meta.last_page > 1" v-model="meta.current_page" :length="meta.last_page" @update:model-value="load" />
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="800">
      <v-card>
        <v-card-title>{{ editing ? "Editar wallet operativa" : "Nueva wallet operativa" }}</v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">La identidad proveedor/moneda/red/tipo queda fija después de crear la wallet.</v-alert>
          <v-row>
            <v-col cols="12" md="6"><v-text-field v-model="form.provider" label="Proveedor" :disabled="Boolean(editing)" /></v-col>
            <v-col cols="12" md="6"><v-select v-model="form.currency_id" :items="catalogs.currencies" item-title="name" item-value="id" label="Moneda" :disabled="Boolean(editing)" /></v-col>
            <v-col cols="12" md="6"><v-select v-model="form.red_id" :items="catalogs.networks" item-title="name" item-value="id" label="Red" :disabled="Boolean(editing)" /></v-col>
            <v-col cols="12" md="6"><v-select v-model="form.wallet_type" :items="typeOptions" item-title="title" item-value="value" label="Tipo" :disabled="Boolean(editing)" /></v-col>
            <v-col cols="12"><v-text-field v-model="form.external_reference" label="Referencia/dirección externa" hint="Se almacena cifrada y se devuelve enmascarada" persistent-hint /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.available_balance" label="Saldo disponible" inputmode="decimal" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.reserved_balance" label="Saldo reservado" inputmode="decimal" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.minimum_alert_balance" label="Mínimo de alerta" inputmode="decimal" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.maximum_allowed_balance" label="Máximo permitido" inputmode="decimal" /></v-col>
            <v-col cols="12" md="6"><v-select v-model="form.status" :items="statusOptions" item-title="title" item-value="value" label="Estado" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.last_synced_at" type="datetime-local" label="Última sincronización" /></v-col>
            <v-col cols="12"><v-textarea v-model="form.notes" label="Notas" rows="2" /></v-col>
            <v-col cols="12"><v-textarea v-model="form.reason" label="Motivo administrativo" rows="2" /></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn @click="dialog = false">Cancelar</v-btn><v-btn color="primary" :loading="saving" @click="requestSave">Guardar</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { apiClient } from "@/services/apiClient";
import { UserStore } from "@/stores/UserStore";
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

interface CatalogItem { id: number; name: string; abbreviation?: string }
interface WalletItem {
  public_reference: string; provider: string; currency_id: number; red_id: number; wallet_type: string;
  currency?: CatalogItem; network?: CatalogItem | null; available_balance: string; reserved_balance: string;
  minimum_alert_balance: string | null; maximum_allowed_balance: string | null; status: string;
  last_synced_at: string | null; updated_at?: string | null; notes: string | null; alerts: { low_balance: boolean; over_maximum: boolean };
}
interface IndexResponse {
  data: WalletItem[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  catalogs: { currencies: CatalogItem[]; networks: CatalogItem[]; wallet_types: string[]; statuses: string[] };
}

const userStore = UserStore();
const { runWithTwoFactor } = useTwoFactorGuard();
const canCreate = computed(() => userStore.hasPermission("operational-wallets.store"));
const canUpdate = computed(() => userStore.hasPermission("operational-wallets.updated"));
const loading = ref(false); const saving = ref(false); const error = ref(""); const dialog = ref(false); const editing = ref<WalletItem | null>(null);
const wallets = ref<WalletItem[]>([]);
const catalogs = reactive({ currencies: [] as CatalogItem[], networks: [] as CatalogItem[], wallet_types: [] as string[], statuses: [] as string[] });
const meta = reactive({ current_page: 1, last_page: 1, per_page: 25, total: 0 });
const filters = reactive<{ currency_id: number | null; red_id: number | null; wallet_type: string | null; status: string | null }>({ currency_id: null, red_id: null, wallet_type: null, status: null });
const blank = () => ({ provider: "manual", currency_id: null as number | null, red_id: null as number | null, wallet_type: "hot", external_reference: "", available_balance: "0", reserved_balance: "0", minimum_alert_balance: "", maximum_allowed_balance: "", status: "inactive", last_synced_at: "", notes: "", reason: "" });
const form = reactive(blank());
const typeOptions = computed(() => catalogs.wallet_types.map((value) => ({ value, title: typeLabel(value) })));
const statusOptions = computed(() => catalogs.statuses.map((value) => ({ value, title: statusLabel(value) })));
const headers = [
  { title: "Wallet", key: "identity" }, { title: "Proveedor", key: "provider" }, { title: "Saldos", key: "balances" },
  { title: "Alertas", key: "alerts" }, { title: "Estado", key: "status" }, { title: "Actualizada", key: "updated_at" }, { title: "", key: "actions", sortable: false },
];

const typeLabel = (value: string) => ({ hot: "Caliente", treasury: "Tesorería", manual: "Externa/manual", cold: "Fría/respaldo" }[value] ?? value);
const statusLabel = (value: string) => ({ active: "Activa", inactive: "Inactiva", maintenance: "Mantenimiento" }[value] ?? value);
const apiMessage = (caught: any) => caught?.response?.data?.message ?? caught?.message ?? "No fue posible completar la operación.";

const load = async () => {
  loading.value = true; error.value = "";
  try {
    const params = Object.fromEntries(Object.entries({ ...filters, page: meta.current_page, per_page: meta.per_page }).filter(([, value]) => value !== null && value !== ""));
    const response = await apiClient.get<IndexResponse>("/admin/operational-wallets", { params });
    wallets.value = response.data.data;
    Object.assign(meta, response.data.meta);
    Object.assign(catalogs, response.data.catalogs);
  } catch (caught) { error.value = apiMessage(caught); }
  finally { loading.value = false; }
};
const resetForm = () => Object.assign(form, blank());
const openCreate = () => { editing.value = null; resetForm(); dialog.value = true; };
const openEdit = (item: WalletItem) => {
  editing.value = item; resetForm();
  Object.assign(form, { provider: item.provider, currency_id: item.currency_id, red_id: item.red_id, wallet_type: item.wallet_type, available_balance: item.available_balance, reserved_balance: item.reserved_balance, minimum_alert_balance: item.minimum_alert_balance ?? "", maximum_allowed_balance: item.maximum_allowed_balance ?? "", status: item.status, last_synced_at: item.last_synced_at?.slice(0, 16) ?? "", notes: item.notes ?? "" });
  dialog.value = true;
};
const nullable = (value: string) => value.trim() === "" ? null : value.trim();
const save = async () => {
  if (!form.reason.trim()) { error.value = "Debes indicar el motivo administrativo."; return; }
  saving.value = true; error.value = "";
  if (!editing.value && (!form.currency_id || !form.red_id)) { error.value = "Debes seleccionar moneda y red."; return; }
  const mutable: Record<string, unknown> = { available_balance: form.available_balance, reserved_balance: form.reserved_balance, minimum_alert_balance: nullable(form.minimum_alert_balance), maximum_allowed_balance: nullable(form.maximum_allowed_balance), status: form.status, last_synced_at: nullable(form.last_synced_at), notes: nullable(form.notes), reason: form.reason.trim() };
  const reference = nullable(form.external_reference);
  if (!editing.value || reference !== null) mutable.external_reference = reference;
  try {
    if (editing.value) await apiClient.put(`/admin/operational-wallets/${editing.value.public_reference}`, mutable, { financialScope: "finance.financial_configuration" });
    else await apiClient.post("/admin/operational-wallets", { ...mutable, provider: form.provider.trim(), currency_id: form.currency_id, red_id: form.red_id, wallet_type: form.wallet_type }, { financialScope: "finance.financial_configuration" });
    dialog.value = false; await load();
  } catch (caught) { error.value = apiMessage(caught); }
  finally { saving.value = false; }
};
const requestSave = () => runWithTwoFactor(save, "finance.financial_configuration");

onMounted(load);
</script>
