<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { helperStore } from "@/helper";
import type {
  InternationalAccountFiatAccount,
  InternationalBeneficiary,
  InternationalExternalAccount,
  InternationalTransfer,
  InternationalTransferPreview,
} from "@/interfaces/InternationalAccounts/InternationalAccounts.model";
import type { NormalizedApiError } from "@/services/apiErrors";
import {
  createInternationalBeneficiary,
  createInternationalExternalAccount,
  createInternationalTransfer,
  getInternationalBeneficiaries,
  getInternationalExternalAccounts,
  getInternationalFiatAccounts,
  getInternationalTransfers,
  previewInternationalTransfer,
} from "@/services/internationalAccountsApi";

const helper = helperStore();
const tab = ref("beneficiaries");
const loading = ref(false);
const savingBeneficiary = ref(false);
const previewing = ref(false);
const confirming = ref(false);
const pollingRequest = ref(false);
const beneficiaryDialog = ref(false);
const accounts = ref<InternationalAccountFiatAccount[]>([]);
const beneficiaries = ref<InternationalBeneficiary[]>([]);
const externalAccounts = ref<InternationalExternalAccount[]>([]);
const transfers = ref<InternationalTransfer[]>([]);
const preview = ref<InternationalTransferPreview | null>(null);
const selectedTransfer = ref<InternationalTransfer | null>(null);
let pollingTimer: ReturnType<typeof setInterval> | null = null;

const beneficiaryForm = reactive({
  alias: "",
  beneficiary_type: "individual" as "individual" | "business",
  first_name: "",
  last_name: "",
  business_name: "",
  country: "",
  street_line_1: "",
  street_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  currency: "usd" as "usd" | "eur",
  bank_name: "",
  account_number: "",
  routing_number: "",
  checking_or_savings: "checking" as "checking" | "savings",
  iban: "",
  bic: "",
  iban_country: "",
});
const transferForm = reactive({
  international_account_id: null as number | null,
  external_account_id: null as number | null,
  destination_amount: "",
  payment_rail: "" as "" | "ach" | "wire" | "sepa",
  reference: "",
});

const selectedAccount = computed(() =>
  accounts.value.find(
    (item) => item.id === transferForm.international_account_id,
  ),
);
const availableDestinations = computed(() =>
  externalAccounts.value.filter(
    (item) =>
      item.active &&
      item.status === "active" &&
      item.product === selectedAccount.value?.product,
  ),
);
const railItems = computed(() => {
  const destination = availableDestinations.value.find(
    (item) => item.id === transferForm.external_account_id,
  );
  return (destination?.payment_rails ?? []).map((rail) => ({
    title: railLabel(rail),
    value: rail,
  }));
});
const validAmount = computed(() =>
  /^(?:0*[1-9]\d*)(?:\.\d{1,18})?$/.test(transferForm.destination_amount),
);
const canPreview = computed(() =>
  Boolean(
    transferForm.international_account_id &&
    transferForm.external_account_id &&
    transferForm.payment_rail &&
    validAmount.value,
  ),
);
const beneficiaryReady = computed(() =>
  Boolean(
    beneficiaryForm.alias.trim() &&
    beneficiaryForm.country.length === 3 &&
    beneficiaryForm.street_line_1.trim() &&
    beneficiaryForm.city.trim() &&
    beneficiaryForm.postal_code.trim() &&
    beneficiaryForm.bank_name.trim() &&
    (beneficiaryForm.beneficiary_type === "business"
      ? beneficiaryForm.business_name.trim()
      : beneficiaryForm.first_name.trim() &&
        beneficiaryForm.last_name.trim()) &&
    (beneficiaryForm.currency === "usd"
      ? /^\d{4,34}$/.test(beneficiaryForm.account_number) &&
        /^\d{9}$/.test(beneficiaryForm.routing_number)
      : beneficiaryForm.iban.trim() &&
        beneficiaryForm.bic.trim() &&
        beneficiaryForm.iban_country.length === 3),
  ),
);

watch(
  () => transferForm.international_account_id,
  () => {
    transferForm.external_account_id = null;
    transferForm.payment_rail = "";
    preview.value = null;
  },
);
watch(
  () => transferForm.external_account_id,
  () => {
    transferForm.payment_rail = "";
    preview.value = null;
  },
);
watch(
  () => [
    transferForm.destination_amount,
    transferForm.payment_rail,
    transferForm.reference,
  ],
  () => {
    preview.value = null;
  },
);

const errorMessage = (caught: unknown, fallback: string): string =>
  (caught as NormalizedApiError)?.message ?? fallback;
const railLabel = (rail: string): string =>
  ({ ach: "ACH", wire: "Transferencia bancaria", sepa: "SEPA" })[rail] ??
  "Medio bancario";
const accountLabel = (account: InternationalAccountFiatAccount): string =>
  `Cuenta ${account.product.toUpperCase()} - saldo ${account.available_balance} ${account.settlement_currency}`;
const destinationLabel = (account: InternationalExternalAccount): string =>
  `${account.beneficiary_alias || "Beneficiario"} - ${account.bank_name || "Banco"} ${account.account_masked || "Cuenta en validación"}`;
const formatDate = (value?: string | null): string =>
  value ? new Date(value).toLocaleString() : "Pendiente";
const statusLabel = (status: string): string =>
  ({
    pending_submission: "Validando cuenta bancaria",
    active: "Activa",
    deactivated: "Desactivada",
    submission_failed: "No fue posible registrar la cuenta",
    review_required: "Requiere revisión",
  })[status] ?? "En revisión";

const load = async (silent = false) => {
  try {
    if (!silent) loading.value = true;
    const [accountResponse, beneficiaryResponse, externalResponse] =
      await Promise.all([
        getInternationalFiatAccounts(),
        getInternationalBeneficiaries(),
        getInternationalExternalAccounts(),
      ]);
    accounts.value = accountResponse.data.data.filter(
      (item) => item.status === "activated",
    );
    beneficiaries.value = beneficiaryResponse.data.data;
    externalAccounts.value = externalResponse.data.data;
    await loadTransfers(true);
  } catch (caught: unknown) {
    if (!silent)
      helper.showNotify(
        errorMessage(
          caught,
          "No fue posible cargar beneficiarios y transferencias.",
        ),
        { type: "error" },
      );
  } finally {
    loading.value = false;
  }
};

const loadTransfers = async (silent = false) => {
  if (pollingRequest.value) return;
  try {
    pollingRequest.value = true;
    const response = await getInternationalTransfers({ per_page: 50 });
    transfers.value = response.data.data;
    if (transfers.value.some((item) => !item.is_terminal)) startPolling();
    else stopPolling();
  } catch (caught: unknown) {
    if (!silent)
      helper.showNotify(
        errorMessage(caught, "No fue posible actualizar las transferencias."),
        { type: "error" },
      );
  } finally {
    pollingRequest.value = false;
  }
};

const startPolling = () => {
  if (
    pollingTimer !== null ||
    document.hidden ||
    !transfers.value.some((item) => !item.is_terminal)
  )
    return;
  pollingTimer = setInterval(() => void loadTransfers(true), 12_000);
};
const stopPolling = () => {
  if (pollingTimer !== null) clearInterval(pollingTimer);
  pollingTimer = null;
};
const visibilityChanged = () => {
  if (document.hidden) stopPolling();
  else if (transfers.value.some((item) => !item.is_terminal))
    void loadTransfers(true);
};

const saveBeneficiary = async () => {
  if (!beneficiaryReady.value || savingBeneficiary.value) return;
  try {
    savingBeneficiary.value = true;
    const beneficiary = await authorizeWithTwoFactor(createInternationalBeneficiary.bind(undefined, {
      alias: beneficiaryForm.alias.trim(),
      beneficiary_type: beneficiaryForm.beneficiary_type,
      first_name: beneficiaryForm.first_name.trim() || undefined,
      last_name: beneficiaryForm.last_name.trim() || undefined,
      business_name: beneficiaryForm.business_name.trim() || undefined,
      country: beneficiaryForm.country.toUpperCase(),
      street_line_1: beneficiaryForm.street_line_1.trim(),
      street_line_2: beneficiaryForm.street_line_2.trim() || undefined,
      city: beneficiaryForm.city.trim(),
      state: beneficiaryForm.state.trim() || undefined,
      postal_code: beneficiaryForm.postal_code.trim(),
    }), "finance.international_accounts");
    await authorizeWithTwoFactor(createInternationalExternalAccount.bind(undefined, beneficiary.data.data.id, {
      currency: beneficiaryForm.currency,
      account_type: beneficiaryForm.currency === "usd" ? "us" : "iban",
      bank_name: beneficiaryForm.bank_name.trim(),
      account_number:
        beneficiaryForm.currency === "usd"
          ? beneficiaryForm.account_number
          : undefined,
      routing_number:
        beneficiaryForm.currency === "usd"
          ? beneficiaryForm.routing_number
          : undefined,
      checking_or_savings:
        beneficiaryForm.currency === "usd"
          ? beneficiaryForm.checking_or_savings
          : undefined,
      iban:
        beneficiaryForm.currency === "eur"
          ? beneficiaryForm.iban.replace(/\s/g, "")
          : undefined,
      bic:
        beneficiaryForm.currency === "eur"
          ? beneficiaryForm.bic.toUpperCase()
          : undefined,
      iban_country:
        beneficiaryForm.currency === "eur"
          ? beneficiaryForm.iban_country.toUpperCase()
          : undefined,
    }), "finance.international_accounts");
    helper.showNotify(
      "Beneficiario registrado. La cuenta bancaria se está validando.",
    );
    beneficiaryDialog.value = false;
    await load(true);
  } catch (caught: unknown) {
    helper.showNotify(
      errorMessage(caught, "No fue posible registrar el beneficiario."),
      { type: "error" },
    );
  } finally {
    savingBeneficiary.value = false;
  }
};

const requestPreview = async () => {
  if (!canPreview.value) return;
  try {
    previewing.value = true;
    const response = await previewInternationalTransfer({ ...transferForm });
    preview.value = response.data.data;
  } catch (caught: unknown) {
    helper.showNotify(
      errorMessage(caught, "No fue posible preparar el resumen."),
      { type: "error" },
    );
  } finally {
    previewing.value = false;
  }
};

const confirmTransfer = async () => {
  if (!preview.value || confirming.value) return;
  try {
    confirming.value = true;
    const response = await authorizeWithTwoFactor(createInternationalTransfer.bind(undefined, { ...transferForm }), "finance.international_accounts");
    helper.showNotify(response.data.data.status_label);
    preview.value = null;
    transferForm.destination_amount = "";
    transferForm.reference = "";
    tab.value = "history";
    await load(true);
  } catch (caught: unknown) {
    helper.showNotify(
      errorMessage(caught, "No fue posible crear la transferencia."),
      { type: "error" },
    );
  } finally {
    confirming.value = false;
  }
};

onMounted(() => {
  document.addEventListener("visibilitychange", visibilityChanged);
  void load();
});
onUnmounted(() => {
  stopPolling();
  document.removeEventListener("visibilitychange", visibilityChanged);
});
</script>

<template>
  <VCard class="mt-6" variant="outlined" rounded="lg">
    <VCardTitle>Beneficiarios y transferencias</VCardTitle>
    <VCardSubtitle
      >Envía USD por ACH o transferencia bancaria y EUR por SEPA.</VCardSubtitle
    >
    <VProgressLinear v-if="loading" indeterminate />
    <VTabs v-model="tab" class="px-4">
      <VTab value="beneficiaries">Beneficiarios</VTab
      ><VTab value="send">Enviar</VTab><VTab value="history">Historial</VTab>
    </VTabs>
    <VWindow v-model="tab">
      <VWindowItem value="beneficiaries"
        ><VCardText>
          <div class="d-flex justify-end mb-4">
            <VBtn
              prepend-icon="mdi-account-plus"
              @click="beneficiaryDialog = true"
              >Agregar beneficiario</VBtn
            >
          </div>
          <VAlert v-if="!externalAccounts.length" type="info" variant="tonal"
            >Aún no tienes cuentas bancarias de beneficiarios.</VAlert
          >
          <VList v-else lines="three">
            <VListItem
              v-for="account in externalAccounts"
              :key="account.id"
              :title="account.beneficiary_alias || 'Beneficiario'"
              :subtitle="`${account.bank_name || 'Banco'} - ${account.account_masked || 'Cuenta en validación'} - ${statusLabel(account.status)}`"
            >
              <template #append
                ><VChip
                  size="small"
                  :color="account.active ? 'success' : 'info'"
                  >{{ account.currency }}</VChip
                ></template
              >
            </VListItem>
          </VList>
        </VCardText></VWindowItem
      >
      <VWindowItem value="send"
        ><VCardText>
          <VAlert type="info" variant="tonal" class="mb-4"
            >Xeler utiliza infraestructura financiera de Bridge y proveedores
            asociados para procesar esta transferencia.</VAlert
          >
          <div class="d-flex ga-2 mb-5">
            <VChip color="primary">1 Cuenta</VChip
            ><VChip
              :color="transferForm.external_account_id ? 'primary' : undefined"
              >2 Beneficiario</VChip
            ><VChip :color="validAmount ? 'primary' : undefined">3 Monto</VChip
            ><VChip :color="preview ? 'primary' : undefined"
              >4 Confirmación</VChip
            >
          </div>
          <VSelect
            v-model="transferForm.international_account_id"
            :items="accounts"
            item-value="id"
            :item-title="accountLabel"
            label="Cuenta origen"
          />
          <VSelect
            v-model="transferForm.external_account_id"
            :items="availableDestinations"
            item-value="id"
            :item-title="destinationLabel"
            label="Beneficiario"
            :disabled="!selectedAccount"
          />
          <VSelect
            v-model="transferForm.payment_rail"
            :items="railItems"
            label="Medio de envío"
            :disabled="!transferForm.external_account_id"
          />
          <VTextField
            v-model="transferForm.destination_amount"
            label="Monto a enviar"
            inputmode="decimal"
            :suffix="selectedAccount?.product.toUpperCase()"
          />
          <VTextField
            v-model="transferForm.reference"
            :label="
              transferForm.payment_rail === 'ach'
                ? 'Referencia ACH (opcional)'
                : 'Referencia (opcional)'
            "
            :maxlength="transferForm.payment_rail === 'ach' ? 10 : 140"
          />
          <div class="d-flex justify-end">
            <VBtn
              variant="tonal"
              :disabled="!canPreview"
              :loading="previewing"
              @click="requestPreview"
              >Revisar transferencia</VBtn
            >
          </div>
          <VCard
            v-if="preview"
            class="mt-5"
            color="surface-variant"
            variant="tonal"
            ><VCardTitle>Resumen y confirmación</VCardTitle
            ><VCardText>
              <VList density="compact"
                ><VListItem
                  title="Cuenta origen"
                  :subtitle="`${preview.source_account.currency}`" /><VListItem
                  title="Beneficiario"
                  :subtitle="`${preview.beneficiary.alias} - ${preview.beneficiary.bank_name} ${preview.beneficiary.account_masked}`" /><VListItem
                  title="Monto a enviar"
                  :subtitle="`${preview.destination_amount} ${preview.destination_currency}`" /><VListItem
                  title="Medio"
                  :subtitle="railLabel(preview.payment_rail)" /><VListItem
                  title="Comisión Xeler"
                  :subtitle="`${preview.xeler_fee_amount} ${preview.source_account.currency}`" /><VListItem
                  title="Reserva máxima temporal"
                  :subtitle="`${preview.maximum_reservation_amount} ${preview.source_account.currency}`"
              /></VList>
              <VAlert type="info" variant="tonal" class="my-3"
                >Xeler puede reservar temporalmente un monto ligeramente
                superior mientras el proveedor confirma el importe final. La
                parte no utilizada se libera automáticamente.</VAlert
              >
              <div class="d-flex justify-end">
                <VBtn
                  color="primary"
                  :loading="confirming"
                  @click="confirmTransfer"
                  >Confirmar y enviar</VBtn
                >
              </div>
            </VCardText></VCard
          >
        </VCardText></VWindowItem
      >
      <VWindowItem value="history"
        ><VCardText>
          <VAlert v-if="!transfers.length" type="info" variant="tonal"
            >Aún no tienes transferencias internacionales.</VAlert
          >
          <VTable v-else
            ><thead>
              <tr>
                <th>Fecha</th>
                <th>Beneficiario</th>
                <th>Monto</th>
                <th>Comisión</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transfer in transfers" :key="transfer.id">
                <td>{{ formatDate(transfer.date) }}</td>
                <td>{{ transfer.beneficiary.alias }}</td>
                <td>
                  {{ transfer.destination_amount }}
                  {{ transfer.destination_currency }}
                </td>
                <td>
                  {{ transfer.xeler_fee_amount }}
                  {{ transfer.source_account.currency }}
                </td>
                <td>
                  <VChip
                    size="small"
                    :color="transfer.is_terminal ? 'success' : 'info'"
                    >{{ transfer.status_label }}</VChip
                  >
                  <div
                    v-if="transfer.status === 'requires_provider_initiation'"
                    class="text-caption mt-1"
                  >
                    Esta transferencia requiere una verificación adicional del
                    proveedor. Contacta a soporte.
                  </div>
                </td>
                <td>
                  <VBtn
                    size="small"
                    variant="text"
                    @click="selectedTransfer = transfer"
                    >Ver detalle</VBtn
                  >
                </td>
              </tr>
            </tbody></VTable
          >
        </VCardText></VWindowItem
      >
    </VWindow>
  </VCard>

  <VDialog v-model="beneficiaryDialog" max-width="760"
    ><VCard
      ><VCardTitle>Agregar beneficiario</VCardTitle
      ><VCardText>
        <VRow
          ><VCol cols="12" md="6"
            ><VTextField v-model="beneficiaryForm.alias" label="Alias" /></VCol
          ><VCol cols="12" md="6"
            ><VSelect
              v-model="beneficiaryForm.beneficiary_type"
              label="Tipo de beneficiario"
              :items="[
                { title: 'Persona', value: 'individual' },
                { title: 'Empresa', value: 'business' },
              ]"
          /></VCol>
          <VCol
            v-if="beneficiaryForm.beneficiary_type === 'individual'"
            cols="12"
            md="6"
            ><VTextField
              v-model="beneficiaryForm.first_name"
              label="Nombre del titular" /></VCol
          ><VCol
            v-if="beneficiaryForm.beneficiary_type === 'individual'"
            cols="12"
            md="6"
            ><VTextField
              v-model="beneficiaryForm.last_name"
              label="Apellido" /></VCol
          ><VCol v-else cols="12"
            ><VTextField
              v-model="beneficiaryForm.business_name"
              label="Empresa"
          /></VCol>
          <VCol cols="12"
            ><VTextField
              v-model="beneficiaryForm.street_line_1"
              label="Dirección" /></VCol
          ><VCol cols="12"
            ><VTextField
              v-model="beneficiaryForm.street_line_2"
              label="Dirección 2 (opcional)" /></VCol
          ><VCol cols="12" md="6"
            ><VTextField v-model="beneficiaryForm.city" label="Ciudad" /></VCol
          ><VCol cols="12" md="6"
            ><VTextField
              v-model="beneficiaryForm.state"
              label="Región o estado" /></VCol
          ><VCol cols="12" md="6"
            ><VTextField
              v-model="beneficiaryForm.postal_code"
              label="Código postal" /></VCol
          ><VCol cols="12" md="6"
            ><VTextField
              v-model="beneficiaryForm.country"
              label="País (ISO alfa-3)"
              maxlength="3"
              hint="Ejemplos: COL, USA, DEU"
              persistent-hint
          /></VCol>
          <VCol cols="12"
            ><VSelect
              v-model="beneficiaryForm.currency"
              label="Cuenta destino"
              :items="[
                {
                  title: 'USD - Cuenta bancaria de Estados Unidos',
                  value: 'usd',
                },
                { title: 'EUR - IBAN / SEPA', value: 'eur' },
              ]" /></VCol
          ><VCol cols="12"
            ><VTextField v-model="beneficiaryForm.bank_name" label="Banco"
          /></VCol>
          <template v-if="beneficiaryForm.currency === 'usd'"
            ><VCol cols="12" md="6"
              ><VTextField
                v-model="beneficiaryForm.account_number"
                label="Número de cuenta"
                inputmode="numeric" /></VCol
            ><VCol cols="12" md="6"
              ><VTextField
                v-model="beneficiaryForm.routing_number"
                label="Número de ruta bancaria"
                inputmode="numeric"
                maxlength="9" /></VCol
            ><VCol cols="12"
              ><VSelect
                v-model="beneficiaryForm.checking_or_savings"
                label="Tipo de cuenta"
                :items="[
                  { title: 'Corriente', value: 'checking' },
                  { title: 'Ahorros', value: 'savings' },
                ]" /></VCol
          ></template>
          <template v-else
            ><VCol cols="12"
              ><VTextField v-model="beneficiaryForm.iban" label="IBAN" /></VCol
            ><VCol cols="12" md="6"
              ><VTextField
                v-model="beneficiaryForm.bic"
                label="BIC / SWIFT"
                maxlength="11" /></VCol
            ><VCol cols="12" md="6"
              ><VTextField
                v-model="beneficiaryForm.iban_country"
                label="País del IBAN (ISO alfa-3)"
                maxlength="3"
                hint="Ejemplos: COL, USA, DEU"
                persistent-hint /></VCol></template
        ></VRow> </VCardText
      ><VCardActions
        ><VSpacer /><VBtn variant="text" @click="beneficiaryDialog = false"
          >Cancelar</VBtn
        ><VBtn
          color="primary"
          :disabled="!beneficiaryReady"
          :loading="savingBeneficiary"
          @click="saveBeneficiary"
          >Registrar beneficiario</VBtn
        ></VCardActions
      ></VCard
    ></VDialog
  >

  <VDialog
    :model-value="selectedTransfer !== null"
    max-width="620"
    @update:model-value="
      (open) => {
        if (!open) selectedTransfer = null;
      }
    "
    ><VCard v-if="selectedTransfer"
      ><VCardTitle>Detalle de transferencia</VCardTitle
      ><VCardText>
        <VList density="compact"
          ><VListItem
            title="Beneficiario"
            :subtitle="`${selectedTransfer.beneficiary.alias || 'Beneficiario'} - ${selectedTransfer.beneficiary.bank_name || 'Banco'} ${selectedTransfer.beneficiary.account_masked || ''}`" /><VListItem
            title="Monto enviado"
            :subtitle="`${selectedTransfer.destination_amount} ${selectedTransfer.destination_currency}`" /><VListItem
            title="Medio"
            :subtitle="railLabel(selectedTransfer.payment_rail)" /><VListItem
            title="Reserva máxima"
            :subtitle="`${selectedTransfer.reservation_amount} ${selectedTransfer.source_account.currency}`"
        /></VList>
        <VDivider class="my-4" /><VTimeline side="end" density="compact"
          ><VTimelineItem dot-color="primary" size="small"
            ><div class="font-weight-medium">Solicitud recibida</div>
            <div class="text-caption">
              {{ formatDate(selectedTransfer.date) }}
            </div></VTimelineItem
          ><VTimelineItem
            :dot-color="selectedTransfer.is_terminal ? 'success' : 'info'"
            size="small"
            ><div class="font-weight-medium">
              {{ selectedTransfer.status_label }}
            </div>
            <div class="text-caption">
              {{
                formatDate(
                  selectedTransfer.processed_at ||
                    selectedTransfer.refunded_at ||
                    selectedTransfer.updated_at,
                )
              }}
            </div></VTimelineItem
          ></VTimeline
        > </VCardText
      ><VCardActions
        ><VSpacer /><VBtn variant="text" @click="selectedTransfer = null"
          >Cerrar</VBtn
        ></VCardActions
      ></VCard
    ></VDialog
  >
</template>
