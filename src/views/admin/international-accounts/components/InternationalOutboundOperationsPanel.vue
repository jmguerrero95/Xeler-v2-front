<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { computed, onMounted, reactive, ref } from "vue";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import { INTERNATIONAL_ACCOUNTS } from "@/enums/Permissions.enum";
import type {
  AdminInternationalExternalAccount,
  AdminInternationalTransfer,
  InternationalServiceFeeRule,
} from "@/interfaces/InternationalAccounts/InternationalAccounts.model";
import type { NormalizedApiError } from "@/services/apiErrors";
import {
  getAdminInternationalBeneficiaries,
  getAdminInternationalExternalAccounts,
  getAdminInternationalTransfers,
  getInternationalServiceFees,
  mutateAdminInternationalTransfer,
  transitionAdminInternationalExternalAccount,
  updateInternationalServiceFee,
} from "@/services/internationalAccountsApi";

const helper = helperStore();
const userStore = UserStore();
const tab = ref("beneficiaries");
const loading = ref(false);
const beneficiaries = ref<Array<Record<string, unknown>>>([]);
const externalAccounts = ref<AdminInternationalExternalAccount[]>([]);
const transfers = ref<AdminInternationalTransfer[]>([]);
const fees = ref<InternationalServiceFeeRule[]>([]);
const summary = ref<Record<string, string | number>>({});
const action = reactive({
  open: false,
  kind: "transfer" as "transfer" | "external" | "fee",
  operation: "sync",
  id: 0,
  reason: "",
  state: "payment_submitted",
  loading: false,
});
const feeForms = reactive<
  Record<
    number,
    {
      enabled: boolean;
      fixed_amount: string;
      refund_on_provider_refund: boolean;
    }
  >
>({});

const canViewBeneficiaries = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.BENEFICIARIES_VIEW),
);
const canManageBeneficiaries = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.BENEFICIARIES_MANAGE),
);
const canViewTransfers = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.TRANSFERS_VIEW),
);
const canManageTransfers = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.TRANSFERS_MANAGE),
);
const canSyncTransfers = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.TRANSFERS_SYNC),
);
const canViewFees = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.FEES_VIEW),
);
const canUpdateFees = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.FEES_UPDATE),
);
const canSimulate = computed(() =>
  userStore.hasPermission(INTERNATIONAL_ACCOUNTS.PROVIDER_SIMULATE),
);

const fakeStates = [
  { title: "Pago enviado", value: "payment_submitted" },
  { title: "Completada", value: "payment_processed" },
  { title: "En revisión", value: "in_review" },
  { title: "Pago devuelto", value: "returned" },
  { title: "Reembolso en proceso", value: "refund_in_flight" },
  { title: "Reembolsada", value: "refunded" },
  { title: "Error en reembolso", value: "refund_failed" },
  { title: "No fue posible entregar", value: "undeliverable" },
  { title: "Requiere atención", value: "error" },
  { title: "Cancelada", value: "canceled" },
];
const statusLabel = (status: string): string =>
  ({
    pending_submission: "Validando cuenta bancaria",
    active: "Activa",
    deactivated: "Desactivada",
    submission_failed: "Registro fallido",
    review_required: "Requiere revisión",
  })[status] ?? "En revisión";
const reconciliationLabel = (status?: string | null): string =>
  ({
    match: "Conciliada",
    mismatch: "Con diferencia",
    ignored: "Ignorada",
    fixed: "Corregida",
  })[status ?? ""] ?? "Sin conciliación";
const dateLabel = (value?: string | null): string =>
  value ? new Date(value).toLocaleString() : "Pendiente";
const errorMessage = (caught: unknown, fallback: string): string =>
  (caught as NormalizedApiError)?.message ?? fallback;

const load = async () => {
  try {
    loading.value = true;
    const requests: Promise<unknown>[] = [];
    if (canViewBeneficiaries.value) requests.push(loadBeneficiaries());
    if (canViewTransfers.value) requests.push(loadTransfers());
    if (canViewFees.value) requests.push(loadFees());
    await Promise.all(requests);
  } catch (caught: unknown) {
    helper.showNotify(
      errorMessage(caught, "No fue posible cargar las operaciones salientes."),
      { type: "error" },
    );
  } finally {
    loading.value = false;
  }
};
const loadBeneficiaries = async () => {
  const [beneficiaryResponse, externalResponse] = await Promise.all([
    getAdminInternationalBeneficiaries({ per_page: 100 }),
    getAdminInternationalExternalAccounts({ per_page: 100 }),
  ]);
  beneficiaries.value = beneficiaryResponse.data.data;
  externalAccounts.value = externalResponse.data.data;
};
const loadTransfers = async () => {
  const response = await getAdminInternationalTransfers({ per_page: 100 });
  transfers.value = response.data.data;
  summary.value =
    (response.data.meta.summary as Record<string, string | number>) ?? {};
};
const loadFees = async () => {
  const response = await getInternationalServiceFees();
  fees.value = response.data.data;
  for (const fee of fees.value)
    feeForms[fee.id] = {
      enabled: fee.enabled,
      fixed_amount: fee.fixed_amount,
      refund_on_provider_refund: fee.refund_on_provider_refund,
    };
};

const openTransferAction = (
  transfer: AdminInternationalTransfer,
  operation: "sync" | "submit" | "cancel" | "fake-state",
) => {
  Object.assign(action, {
    open: true,
    kind: "transfer",
    operation,
    id: transfer.id,
    reason: "",
    state: "payment_submitted",
  });
};
const openExternalAction = (
  account: AdminInternationalExternalAccount,
  operation: "sync" | "deactivate" | "reactivate",
) => {
  Object.assign(action, {
    open: true,
    kind: "external",
    operation,
    id: account.id,
    reason: "",
  });
};
const openFeeAction = (fee: InternationalServiceFeeRule) => {
  Object.assign(action, {
    open: true,
    kind: "fee",
    operation: "update",
    id: fee.id,
    reason: "",
  });
};
const executeAction = async () => {
  if (action.reason.trim().length < 3 || action.loading) return;
  try {
    action.loading = true;
    if (action.kind === "transfer") {
      await authorizeWithTwoFactor(mutateAdminInternationalTransfer.bind(undefined, action.id, action.operation as "sync" | "submit" | "cancel" | "fake-state", {
          reason: action.reason.trim(),
          ...(action.operation === "fake-state" ? { state: action.state } : {}),
        }), "finance.international_accounts");
      await loadTransfers();
    } else if (action.kind === "external") {
      await authorizeWithTwoFactor(transitionAdminInternationalExternalAccount.bind(undefined, action.id, action.operation as "sync" | "deactivate" | "reactivate", action.reason.trim()), "finance.international_accounts");
      await loadBeneficiaries();
    } else {
      const form = feeForms[action.id];
      await authorizeWithTwoFactor(updateInternationalServiceFee.bind(undefined, action.id, {
        ...form,
        reason: action.reason.trim(),
        charge_currency_mode: "settlement_currency",
      }), "finance.international_accounts");
      await loadFees();
    }
    helper.showNotify("Operación administrativa registrada.");
    action.open = false;
  } catch (caught: unknown) {
    helper.showNotify(
      errorMessage(caught, "No fue posible completar la acción."),
      { type: "error" },
    );
  } finally {
    action.loading = false;
  }
};

onMounted(() => void load());
</script>

<template>
  <VCard class="mt-6" rounded="lg" variant="outlined">
    <VCardTitle>Operaciones salientes</VCardTitle>
    <VCardSubtitle
      >Beneficiarios, transferencias, comisiones y límites
      internacionales.</VCardSubtitle
    >
    <VProgressLinear v-if="loading" indeterminate />
    <VTabs v-model="tab" class="px-4">
      <VTab v-if="canViewBeneficiaries" value="beneficiaries"
        >Beneficiarios</VTab
      >
      <VTab v-if="canViewTransfers" value="transfers">Transferencias</VTab>
      <VTab v-if="canViewFees" value="fees">Comisiones</VTab>
      <VTab v-if="canViewTransfers" value="risk">Riesgo / Límites</VTab>
    </VTabs>
    <VWindow v-model="tab">
      <VWindowItem value="beneficiaries"
        ><VCardText>
          <VTable
            ><thead>
              <tr>
                <th>Alias</th>
                <th>Usuario</th>
                <th>Tipo</th>
                <th>País</th>
                <th>Cuentas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="beneficiary in beneficiaries"
                :key="String(beneficiary.id)"
              >
                <td>{{ beneficiary.alias }}</td>
                <td>#{{ beneficiary.user_id }}</td>
                <td>
                  {{
                    beneficiary.beneficiary_type === "business"
                      ? "Empresa"
                      : "Persona"
                  }}
                </td>
                <td>{{ beneficiary.country }}</td>
                <td>{{ beneficiary.external_accounts_count }}</td>
                <td>{{ statusLabel(String(beneficiary.status)) }}</td>
              </tr>
            </tbody></VTable
          >
          <VDivider class="my-5" />
          <h3 class="text-subtitle-1 mb-3">Cuentas bancarias destino</h3>
          <VTable
            ><thead>
              <tr>
                <th>Alias</th>
                <th>Banco</th>
                <th>Cuenta</th>
                <th>Moneda</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in externalAccounts" :key="account.id">
                <td>{{ account.beneficiary_alias }}</td>
                <td>{{ account.bank_name }}</td>
                <td>{{ account.account_masked }}</td>
                <td>{{ account.currency }}</td>
                <td>{{ statusLabel(account.status) }}</td>
                <td>
                  <div v-if="canManageBeneficiaries" class="d-flex ga-1">
                    <VBtn
                      size="small"
                      variant="text"
                      @click="openExternalAction(account, 'sync')"
                      >Sincronizar</VBtn
                    ><VBtn
                      v-if="account.active"
                      size="small"
                      variant="text"
                      color="warning"
                      @click="openExternalAction(account, 'deactivate')"
                      >Desactivar</VBtn
                    ><VBtn
                      v-else-if="account.provider_external_account_id"
                      size="small"
                      variant="text"
                      @click="openExternalAction(account, 'reactivate')"
                      >Reactivar</VBtn
                    >
                  </div>
                </td>
              </tr>
            </tbody></VTable
          >
        </VCardText></VWindowItem
      >
      <VWindowItem value="transfers"
        ><VCardText>
          <VAlert
            v-if="transfers.some((item) => item.provider === 'fake')"
            type="warning"
            variant="tonal"
            class="mb-4"
            >ENTORNO DE DEMOSTRACIÓN</VAlert
          >
          <VTable
            ><thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Beneficiario</th>
                <th>Monto</th>
                <th>Reserva</th>
                <th>Estado</th>
                <th>Conciliación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transfer in transfers" :key="transfer.id">
                <td>{{ dateLabel(transfer.date) }}</td>
                <td>#{{ transfer.user_id }}</td>
                <td>
                  {{ transfer.beneficiary.alias }} -
                  {{ transfer.beneficiary.account_masked }}
                </td>
                <td>
                  {{ transfer.destination_amount }}
                  {{ transfer.destination_currency }}
                </td>
                <td>
                  {{ transfer.reservation_amount }}
                  {{ transfer.source_account.currency }}
                </td>
                <td>
                  <VChip
                    size="small"
                    :color="transfer.review_required ? 'warning' : 'info'"
                    >{{ transfer.status_label }}</VChip
                  >
                  <div v-if="transfer.review_code" class="text-caption">
                    {{ transfer.review_code }}
                  </div>
                </td>
                <td>
                  {{ reconciliationLabel(transfer.reconciliation_status) }}
                </td>
                <td>
                  <div class="d-flex flex-wrap ga-1">
                    <VBtn
                      v-if="canSyncTransfers && transfer.provider_transfer_id"
                      size="small"
                      variant="text"
                      @click="openTransferAction(transfer, 'sync')"
                      >Sincronizar</VBtn
                    ><VBtn
                      v-if="
                        canManageTransfers &&
                        transfer.status === 'manual_review'
                      "
                      size="small"
                      variant="text"
                      @click="openTransferAction(transfer, 'submit')"
                      >Aprobar y enviar</VBtn
                    ><VBtn
                      v-if="
                        canManageTransfers &&
                        ['queued', 'manual_review', 'awaiting_funds'].includes(
                          transfer.status,
                        )
                      "
                      size="small"
                      variant="text"
                      color="warning"
                      @click="openTransferAction(transfer, 'cancel')"
                      >Cancelar</VBtn
                    ><VBtn
                      v-if="
                        canSimulate &&
                        transfer.provider === 'fake' &&
                        !transfer.is_terminal
                      "
                      size="small"
                      variant="text"
                      color="warning"
                      @click="openTransferAction(transfer, 'fake-state')"
                      >Simular estado</VBtn
                    >
                  </div>
                </td>
              </tr>
            </tbody></VTable
          >
        </VCardText></VWindowItem
      >
      <VWindowItem value="fees"
        ><VCardText>
          <VAlert type="info" variant="tonal" class="mb-4"
            >Solo se admite una comisión fija en la moneda de liquidación. No se
            envía como developer fee a Bridge.</VAlert
          >
          <VRow
            ><VCol v-for="fee in fees" :key="fee.id" cols="12" md="6"
              ><VCard variant="outlined"
                ><VCardTitle
                  >{{ fee.product.toUpperCase() }} - Transferencia
                  saliente</VCardTitle
                ><VCardText
                  ><VSwitch
                    v-model="feeForms[fee.id].enabled"
                    label="Habilitada"
                    :disabled="!canUpdateFees"
                  /><VTextField
                    v-model="feeForms[fee.id].fixed_amount"
                    label="Comisión fija (moneda de liquidación)"
                    inputmode="decimal"
                    :suffix="fee.settlement_currency || undefined"
                    :hint="
                      fee.settlement_currency
                        ? `Moneda de liquidación: ${fee.settlement_currency}`
                        : 'Moneda de liquidación no configurada'
                    "
                    persistent-hint
                    :disabled="!canUpdateFees"
                  /><VSwitch
                    v-model="feeForms[fee.id].refund_on_provider_refund"
                    label="Reembolsar si el proveedor devuelve la operación"
                    :disabled="!canUpdateFees"
                  /><VBtn
                    v-if="canUpdateFees"
                    variant="tonal"
                    @click="openFeeAction(fee)"
                    >Guardar comisión</VBtn
                  ></VCardText
                ></VCard
              ></VCol
            ></VRow
          >
        </VCardText></VWindowItem
      >
      <VWindowItem value="risk"
        ><VCardText>
          <VRow
            ><VCol
              v-for="item in [
                { k: 'preparing', l: 'En preparación' },
                { k: 'review', l: 'En revisión' },
                { k: 'submitted', l: 'Enviadas' },
                { k: 'completed', l: 'Completadas' },
                { k: 'refunded', l: 'Reembolsadas' },
                { k: 'incident', l: 'Con incidencia' },
              ]"
              :key="item.k"
              cols="6"
              md="2"
              ><VCard variant="tonal"
                ><VCardText
                  ><div class="text-h5">{{ summary[item.k] ?? 0 }}</div>
                  <div class="text-caption">{{ item.l }}</div></VCardText
                ></VCard
              ></VCol
            ></VRow
          >
          <VAlert type="info" variant="tonal" class="mt-4"
            >Saldo reservado pendiente: {{ summary.reserved_pending ?? "0" }}.
            Los límites monetarios, el máximo por cuenta y el máximo por wallet
            se configuran fuera del navegador. Una reconciliación HIGH o
            CRITICAL abierta bloquea nuevas salidas.</VAlert
          >
        </VCardText></VWindowItem
      >
    </VWindow>
  </VCard>

  <VDialog v-model="action.open" max-width="520"
    ><VCard
      ><VCardTitle>Confirmar acción administrativa</VCardTitle
      ><VCardText
        ><VAlert
          v-if="action.operation === 'fake-state'"
          type="warning"
          variant="tonal"
          class="mb-3"
          >ENTORNO DE DEMOSTRACIÓN</VAlert
        ><VSelect
          v-if="action.operation === 'fake-state'"
          v-model="action.state"
          label="Estado del proveedor"
          :items="fakeStates" /><VTextarea
          v-model="action.reason"
          label="Motivo administrativo"
          maxlength="1000"
          rows="3" /></VCardText
      ><VCardActions
        ><VSpacer /><VBtn variant="text" @click="action.open = false"
          >Cancelar</VBtn
        ><VBtn
          color="primary"
          :disabled="action.reason.trim().length < 3"
          :loading="action.loading"
          @click="executeAction"
          >Confirmar</VBtn
        ></VCardActions
      ></VCard
    ></VDialog
  >
</template>
