<template>
  <div>
    <div class="d-flex justify-space-between align-center mx-5 mb-5">
      <h2 class="text-primary font-weight-bold">Retiros XCOP</h2>
      <VSelect
        v-model="status"
        :items="statusFilterOptions"
        label="Estado"
        clearable
        density="compact"
        hide-details
        style="max-width: 240px"
        @update:model-value="loadWithdrawals"
      />
    </div>

    <VRow class="mb-4">
      <VCol v-for="item in summaryCards" :key="item.label" cols="12" md="3">
        <VCard class="pa-3" variant="tonal">
          <div class="text-caption">{{ item.label }}</div>
          <strong>{{ item.value }} XCOP</strong>
        </VCard>
      </VCol>
    </VRow>

    <TableComponentVue
      optionsHabilit
      icon-show
      :headers="headers"
      :items="withdrawals"
      @show="openDetail"
    >
      <template #cel-attributes.status="{ data }">
        <VChip size="small" color="primary">{{ statusLabel(data.attributes.status) }}</VChip>
      </template>
    </TableComponentVue>

    <VExpansionPanels class="mt-6">
      <VExpansionPanel title="Movimientos XCOP">
        <VExpansionPanelText>
          <VTable density="compact">
            <thead><tr><th>Referencia</th><th>Tipo</th><th>Dirección</th><th>Monto</th><th>Estado</th></tr></thead>
            <tbody>
              <tr v-for="movement in movements" :key="movement.public_reference">
                <td>{{ movement.public_reference }}</td>
                <td>{{ movement.type }}</td>
                <td>{{ movement.direction }}</td>
                <td>{{ movement.amount }} XCOP</td>
                <td>{{ statusLabel(movement.status) }}</td>
              </tr>
            </tbody>
          </VTable>
        </VExpansionPanelText>
      </VExpansionPanel>

      <VExpansionPanel v-if="canAdjust" title="Ajuste administrativo">
        <VExpansionPanelText>
          <VRow>
            <VCol cols="12" md="3"><VTextField v-model="adjustment.user_id" label="ID usuario" /></VCol>
            <VCol cols="12" md="2"><VSelect v-model="adjustment.direction" :items="['credit', 'debit']" label="Dirección" /></VCol>
            <VCol cols="12" md="3"><VTextField v-model="adjustment.amount" label="Monto XCOP" /></VCol>
            <VCol cols="12" md="4"><VTextField v-model="adjustment.reason" label="Motivo" /></VCol>
          </VRow>
          <VBtn color="primary" :disabled="!adjustmentValid" @click="applyAdjustment">Aplicar ajuste</VBtn>
        </VExpansionPanelText>
      </VExpansionPanel>
    </VExpansionPanels>

    <VDialog v-model="detailOpen" max-width="760" @update:model-value="onDetailVisibility">
      <VCard v-if="selected">
        <VCardTitle>Retiro {{ selected.attributes.public_reference }}</VCardTitle>
        <VCardText>
          <VList density="compact">
            <VListItem title="Usuario" :subtitle="selected.relationships?.user?.attributes?.username ?? '-'" />
            <VListItem title="Estado" :subtitle="statusLabel(selected.attributes.status)" />
            <VListItem title="Versión" :subtitle="String(selected.attributes.version ?? '-')" />
            <VListItem title="Destino" :subtitle="destinationLabel(selected)" />
            <VListItem title="Monto" :subtitle="`${selected.attributes.amount} XCOP`" />
            <VListItem title="Fee" :subtitle="`${selected.attributes.fee} XCOP`" />
            <VListItem title="Total reservado" :subtitle="`${selected.attributes.total_debit} XCOP`" />
            <VListItem title="Solicitado" :subtitle="selected.attributes.requested_at ?? '-'" />
            <VListItem title="Procesamiento" :subtitle="selected.attributes.processing_started_at ?? '-'" />
            <VListItem title="Completado" :subtitle="selected.attributes.completed_at ?? '-'" />
            <VListItem title="Referencia bancaria" :subtitle="selected.attributes.processing_reference ?? '-'" />
            <VListItem title="TXID" :subtitle="selected.attributes.txid ?? '-'" />
          </VList>

          <VAlert v-if="operationalDestination" type="warning" variant="tonal" class="mb-3">
            <div>Destino operativo temporal</div>
            <div v-for="(value, key) in operationalDestination" :key="key">
              <strong>{{ key }}:</strong> {{ value }}
            </div>
          </VAlert>

          <div v-if="canProcess && selected.attributes.proofs?.length" class="mb-4">
            <div class="font-weight-medium">Comprobantes privados</div>
            <VBtn
              v-for="item in selected.attributes.proofs"
              :key="item.id"
              size="small"
              variant="text"
              @click="downloadProof(item.id, item.original_name)"
            >
              {{ item.original_name }}
            </VBtn>
          </div>

          <VTextField v-model="workflow.reason" label="Motivo administrativo" />
          <VTextField
            v-if="selected.attributes.destination_type !== 'polygon'"
            v-model="workflow.processing_reference"
            :label="selected.attributes.destination_type === 'bank_account'
              ? 'Referencia bancaria'
              : 'TXID o referencia de red'"
          />
          <VTextField
            v-else
            v-model="workflow.txid"
            label="TXID Polygon"
          />
          <VFileInput v-model="proof" label="Comprobante privado" accept=".pdf,image/jpeg,image/png,image/webp" />

          <div class="d-flex flex-wrap ga-2 mt-3">
            <VBtn
              v-if="canProcess && ['approved', 'processing', 'failed'].includes(selected.attributes.status)"
              variant="outlined"
              @click="loadOperationalDestination"
            >
              Ver destino operativo
            </VBtn>
            <VBtn v-if="canReview && selected.attributes.status === 'pending_review'" @click="runAction('review')">Tomar revisión</VBtn>
            <VBtn v-if="canReview && selected.attributes.status === 'under_review'" @click="runAction('approve')">Aprobar</VBtn>
            <VBtn v-if="canReview && ['pending_review','under_review','approved'].includes(selected.attributes.status)" color="error" @click="runAction('reject', true)">Rechazar</VBtn>
            <VBtn v-if="canProcess && ['approved','failed'].includes(selected.attributes.status)" @click="runAction('start-processing')">Iniciar procesamiento</VBtn>
            <VBtn v-if="canProcess && selected.attributes.status === 'processing'" @click="uploadProof">Cargar comprobante</VBtn>
            <VBtn v-if="canProcess && selected.attributes.status === 'processing'" @click="runAction('processing-evidence')">Registrar referencia/TXID</VBtn>
            <VBtn v-if="canProcess && selected.attributes.status === 'processing'" color="success" @click="runAction('complete')">Completar</VBtn>
            <VBtn v-if="canProcess && selected.attributes.status === 'processing'" color="error" @click="runAction('fail', true)">Marcar fallo</VBtn>
            <VBtn v-if="canProcess && selected.attributes.status === 'failed'" color="warning" @click="runAction('refund', true)">Reembolsar</VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { computed, onMounted, reactive, ref } from "vue";
import TableComponentVue from "@/components/global/TableComponent.vue";
import type { Head } from "@/interfaces/TableComponent.helper";
import type { WithdrawalXCOP } from "@/interfaces/TransactionXCOP/TransactionXCOP.model";
import type { XcopMovement } from "@/stores/XcopStore";
import { helperStore } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";
import { greaterThanDecimal, normalizeDecimalStrict } from "@/utils/decimal";
import { statusLabel, statusOptions } from "@/utils/statusLabels";

interface AdminSummary {
  total_user_liability: string;
  pending_withdrawals: string;
  processed_withdrawals: string;
  fees_collected: string;
}

const helper = helperStore();
const user = UserStore();
const withdrawals = ref<WithdrawalXCOP[]>([]);
const movements = ref<XcopMovement[]>([]);
const summary = ref<AdminSummary | null>(null);
const status = ref<string | null>(null);
const selected = ref<WithdrawalXCOP | null>(null);
const detailOpen = ref(false);
const proof = ref<File[] | File | null>(null);
const operationalDestination = ref<Record<string, string | null> | null>(null);
const workflow = reactive({ reason: "", processing_reference: "", txid: "" });
const adjustment = reactive({ user_id: "", direction: "credit", amount: "", reason: "" });

const statuses = ["pending_review", "under_review", "approved", "processing", "completed", "rejected", "canceled", "failed"];
const statusFilterOptions = statusOptions(statuses);
const canReview = computed(() => user.hasPermission("wallet_xcop.review"));
const canProcess = computed(() => user.hasPermission("wallet_xcop.process"));
const canAdjust = computed(() => user.hasPermission("wallet_xcop.adjust"));
const adjustmentValid = computed(() => {
  try {
    return Boolean(adjustment.user_id && adjustment.reason.trim().length >= 10 && greaterThanDecimal(adjustment.amount, "0"));
  } catch {
    return false;
  }
});
const summaryCards = computed(() => [
  { label: "Pasivo usuarios", value: summary.value?.total_user_liability ?? "0" },
  { label: "Retiros pendientes", value: summary.value?.pending_withdrawals ?? "0" },
  { label: "Retiros procesados", value: summary.value?.processed_withdrawals ?? "0" },
  { label: "Fees recaudados", value: summary.value?.fees_collected ?? "0" },
]);

const headers: Head[] = [
  { name: "Referencia", value: "attributes.public_reference" },
  { name: "Usuario", value: "relationships.user.attributes.username" },
  { name: "Destino", value: "attributes.destination_type" },
  { name: "Monto", value: "attributes.amount" },
  { name: "Estado", value: "attributes.status" },
];

const loadWithdrawals = async () => {
  const response = await helper.http("withdrawal/xcop", "get", {
    params: status.value ? { status: status.value } : {},
  });
  withdrawals.value = response.data.response?.data ?? response.data.response ?? [];
};
const loadAdminData = async () => {
  const [summaryResponse, movementsResponse] = await Promise.all([
    helper.http("admin/xcop/summary", "get"),
    helper.http("admin/xcop/movements", "get", { params: { per_page: 20 } }),
  ]);
  summary.value = summaryResponse.data;
  movements.value = movementsResponse.data.data ?? [];
};
onMounted(() => Promise.all([loadWithdrawals(), loadAdminData()]));

const openDetail = async (item: WithdrawalXCOP) => {
  operationalDestination.value = null;
  const response = await helper.http(`withdrawal/xcop/${item.id}`, "get");
  selected.value = response.data.response;
  workflow.reason = "";
  workflow.processing_reference = item.attributes.processing_reference ?? "";
  workflow.txid = item.attributes.txid ?? "";
  proof.value = null;
  detailOpen.value = true;
};
const onDetailVisibility = (visible: boolean) => {
  if (visible) return;
  selected.value = null;
  operationalDestination.value = null;
  workflow.reason = "";
  workflow.processing_reference = "";
  workflow.txid = "";
  proof.value = null;
};
const destinationLabel = (item: WithdrawalXCOP) =>
  item.attributes.destination.masked_account ??
  item.attributes.destination.masked_address ??
  item.attributes.destination_type;

const runAction = async (action: string, needsReason = false) => {
  if (!selected.value) return;
  if (needsReason && workflow.reason.trim().length < 10) {
    helper.showNotify("Ingresa un motivo de al menos 10 caracteres.", { type: "error" });
    return;
  }
  const data = {
    ...(needsReason ? { reason: workflow.reason.trim() } : {}),
    ...(selected.value.attributes.destination_type === "polygon" && workflow.txid
      ? { txid: workflow.txid.trim() }
      : {}),
    ...(selected.value.attributes.destination_type !== "polygon" && workflow.processing_reference
      ? { processing_reference: workflow.processing_reference.trim() }
      : {}),
  };
  const scope = `xcop-withdrawal-${action}-${selected.value.id}`;
  const response = await authorizeWithTwoFactor(helper.http.bind(helper, `withdrawal/xcop/${selected.value.id}/${action}`, "post", { data }, "", false, {
    idempotent: true,
    idempotencyKey: createOperationKey(scope, data),
    financialScope: "finance.xcop",
  }), "finance.xcop");
  clearOperationKey(scope);
  if (action === "start-processing") {
    selected.value = response.data.response;
    await loadOperationalDestination();
    await Promise.all([loadWithdrawals(), loadAdminData()]);
    return;
  }
  detailOpen.value = false;
  await Promise.all([loadWithdrawals(), loadAdminData()]);
};

const loadOperationalDestination = async () => {
  if (!selected.value || !canProcess.value) return;
  operationalDestination.value = null;
  const destinationResponse = await helper.http(
    `admin/xcop/withdrawals/${selected.value.attributes.public_reference}/operational-destination`,
    "get",
    {},
    "",
    true,
    { financialScope: "finance.xcop" },
  );
  operationalDestination.value = destinationResponse.data.data;
};

const uploadProof = async () => {
  if (!selected.value) return;
  const file = Array.isArray(proof.value) ? proof.value[0] : proof.value;
  if (!file) {
    helper.showNotify("Selecciona un comprobante.", { type: "error" });
    return;
  }
  const data = new FormData();
  data.append("proof", file);
  const scope = `xcop-withdrawal-proof-${selected.value.id}`;
  await authorizeWithTwoFactor(helper.http.bind(helper, `withdrawal/xcop/${selected.value.id}/proofs`, "post", {
    data,
    headers: { "Content-Type": "multipart/form-data" },
  }, "", false, {
    idempotent: true,
    idempotencyKey: createOperationKey(scope, { name: file.name, size: file.size }),
    financialScope: "finance.xcop",
  }), "finance.xcop");
  clearOperationKey(scope);
  const detailResponse = await helper.http(`withdrawal/xcop/${selected.value.id}`, "get");
  selected.value = detailResponse.data.response;
};

const downloadProof = async (proofId: number, originalName: string) => {
  if (!selected.value || !canProcess.value) return;
  const response = await helper.http(
    `withdrawal/xcop/${selected.value.id}/proofs/${proofId}`,
    "get",
    { responseType: "blob" },
    "",
    true,
    { financialScope: "finance.xcop" },
  );
  const url = URL.createObjectURL(response.data);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = originalName;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
};

const applyAdjustment = async () => {
  const scope = "xcop-admin-adjustment";
  const operationPayload = {
    user_id: Number(adjustment.user_id),
    type: adjustment.direction === "credit"
      ? "administrative_credit"
      : "administrative_debit",
    amount: normalizeDecimalStrict(adjustment.amount),
    reason: adjustment.reason.trim(),
  };
  const operationKey = createOperationKey(scope, operationPayload);
  const data = {
    ...operationPayload,
    client_operation_key: operationKey,
  };
  await authorizeWithTwoFactor(helper.http.bind(helper, "admin/xcop/adjustments", "post", { data }, "", false, {
    idempotent: true,
    idempotencyKey: operationKey,
    financialScope: "finance.xcop",
  }), "finance.xcop");
  clearOperationKey(scope);
  adjustment.user_id = "";
  adjustment.amount = "";
  adjustment.reason = "";
  await loadAdminData();
};
</script>
