<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import { INTERNATIONAL_ACCOUNTS } from "@/enums/Permissions.enum";
import type {
  AdminInternationalAccount,
  AdminInternationalAccountDeposit,
  InternationalAccountFakeDepositScenario,
  InternationalAccountOperationsSummary,
} from "@/interfaces/InternationalAccounts/InternationalAccounts.model";
import type { NormalizedApiError } from "@/services/apiErrors";
import {
  createFakeInternationalAccountDeposit,
  getAdminInternationalAccountDeposits,
  getAdminInternationalFiatAccounts,
  reconcileInternationalProviderWallet,
  syncAdminInternationalFiatAccount,
  transitionAdminInternationalFiatAccount,
} from "@/services/internationalAccountsApi";

type AccountAction = "sync" | "deactivate" | "reactivate" | "reconcile";

const helper = helperStore();
const userStore = UserStore();
const router = useRouter();
const tab = ref("summary");
const loading = ref(false);
const accounts = ref<AdminInternationalAccount[]>([]);
const deposits = ref<AdminInternationalAccountDeposit[]>([]);
const summary = ref<InternationalAccountOperationsSummary>({
  active_usd: 0,
  active_eur: 0,
  deposits_received: 0,
  deposits_processing: 0,
  deposits_completed: 0,
  deposits_incident: 0,
  open_reconciliations: 0,
});
const actionDialog = reactive({
  open: false,
  account: null as AdminInternationalAccount | null,
  action: "sync" as AccountAction,
  reason: "",
  loading: false,
});
const fakeDialog = reactive({
  open: false,
  account: null as AdminInternationalAccount | null,
  amount: "",
  scenario: "funds_received" as InternationalAccountFakeDepositScenario,
  reason: "",
  loading: false,
});

const canView = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.ACCOUNTS_VIEW),
);
const canManage = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.ACCOUNTS_MANAGE),
);
const canSync = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.ACCOUNTS_SYNC),
);
const canViewDeposits = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.DEPOSITS_VIEW),
);
const canSimulate = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.PROVIDER_SIMULATE),
);
const canReconcile = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.RECONCILIATION_RUN),
);
const canViewReconciliations = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.RECONCILIATION_VIEW),
);

const fakeScenarios: Array<{
  title: string;
  value: InternationalAccountFakeDepositScenario;
}> = [
  { title: "Fondos recibidos", value: "funds_received" },
  { title: "En revisi\u00f3n", value: "in_review" },
  { title: "Liquidaci\u00f3n enviada", value: "payment_submitted" },
  { title: "Liquidaci\u00f3n completada", value: "payment_processed" },
  { title: "Flujo completo", value: "complete" },
  { title: "Reembolso en curso", value: "refund_in_flight" },
  { title: "Reembolsado", value: "refunded" },
  { title: "Error de reembolso", value: "refund_failed" },
  { title: "Microdep\u00f3sito no financiero", value: "microdeposit" },
];

const errorMessage = (caught: unknown, fallback: string): string =>
  (caught as NormalizedApiError)?.message ?? fallback;

const load = async () => {
  if (!canView.value) return;
  try {
    loading.value = true;
    const accountResponse = await getAdminInternationalFiatAccounts({
      per_page: 100,
    });
    accounts.value = accountResponse.data.data;
    summary.value = accountResponse.data.meta.summary ?? summary.value;

    if (canViewDeposits.value) {
      const depositResponse = await getAdminInternationalAccountDeposits({
        per_page: 100,
      });
      deposits.value = depositResponse.data.data;
    }
  } catch (caught: unknown) {
    helper.showNotify(
      errorMessage(
        caught,
        "No fue posible cargar la operaci\u00f3n de cuentas.",
      ),
      { type: "error" },
    );
  } finally {
    loading.value = false;
  }
};

const openAction = (
  account: AdminInternationalAccount,
  action: AccountAction,
) => {
  actionDialog.account = account;
  actionDialog.action = action;
  actionDialog.reason = "";
  actionDialog.open = true;
};

const executeAction = async () => {
  const account = actionDialog.account;
  const reason = actionDialog.reason.trim();
  if (!account || reason.length < 3) return;
  try {
    actionDialog.loading = true;
    if (actionDialog.action === "sync") {
      await authorizeWithTwoFactor(syncAdminInternationalFiatAccount.bind(undefined, account.id, reason), "finance.international_accounts");
    } else if (actionDialog.action === "reconcile") {
      await authorizeWithTwoFactor(reconcileInternationalProviderWallet.bind(undefined, account.wallet_id, reason), "finance.international_accounts");
    } else {
      await authorizeWithTwoFactor(transitionAdminInternationalFiatAccount.bind(undefined, account.id, actionDialog.action, reason), "finance.international_accounts");
    }
    actionDialog.open = false;
    helper.showNotify("Operaci\u00f3n aplicada correctamente.");
    await load();
  } catch (caught: unknown) {
    helper.showNotify(
      errorMessage(caught, "No fue posible aplicar la operaci\u00f3n."),
      { type: "error" },
    );
  } finally {
    actionDialog.loading = false;
  }
};

const openFakeDeposit = (account: AdminInternationalAccount) => {
  fakeDialog.account = account;
  fakeDialog.amount = "";
  fakeDialog.scenario = "funds_received";
  fakeDialog.reason = "";
  fakeDialog.open = true;
};

const createFakeDeposit = async () => {
  const account = fakeDialog.account;
  if (
    !account ||
    !/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(fakeDialog.amount) ||
    fakeDialog.reason.trim().length < 3
  )
    return;
  try {
    fakeDialog.loading = true;
    await authorizeWithTwoFactor(createFakeInternationalAccountDeposit.bind(undefined, account.id, {
      amount: fakeDialog.amount,
      scenario: fakeDialog.scenario,
      reason: fakeDialog.reason.trim(),
    }), "finance.international_accounts");
    fakeDialog.open = false;
    helper.showNotify("Escenario fake registrado.");
    await load();
  } catch (caught: unknown) {
    helper.showNotify(
      errorMessage(caught, "No fue posible crear el escenario fake."),
      { type: "error" },
    );
  } finally {
    fakeDialog.loading = false;
  }
};

const actionTitle = computed(
  () =>
    ({
      sync: "Sincronizar cuenta",
      deactivate: "Desactivar cuenta",
      reactivate: "Reactivar cuenta",
      reconcile: "Reconciliar billetera",
    })[actionDialog.action],
);

const dateLabel = (value?: string | null): string =>
  value ? new Date(value).toLocaleString() : "-";
const accountStatusLabels: Record<string, string> = {
  activated: "Activa",
  deactivated: "Desactivada",
};
const depositStatusLabels: Record<string, string> = {
  funds_scheduled: "Transferencia en camino",
  funds_received: "Fondos recibidos",
  in_review: "En revisi\u00f3n",
  payment_submitted: "Liquidaci\u00f3n enviada",
  payment_processed: "Completado",
  refund_in_flight: "Reembolso en proceso",
  refunded: "Reembolsado",
  refund_failed: "Error en el reembolso",
};
const reconciliationStatusLabels: Record<string, string> = {
  match: "Sin diferencia",
  mismatch: "Diferencia abierta",
  ignored: "Ignorada",
  fixed: "Resuelta",
};
const accountStatusLabel = (status: string): string =>
  accountStatusLabels[status] ?? "Estado pendiente";
const depositStatusLabel = (status: string): string =>
  depositStatusLabels[status] ?? "Actualizaci\u00f3n del proveedor";
const reconciliationStatusLabel = (status?: string | null): string =>
  reconciliationStatusLabels[status ?? ""] ?? "Sin ejecutar";
const maskedDetails = (account: AdminInternationalAccount): string => {
  const details = account.deposit_instructions_masked;
  const accountLast4 = details.account_last4 ?? details.iban_last4;
  const routingLast4 = details.routing_last4;
  return (
    [
      typeof accountLast4 === "string" ? `Cuenta ****${accountLast4}` : null,
      typeof routingLast4 === "string"
        ? `Ruta bancaria ••••${routingLast4}`
        : null,
    ]
      .filter((value): value is string => value !== null)
      .join(" / ") || "Sin datos enmascarados"
  );
};

onMounted(load);
</script>

<template>
  <VCard v-if="canView" rounded="lg" class="mb-6">
    <VCardTitle
      class="d-flex flex-wrap align-center justify-space-between ga-3"
    >
      <span>Operaci&oacute;n financiera Bridge</span>
      <VBtn
        variant="text"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="load"
      >
        Actualizar
      </VBtn>
    </VCardTitle>
    <VTabs v-model="tab" grow>
      <VTab value="summary">Resumen</VTab>
      <VTab value="accounts">Cuentas</VTab>
      <VTab v-if="canViewDeposits" value="deposits">Dep&oacute;sitos</VTab>
      <VTab v-if="canViewReconciliations" value="reconciliations"
        >Reconciliaciones</VTab
      >
    </VTabs>
    <VCardText>
      <VWindow v-model="tab">
        <VWindowItem value="summary">
          <VRow>
            <VCol
              v-for="item in [
                { label: 'USD activas', value: summary.active_usd },
                { label: 'EUR activas', value: summary.active_eur },
                {
                  label: 'Dep\u00f3sitos recibidos',
                  value: summary.deposits_received,
                },
                { label: 'En proceso', value: summary.deposits_processing },
                { label: 'Completados', value: summary.deposits_completed },
                { label: 'Incidentes', value: summary.deposits_incident },
                {
                  label: 'Reconciliaciones abiertas',
                  value: summary.open_reconciliations,
                },
              ]"
              :key="item.label"
              cols="6"
              md="3"
            >
              <VCard variant="tonal" height="100%">
                <VCardText>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.label }}
                  </div>
                  <div class="text-h5">{{ item.value }}</div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VWindowItem>

        <VWindowItem value="accounts">
          <VTable density="compact">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Estado</th>
                <th>Datos de recepci&oacute;n</th>
                <th>Billetera</th>
                <th>Ledger</th>
                <th>Proveedor</th>
                <th>Reconciliaci&oacute;n</th>
                <th>&Uacute;ltima sincronizaci&oacute;n</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="accounts.length === 0">
                <td colspan="10" class="text-center py-6">Sin cuentas.</td>
              </tr>
              <tr v-for="account in accounts" :key="account.id">
                <td>
                  {{ account.user.name }}
                  <div class="text-caption">{{ account.user.email }}</div>
                </td>
                <td>
                  {{ account.product.toUpperCase() }}
                  <div class="text-caption">
                    {{ account.provider_account_id }}
                  </div>
                </td>
                <td>{{ accountStatusLabel(account.status) }}</td>
                <td>{{ maskedDetails(account) }}</td>
                <td>
                  {{ account.wallet_address_masked || "-" }}
                  <div class="text-caption">
                    {{ account.chain }} / ID de billetera Bridge:
                    {{ account.provider_wallet_id }}
                  </div>
                </td>
                <td>
                  {{ account.ledger_balance }} {{ account.settlement_currency }}
                </td>
                <td>
                  {{ account.provider_wallet_balance }}
                  {{ account.settlement_currency }}
                </td>
                <td>
                  {{
                    reconciliationStatusLabel(account.reconciliation?.status)
                  }}
                  <div v-if="account.reconciliation" class="text-caption">
                    Diferencia: {{ account.reconciliation.difference }}
                  </div>
                </td>
                <td>{{ dateLabel(account.last_synced_at) }}</td>
                <td>
                  <div class="d-flex flex-wrap ga-1">
                    <VBtn
                      v-if="canSync"
                      size="small"
                      variant="text"
                      @click="openAction(account, 'sync')"
                      >Sincronizar</VBtn
                    >
                    <VBtn
                      v-if="canManage && account.status === 'activated'"
                      size="small"
                      variant="text"
                      @click="openAction(account, 'deactivate')"
                      >Desactivar</VBtn
                    >
                    <VBtn
                      v-if="canManage && account.status === 'deactivated'"
                      size="small"
                      variant="text"
                      @click="openAction(account, 'reactivate')"
                      >Reactivar</VBtn
                    >
                    <VBtn
                      v-if="canReconcile"
                      size="small"
                      variant="text"
                      @click="openAction(account, 'reconcile')"
                      >Reconciliar</VBtn
                    >
                    <VBtn
                      v-if="canSimulate && account.environment === 'fake'"
                      size="small"
                      color="warning"
                      variant="tonal"
                      @click="openFakeDeposit(account)"
                      >Dep&oacute;sito fake</VBtn
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </VTable>
        </VWindowItem>

        <VWindowItem value="deposits">
          <VTable density="compact">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cuenta</th>
                <th>Estado</th>
                <th>Origen</th>
                <th>Liquidado</th>
                <th>Ledger</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="deposits.length === 0">
                <td colspan="7" class="text-center py-6">
                  Sin dep&oacute;sitos.
                </td>
              </tr>
              <tr v-for="deposit in deposits" :key="deposit.id">
                <td>{{ deposit.id }}</td>
                <td>{{ deposit.account_id }}</td>
                <td>{{ depositStatusLabel(deposit.state) }}</td>
                <td>
                  {{ deposit.source_amount }} {{ deposit.source_currency }}
                </td>
                <td>
                  {{ deposit.settled_amount || "-" }}
                  {{ deposit.settlement_currency }}
                </td>
                <td>{{ deposit.ledger_transaction_id || "-" }}</td>
                <td>{{ dateLabel(deposit.last_event_at) }}</td>
              </tr>
            </tbody>
          </VTable>
        </VWindowItem>

        <VWindowItem value="reconciliations">
          <VAlert type="info" variant="tonal" class="mb-4">
            Las diferencias Bridge se gestionan en el libro mayor central y
            requieren resoluci&oacute;n auditada.
          </VAlert>
          <VBtn
            color="primary"
            @click="router.push({ name: 'admin-ledger-reconciliations' })"
          >
            Abrir reconciliaciones
          </VBtn>
        </VWindowItem>
      </VWindow>
    </VCardText>
  </VCard>

  <VDialog v-model="actionDialog.open" max-width="520">
    <VCard>
      <VCardTitle>{{ actionTitle }}</VCardTitle>
      <VCardText
        ><VTextarea
          v-model="actionDialog.reason"
          label="Motivo administrativo"
          maxlength="1000"
      /></VCardText>
      <VCardActions
        ><VSpacer /><VBtn variant="text" @click="actionDialog.open = false"
          >Cancelar</VBtn
        ><VBtn
          color="primary"
          :loading="actionDialog.loading"
          :disabled="actionDialog.reason.trim().length < 3"
          @click="executeAction"
          >Confirmar</VBtn
        ></VCardActions
      >
    </VCard>
  </VDialog>

  <VDialog v-model="fakeDialog.open" max-width="560">
    <VCard>
      <VCardTitle>Dep&oacute;sito fake determinista</VCardTitle>
      <VCardText>
        <VAlert type="warning" variant="tonal" class="mb-4"
          >Disponible solo con driver y cuenta fake.</VAlert
        >
        <VTextField
          v-model="fakeDialog.amount"
          label="Monto"
          inputmode="decimal"
        />
        <VSelect
          v-model="fakeDialog.scenario"
          label="Escenario"
          :items="fakeScenarios"
        />
        <VTextarea
          v-model="fakeDialog.reason"
          label="Motivo administrativo"
          maxlength="1000"
        />
      </VCardText>
      <VCardActions
        ><VSpacer /><VBtn variant="text" @click="fakeDialog.open = false"
          >Cancelar</VBtn
        ><VBtn
          color="warning"
          :loading="fakeDialog.loading"
          :disabled="fakeDialog.reason.trim().length < 3"
          @click="createFakeDeposit"
          >Simular</VBtn
        ></VCardActions
      >
    </VCard>
  </VDialog>
</template>
