<template>
  <div v-if="!numTransaction || !order">
    No existe transaction con ese numero
  </div>
  <div v-else>
    <VRow class="d-flex align-center" :class="$vuetify.display.mdAndDown ? 'justify-center' : ''">
      <div class="text-18 font-weight-bold text-table">
        Detalles transacción:
        <span class="text-primary">{{ order.attributes.tranx_no }}</span>
      </div>
      <OrderBackofficeControls
        class="ml-6"
        :order-id="order.id"
        :actions="order.attributes.backoffice_actions"
        @refreshed="getOrder"
      />
      <div class="text-center ml-6" v-if="!order.attributes.backoffice_actions && canUpdateOrders && !verifyOrderCompleted && $vuetify.display.lgAndUp">
        <BtnWithModalComponent
          :color-btn="order.attributes.processed_by ? 'warning' : 'primary'"
          :text-btn="order.attributes.processed_by ? 'Ceder Orden' : 'Tomar Transacción'"
          :title-modal="order.attributes.processed_by ? '¿Quieres ceder esta orden?' : '¿Quieres tomar esta orden?'"
          :icon="QuestionIcon"
          :color-icon="order.attributes.processed_by ? 'warning' : 'primary'"
          :btn-modal="order.attributes.processed_by ? 'Sí, cederla' : 'Sí, tomarla'"
          @click:btn-modal="order.attributes.processed_by ? releasseOrder() : takeOrder()"
        />
      </div>
    </VRow>

    <BtnWithModalComponent
      only-modal
      v-model="openPrepareSuccess"
      title-modal="Código #2 generado"
      text-modal="El segundo código fue generado y enviado al usuario."
      :icon="CheckIcon"
      color-icon="ok-3"
    />
    <BtnWithModalComponent
      only-modal
      v-model="openSaleProofSuccess"
      title-modal="Soporte cargado"
      text-modal="El soporte del pago fiat quedó registrado correctamente."
      :icon="CheckIcon"
      color-icon="ok-3"
    />
    <BtnWithModalComponent
      only-modal
      v-model="openSaleCompleteSuccess"
      title-modal="Pago confirmado"
      text-modal="La venta quedó marcada como pagada correctamente."
      :icon="CheckIcon"
      color-icon="ok-3"
    />

    <VRow dense v-if="!$vuetify.display.mdAndDown">
      <VCol />
      <VCol class="d-flex justify-center text-table font-weight-bold">
        <div class="cursor-pointer d-flex align-center" @click="showDetailPayment = !showDetailPayment">
          <VIcon :class="showDetailPayment ? '' : 'rotate-270'" :icon="SelectIcon" />
          <span>Mostrar Detalle</span>
        </div>
      </VCol>
    </VRow>

    <VRow>
      <VCol :cols="$vuetify.display.mdAndDown ? 12 : 6">
        <div class="mx-auto" style="max-width: 421px">
          <general-detail />
          <div class="text-center ml-6 mt-3" v-if="!order.attributes.backoffice_actions && canUpdateOrders && !verifyOrderCompleted && $vuetify.display.mdAndDown">
            <BtnWithModalComponent
              :color-btn="order.attributes.processed_by ? 'warning' : 'primary'"
              :text-btn="order.attributes.processed_by ? 'Ceder Orden' : 'Tomar Transacción'"
              :title-modal="order.attributes.processed_by ? '¿Quieres ceder esta orden?' : '¿Quieres tomar esta orden?'"
              :icon="QuestionIcon"
              :color-icon="order.attributes.processed_by ? 'warning' : 'primary'"
              :btn-modal="order.attributes.processed_by ? 'Sí, cederla' : 'Sí, tomarla'"
              @click:btn-modal="order.attributes.processed_by ? releasseOrder() : takeOrder()"
            />
          </div>
          <user-detail class="mt-3" />
          <UploadImageComponent
            v-if="canUploadSalePaymentProof"
            :sizeImage="421"
            style="width: 421px"
            text="Subir soporte de pago fiat"
            v-model="voucher"
          />
          <div v-if="canUploadSalePaymentProof" class="mt-3">
            <input-component v-model="paymentReference" name="Referencia del pago" />
            <input-component v-model="paymentNote" name="Nota operativa" />
            <div class="text-body-2 mt-2">Monto autorizado: {{ order.attributes.final_fiat_payout }} COP</div>
          </div>
          <div
            v-if="order?.attributes.admin_complete_sale_payment_block_reason"
            class="text-table rounded-lg pa-4 mt-3"
            style="background-color: rgba(239, 93, 168, 0.08)"
          >
            {{ order.attributes.admin_complete_sale_payment_block_reason }}
          </div>
          <div
            v-if="order?.attributes.manual_review_reason || order?.attributes.manual_review_action_hint"
            class="text-table rounded-lg pa-4 mt-3"
            style="background-color: rgba(255, 179, 0, 0.12)"
          >
            <div class="font-weight-bold mb-1">Revision manual cripto</div>
            <div v-if="order?.attributes.manual_review_reason">Motivo: {{ order.attributes.manual_review_reason }}</div>
            <div v-if="order?.attributes.manual_review_action_hint" class="mt-1">
              {{ order.attributes.manual_review_action_hint }}
            </div>
            <div class="mt-2 text-body-2">
              <span v-if="order?.attributes.can_retry_address_assignment">Se puede reintentar asignacion de direccion.</span>
              <span v-else-if="order?.attributes.can_retry_payout">Se puede revisar y reintentar payout.</span>
              <span v-else-if="order?.attributes.can_close_manual_review">Requiere cierre manual controlado.</span>
            </div>
          </div>
          <section
            v-if="hasSellFinancialActions"
            class="text-table rounded-lg pa-4 mt-3"
            style="border: 1px solid rgba(46, 125, 50, 0.25)"
          >
            <div class="font-weight-bold mb-3">Acciones financieras de venta</div>

            <div v-if="order.attributes.principal_payout_economically_sent" class="mb-4">
              <div class="font-weight-medium">Payout enviado</div>
                <div v-if="!order.attributes.principal_payout_documentation_valid" class="text-error text-body-2 mt-1">
                  Incidente documental: comprobante invalido
                </div>
                <div v-if="order.attributes.proof_repair_status === 'reserved' || order.attributes.proof_repair_status === 'storing'" class="text-body-2 mt-1">
                  Reparacion de comprobante en curso
                </div>
              <template v-if="order.attributes.can_repair_payment_proof && order.attributes.sell_fiat_payout_id">
                <input-component v-model="principalRepairReason" name="Motivo de reparacion" />
                <UploadImageComponent text="Nuevo comprobante" v-model="principalRepairProof" />
                <VBtnSecondary
                  :disabled="!principalRepairReason || !isBlob(principalRepairProof)"
                  @click="requestRepairProof(order.attributes.sell_fiat_payout_id, principalRepairProof, principalRepairReason)"
                >
                  Reparar comprobante
                </VBtnSecondary>
              </template>
            </div>

            <div v-if="order.attributes.can_reconcile_deposit_by_txid" class="mb-4">
              <div class="font-weight-medium mb-2">Conciliar por TXID</div>
              <input-component v-model="reconcileTxid" name="TXID" />
              <input-component v-model="reconcileIndex" name="Posicion / output opcional" />
              <input-component v-model="reconcileReason" name="Motivo" />
              <VBtnSecondary :disabled="!reconcileTxid || !reconcileReason" @click="requestReconcileIncoming">
                Consultar transferencia
              </VBtnSecondary>
            </div>
            <div
              v-else-if="order.attributes.reconcile_deposit_block_reason"
              class="text-body-2 mb-4"
            >
              Conciliacion por TXID no disponible: {{ order.attributes.reconcile_deposit_block_reason }}
            </div>

            <div v-if="order.attributes.can_submit_manual_incoming_verification" class="mb-4">
              <div class="font-weight-medium mb-2">Registrar verificacion reforzada</div>
              <input-component v-model="manualTxid" name="TXID" />
              <input-component v-model="manualEventIndex" name="Posicion / output" />
              <input-component v-model="manualAmount" name="Monto observado" />
              <input-component v-model="manualDestination" name="Direccion observada" />
              <input-component v-model="manualContract" name="Contrato token" />
              <input-component v-model="manualReason" name="Motivo" />
              <UploadImageComponent text="Evidencia privada" v-model="manualEvidence" />
              <VBtnSecondary
                :disabled="!manualTxid || manualEventIndex === '' || !manualAmount || !manualDestination || !manualReason || !manualEvidenceReady"
                @click="requestSubmitManualIncoming"
              >
                Enviar a segunda aprobacion
              </VBtnSecondary>
            </div>

            <div v-if="order.attributes.can_approve_manual_incoming_verification" class="mb-4">
              <div class="font-weight-medium mb-2">Segunda aprobacion</div>
              <VBtnSecondary
                v-if="order.attributes.can_view_manual_incoming_evidence"
                class="mb-2"
                @click="requestViewManualIncomingEvidence"
              >
                Consultar evidencia
              </VBtnSecondary>
              <input-component v-model="manualReviewReason" name="Motivo de revision" />
              <VBtnSecondary :disabled="!manualReviewReason" @click="requestReviewManualIncoming('approve')">
                Aprobar evidencia
              </VBtnSecondary>
              <VBtnSecondary class="ml-2" :disabled="!manualReviewReason" @click="requestReviewManualIncoming('reject')">
                Rechazar
              </VBtnSecondary>
            </div>

            <div v-if="order.attributes.can_resolve_amount_variance" class="mb-4">
              <div class="font-weight-medium mb-2">Resolver diferencia de monto</div>
              <select v-model="varianceAction" class="w-100 pa-2 mb-2">
                <option value="keep_in_review">Mantener en revision</option>
                <option value="accept_confirmed_amount">Aceptar monto confirmado</option>
                <option value="cancel_order">Cancelar antes de recibir cripto</option>
              </select>
              <input-component v-model="varianceReason" name="Motivo" />
              <VBtnSecondary :disabled="!varianceReason" @click="requestResolveVariance">Aplicar decision</VBtnSecondary>
            </div>

            <div v-for="incident in order.attributes.late_deposits || []" :key="incident.id" class="mb-4">
              <div class="font-weight-medium mb-2">Deposito tardio #{{ incident.id }}</div>
              <div class="text-body-2 mb-2">
                TXID: {{ incident.txid || "Pendiente" }} · Monto: {{ incident.amount }} ·
                Confirmaciones: {{ incident.confirmations }}/{{ incident.required_confirmations }} ·
                Estado: {{ lateDepositLabel(incident.late_deposit_status) }}
              </div>
              <div v-if="incident.adjustment_payout_id" class="text-body-2 mb-2">
                Ajuste asociado: #{{ incident.adjustment_payout_id }} ·
                {{ incident.adjustment_economically_sent ? "Payout enviado" : "Payout reservado" }}
              </div>
               <div v-if="incident.proof_integrity_status === 'manual_review'" class="text-body-2 mb-2 text-error">
                  Comprobante invalido
                </div>
                <div v-if="incident.proof_repair_status === 'reserved' || incident.proof_repair_status === 'storing'" class="text-body-2 mb-2">
                  Reparacion de comprobante en curso
                </div>
              <template v-if="incident.can_repair_payment_proof && incident.adjustment_payout_id">
                <input-component v-model="lateRepairReasons[incident.id]" name="Motivo de reparacion" />
                <UploadImageComponent text="Nuevo comprobante" v-model="lateRepairProofs[incident.id]" />
                <VBtnSecondary
                  :disabled="!lateRepairReasons[incident.id] || !isBlob(lateRepairProofs[incident.id])"
                  @click="requestRepairProof(incident.adjustment_payout_id, lateRepairProofs[incident.id], lateRepairReasons[incident.id])"
                >
                  Reparar comprobante
                </VBtnSecondary>
              </template>
              <div v-if="incident.resolved_at" class="text-body-2 mb-2">Resuelto: {{ incident.resolved_at }}</div>
              <template v-if="incident.can_process_adjustment">
                <input-component v-model="latePaymentReferences[incident.id]" name="Referencia del ajuste" />
                <input-component v-model="lateReasons[incident.id]" name="Motivo" />
                <UploadImageComponent text="Comprobante del ajuste" v-model="lateProofs[incident.id]" />
                <VBtnSecondary
                  :disabled="!latePaymentReferences[incident.id] || !lateReasons[incident.id] || !isBlob(lateProofs[incident.id])"
                  @click="requestSettleLateDeposit(incident.id)"
                >
                  Registrar ajuste fiat
                </VBtnSecondary>
              </template>
            </div>
          </section>
          <div class="my-5" />
        </div>
      </VCol>

      <VCol v-if="$vuetify.display.mdAndDown" cols="12" class="d-flex justify-center text-table font-weight-bold">
        <div class="cursor-pointer d-flex align-center" @click="showDetailPayment = !showDetailPayment">
          <VIcon :class="showDetailPayment ? '' : 'rotate-270'" :icon="SelectIcon" />
          <span>Mostrar Detalle</span>
        </div>
      </VCol>

      <VCol :cols="$vuetify.display.mdAndDown ? 12 : 6">
        <div class="mx-auto" v-if="showDetailPayment" style="max-width: 400px">
          <PaymentDetail />
          <div class="my-5" />
          <CronometerComponent v-if="order.attributes.type == OrderTypes.VENTA" :cronP="order.attributes.estimated_time" />
          <div class="my-5" />
          <detail-account-sell v-if="order.attributes.type == OrderTypes.VENTA" />
          <div class="my-5" />
          <amount-detail v-if="order.attributes.type == OrderTypes.VENTA" />
          <OrderFeeAdjustmentPanel />
          <div class="my-5" />
          <qr-buy
            v-if="canUpdateOrders && verifyOrderTakeForUserAuth && !verifyOrderCompleted && order.attributes.type == OrderTypes.COMPRA"
            @external-pay="giveExternal"
          />
        </div>
      </VCol>
    </VRow>

    <VRow
      v-if="
        order?.attributes?.type === 'Compra' &&
        order?.relationships?.images?.length
      "
    >
      <VCol cols="12">
        <VCard variant="outlined" class="pa-4">
          <div class="text-subtitle-1 font-weight-medium text-center">
            Comprobante enviado por el cliente
          </div>

          <AuthenticatedVoucherDownload
            :images="order.relationships.images"
          />
        </VCard>
      </VCol>
    </VRow>

    <VRow v-if="canUpdateOrders && !verifyOrderCompleted">
      <VCol>
        <div class="text-center" v-if="canUploadSalePaymentProof">
          <VBtnSecondary :disabled="voucher == '' || !paymentReference || salePaymentProofLoading" @click="requestSaleFiatPayout">
            Registrar pago y comprobante
          </VBtnSecondary>
        </div>
      </VCol>
      <VCol>
        <div class="text-center" v-if="verifyOrderTakeForUserAuth">
          <BtnWithModalComponent
            v-if="order.attributes.can_admin_prepare_cash_order"
            color-btn="warning"
            text-btn="Validar código #1"
            title-modal="Validar código #1 del punto"
            :icon="QuestionIcon"
            color-icon="warning"
            btn-modal="Validar"
            @click:btn-modal="prepareCashOrder"
          >
            <template #contentModal>
              <input-component v-model="codeOneConfirmation" name="" />
            </template>
          </BtnWithModalComponent>

          <BtnWithModalComponent
            v-if="canCompleteSalePayment"
            color-btn="primary"
            text-btn="Marcar pago realizado"
            title-modal="Confirmar pago fiat"
            :icon="QuestionIcon"
            color-icon="warning"
            btn-modal="Sí, confirmar"
            @click:btn-modal="requestCompleteSalePayment"
          />
        </div>
      </VCol>
    </VRow>
  </div>
</template>

<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";
const { authorizeWithTwoFactor } = useTwoFactorGuard();
import AuthenticatedVoucherDownload from "@/components/orders/AuthenticatedVoucherDownload.vue";
import InputComponent from "@/components/InputComponent.vue";
import { TransactionStore } from "@/stores/TransactionStore";
import { storeToRefs } from "pinia";
import GeneralDetail from "./TransactionDetail/GeneralDetail.vue";
import UserDetail from "@/views/admin/transactions/TransactionDetail/UserDetail.vue";
import UploadImageComponent from "@/views/user/Kyc/components/UploadImageComponent.vue";
import SelectIcon from "@/assets/icons/SelectIcon.vue";
import PaymentDetail from "@/views/admin/transactions/TransactionDetail/PaymentDetail.vue";
import CronometerComponent from "@/views/admin/transactions/TransactionDetail/CronometerComponent.vue";
import DetailAccountSell from "./TransactionDetail/DetailAccountSell.vue";
import { computed, ref, watch } from "vue";
import AmountDetail from "./TransactionDetail/AmountDetail.vue";
import OrderFeeAdjustmentPanel from "./TransactionDetail/OrderFeeAdjustmentPanel.vue";
import { getUserAuth, helperStore, itemHaveImages } from "@/helper";
import BtnWithModalComponent from "@/components/BtnWithModalComponent.vue";
import QuestionIcon from "@/assets/icons/QuestionIcon.vue";
import CheckIcon from "@/assets/icons/CheckFilledIcon.vue";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import QrBuy from "./TransactionDetail/QrBuy.vue";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";
import { UserStore } from "@/stores/UserStore";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";
import OrderBackofficeControls from "@/components/admin/OrderBackofficeControls.vue";

const props = defineProps<{
  numTransaction: string;
}>();

const helper = helperStore();
const transactionStore = TransactionStore();
const userStore = UserStore();
const twoFactor = TwoFactorAuthStore();
const canUpdateOrders = computed(() => userStore.hasPermission("orders.updated"));
const { order } = storeToRefs(transactionStore);

const codeOneConfirmation = ref("");
const voucher = ref<Blob | string>("");
const paymentReference = ref("");
const paymentNote = ref("");
const showDetailPayment = ref(true);
const openPrepareSuccess = ref(false);
const openSaleProofSuccess = ref(false);
const openSaleCompleteSuccess = ref(false);
const salePaymentProofLoading = ref(false);
const completeSalePaymentLoading = ref(false);
const reconcileTxid = ref("");
const reconcileIndex = ref("");
const reconcileReason = ref("");
const manualTxid = ref("");
const manualEventIndex = ref("");
const manualAmount = ref("");
const manualDestination = ref("");
const manualContract = ref("");
const manualReason = ref("");
const manualEvidence = ref<Blob | string>("");
const manualReviewReason = ref("");
const varianceAction = ref("keep_in_review");
const varianceReason = ref("");
const latePaymentReferences = ref<Record<number, string>>({});
const lateReasons = ref<Record<number, string>>({});
const lateProofs = ref<Record<number, Blob | string>>({});
const principalRepairReason = ref("");
const principalRepairProof = ref<Blob | string>("");
const lateRepairReasons = ref<Record<number, string>>({});
const lateRepairProofs = ref<Record<number, Blob | string>>({});

const getOrder = () => transactionStore.getAdminOrderByTransaction(props.numTransaction);
getOrder();

watch(order, nuevo => {
  if (nuevo) {
    const image = itemHaveImages(order.value?.relationships?.images);
    voucher.value = image === false ? "" : image;
  }
});

const verifyOrderTakeForUserAuth = computed(() => {
  return order.value?.attributes.processed_by == getUserAuth().id;
});

const verifyOrderCompleted = computed(() => {
  return Boolean(order.value?.attributes.is_terminal);
});

const canUploadSalePaymentProof = computed(() => {
  return Boolean(
    canUpdateOrders.value &&
      verifyOrderTakeForUserAuth.value &&
      order.value?.attributes.can_process_fiat_payout
  );
});

const canCompleteSalePayment = computed(() => {
  return Boolean(
    canUpdateOrders.value &&
      verifyOrderTakeForUserAuth.value &&
      !completeSalePaymentLoading.value &&
      order.value?.attributes.can_complete_sell_order
  );
});

const hasSellFinancialActions = computed(() => Boolean(
  order.value?.attributes.can_reconcile_deposit_by_txid ||
  order.value?.attributes.reconcile_deposit_block_reason ||
  order.value?.attributes.can_submit_manual_incoming_verification ||
  order.value?.attributes.can_approve_manual_incoming_verification ||
  order.value?.attributes.can_view_manual_incoming_evidence ||
  order.value?.attributes.can_resolve_amount_variance ||
  order.value?.attributes.principal_payout_economically_sent ||
  order.value?.attributes.can_repair_payment_proof ||
  (order.value?.attributes.late_deposits?.length ?? 0) > 0
));
const manualEvidenceReady = computed(() => manualEvidence.value instanceof Blob);
const isBlob = (value: Blob | string | undefined): value is Blob => value instanceof Blob;
const lateDepositLabel = (status: string) => ({
  resolved: "Resuelto",
  dropped_before_confirmation: "No confirmado / descartado",
  reorged_after_adjustment: "Recuperacion financiera pendiente",
  reconfirmed_after_adjustment: "Reconfirmado y resuelto",
  pending: "Pendiente de confirmacion",
  confirmed_unresolved: "Confirmado, ajuste pendiente",
  adjustment_pending: "Comprobante de ajuste pendiente",
  reorged_before_adjustment: "Reorg revertido antes del ajuste",
  reappeared_pending: "Deposito reaparecido y confirmando",
  financial_recovery_pending: "Recuperacion financiera pendiente",
}[status] ?? status);

const runFinancialAction = (fn: () => Promise<void>) => {
  twoFactor.modal = true;
  twoFactor.newFlow = true;
  twoFactor.requestedScope = "finance.crypto_payout";
  twoFactor.callback = { fn };
};

const requestReconcileIncoming = () => runFinancialAction(async () => {
  const data = {
    txid: reconcileTxid.value,
    output_index: reconcileIndex.value === "" ? undefined : Number(reconcileIndex.value),
    reason: reconcileReason.value,
    two_factor_code: localStorage.getItem("2fa") ? twoFactor.code : undefined,
  };
  const scope = `sell-reconcile-${order.value!.id}-${reconcileTxid.value}`;
  await helper.http(`admin/crypto/orders/${order.value!.id}/reconcile-incoming`, "post", { data }, "", false, {
    idempotent: true, idempotencyKey: createOperationKey(scope, data), financialAction: true,
  });
  clearOperationKey(scope);
  await getOrder();
});

const requestSubmitManualIncoming = () => runFinancialAction(async () => {
  if (!(manualEvidence.value instanceof Blob)) return;
  const data = new FormData();
  data.append("txid", manualTxid.value);
  data.append("event_index", manualEventIndex.value);
  data.append("observed_amount", manualAmount.value);
  data.append("destination", manualDestination.value);
  if (manualContract.value) data.append("token_contract", manualContract.value);
  data.append("reason", manualReason.value);
  data.append("evidence", manualEvidence.value);
  const scope = `sell-manual-incoming-${order.value!.id}-${manualTxid.value}`;
  const key = createOperationKey(scope, { order_id: order.value!.id, txid: manualTxid.value });
  data.append("idempotency_key", key);
  if (localStorage.getItem("2fa")) data.append("two_factor_code", twoFactor.code);
  await helper.http(`admin/crypto/orders/${order.value!.id}/manual-incoming-verifications`, "post", { data }, "", false, {
    idempotent: true, idempotencyKey: key, financialAction: true,
  });
  clearOperationKey(scope);
  await getOrder();
});

const requestReviewManualIncoming = (action: "approve" | "reject") => runFinancialAction(async () => {
  const verificationId = order.value!.attributes.manual_incoming_verification_id;
  const data = {
    action,
    reason: manualReviewReason.value,
    two_factor_code: localStorage.getItem("2fa") ? twoFactor.code : undefined,
  };
  const scope = `sell-manual-review-${verificationId}-${action}`;
  await helper.http(`admin/crypto/manual-incoming-verifications/${verificationId}/review`, "post", { data }, "", false, {
    idempotent: true, idempotencyKey: createOperationKey(scope, data), financialAction: true,
  });
  clearOperationKey(scope);
  await getOrder();
});

const requestViewManualIncomingEvidence = () => runFinancialAction(async () => {
  const verificationId = order.value!.attributes.manual_incoming_verification_id;
  const response = await helper.http(
    `admin/crypto/manual-incoming-verifications/${verificationId}/evidence`,
    "post",
    {
      data: {
        two_factor_code: localStorage.getItem("2fa") ? twoFactor.code : undefined,
      },
      responseType: "blob",
    },
    "",
    false,
    { financialAction: true },
  );
  const url = URL.createObjectURL(response.data);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
});

const requestResolveVariance = () => runFinancialAction(async () => {
  const data = {
    action: varianceAction.value,
    reason: varianceReason.value,
    two_factor_code: localStorage.getItem("2fa") ? twoFactor.code : undefined,
  };
  const scope = `sell-variance-${order.value!.id}-${varianceAction.value}`;
  await helper.http(`admin/crypto/orders/${order.value!.id}/sell-variance/resolve`, "post", { data }, "", false, {
    idempotent: true, idempotencyKey: createOperationKey(scope, data), financialAction: true,
  });
  clearOperationKey(scope);
  await getOrder();
});

const requestSettleLateDeposit = (transactionId: number) => runFinancialAction(async () => {
  const proof = lateProofs.value[transactionId];
  if (!(proof instanceof Blob)) return;
  const data = new FormData();
  data.append("action", "settle_additional_fiat");
  data.append("payment_reference", latePaymentReferences.value[transactionId]);
  data.append("reason", lateReasons.value[transactionId]);
  data.append("proof", proof);
  const scope = `sell-late-adjustment-${transactionId}`;
  const key = createOperationKey(scope, { transaction_id: transactionId });
  data.append("idempotency_key", key);
  if (localStorage.getItem("2fa")) data.append("two_factor_code", twoFactor.code);
  await helper.http(`admin/crypto/orders/${order.value!.id}/late-deposits/${transactionId}/settle`, "post", { data }, "", false, {
    idempotent: true, idempotencyKey: key, financialAction: true,
  });
  clearOperationKey(scope);
  await getOrder();
});

const requestRepairProof = (payoutId: number, proof: Blob | string | undefined, reason: string) => {
  if (!(proof instanceof Blob) || !reason) return;
  runFinancialAction(async () => {
    const data = new FormData();
    data.append("proof", proof);
    data.append("reason", reason);
    const scope = `sell-proof-repair-${payoutId}`;
    const key = createOperationKey(scope, { payout_id: payoutId, reason });
    data.append("idempotency_key", key);
    if (localStorage.getItem("2fa")) data.append("two_factor_code", twoFactor.code);
    await helper.http(
      `admin/crypto/orders/${order.value!.id}/sell-fiat-payout/${payoutId}/repair-proof`,
      "post",
      { data },
      "",
      false,
      { idempotent: true, idempotencyKey: key, financialAction: true },
    );
    clearOperationKey(scope);
    await getOrder();
  });
};

const takeOrder = async () => {
  await authorizeWithTwoFactor(transactionStore.takeOrder.bind(transactionStore, order.value!.id), "finance.order_admin");
  getOrder();
};

const releasseOrder = async () => {
  await authorizeWithTwoFactor(transactionStore.releaseOrder.bind(transactionStore, order.value!.id), "finance.order_admin");
  getOrder();
};

const requestSaleFiatPayout = () => {
  if (!canUploadSalePaymentProof.value || !paymentReference.value || !(voucher.value instanceof Blob)) return;
  twoFactor.modal = true;
  twoFactor.newFlow = true;
  twoFactor.requestedScope = "finance.crypto_payout";
  twoFactor.callback = { fn: uploadSalePaymentProof };
};

const uploadSalePaymentProof = async () => {
  if (salePaymentProofLoading.value) {
    return;
  }
  const url = `admin/crypto/orders/${order.value!.id}/sell-fiat-payout`;
  const data = new FormData();
  data.append("proof", voucher.value as Blob);
  data.append("payment_reference", paymentReference.value);
  data.append("note", paymentNote.value);
  const scope = `admin-sale-payment-proof-${order.value!.id}`;
  const operationKey = createOperationKey(scope, {
    order_id: order.value!.id,
    payment_reference: paymentReference.value,
  });
  data.append("idempotency_key", operationKey);
  if (localStorage.getItem("2fa")) data.append("two_factor_code", twoFactor.code);

  salePaymentProofLoading.value = true;
  try {
    await helper.http(url, "post", { data }, "", false, {
      idempotent: true,
      idempotencyKey: operationKey,
      financialAction: true,
    });
    clearOperationKey(scope);
    openSaleProofSuccess.value = true;
    getOrder();
  } finally {
    salePaymentProofLoading.value = false;
  }
};

const prepareCashOrder = async () => {
  const url = "order/preparing/code/vefify";
  const data = {
    order_id: order.value?.id,
    code_one: codeOneConfirmation.value,
  };
  const scope = `order-prepare-${order.value?.id}`;

  await authorizeWithTwoFactor(helper.http.bind(helper, url, "post", { data }, "", false, {
    idempotent: true,
    idempotencyKey: createOperationKey(scope, data),
    financialAction: true,
  }), "finance.order_admin");
  clearOperationKey(scope);
  openPrepareSuccess.value = true;
  getOrder();
};

const completeSalePayment = async () => {
  if (completeSalePaymentLoading.value) {
    return;
  }
  const url = `admin/orders/${order.value?.id}/sale-payment-complete`;
  const scope = `admin-sale-payment-complete-${order.value?.id}`;

  completeSalePaymentLoading.value = true;
  try {
    const data = localStorage.getItem("2fa") ? { two_factor_code: twoFactor.code } : {};
    await helper.http(url, "post", { data }, "", false, {
      idempotent: true,
      idempotencyKey: createOperationKey(scope, { order_id: order.value?.id }),
      financialAction: true,
    });
    clearOperationKey(scope);
    openSaleCompleteSuccess.value = true;
    getOrder();
  } finally {
    completeSalePaymentLoading.value = false;
  }
};

const requestCompleteSalePayment = () => {
  if (!canCompleteSalePayment.value) return;
  twoFactor.modal = true;
  twoFactor.newFlow = true;
  twoFactor.requestedScope = "finance.order_admin";
  twoFactor.callback = { fn: completeSalePayment };
};

const giveExternal = () => {
  openSaleCompleteSuccess.value = true;
  getOrder();
};
</script>

<style scoped></style>
