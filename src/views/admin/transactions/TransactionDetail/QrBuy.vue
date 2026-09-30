<template>
    <div :class="$vuetify.display.mdAndDown ? '' : 'border-degree'">
        <div class="my-4 d-flex justify-center align-center gap-2 flex-column flex-lg-row">
            <QrcodeVue
                class="order-1 order-lg-0"
                foreground="#5043E8"
                :value="getDataForQr()"
                render-as="svg"
                :size="$vuetify.display.mdAndDown ? 217 : 130"
            />
            <div class="order-0 order-lg-1" :class="$vuetify.display.mdAndDown ? 'my-4' : ''">
                <VBtnPrimary v-if="canApprovePaymentProof" class="w-100 mb-3" @click="approvePaymentProof">
                    Aprobar comprobante
                </VBtnPrimary>

                <btn-with-modal-component
                    v-if="canProcessPayout"
                    :icon="QuestionIcon"
                    :text-btn="payoutActions.processLabel"
                    color-btn="success"
                    :props-btn="{ class: 'w-100 mb-3' }"
                    color-icon="warning"
                    title-modal="Confirmar desembolso cripto"
                    btn-modal="Si"
                    @click:btn-modal="requestCryptoPayout"
                >
                    <template #btn>
                        <span class="text-white">{{ payoutActions.processLabel }}</span>
                    </template>
                </btn-with-modal-component>

                <VBtnPrimary v-if="canRetryPayout" class="w-100 mb-3" @click="requestCryptoPayout">
                    Reintentar payout
                </VBtnPrimary>

                <VBtnDangerT v-if="canRegisterManualTxid" color="primary" @click="openExternalPaymentModal">
                    Registrar TXID manual
                </VBtnDangerT>
                <VAlert v-if="payoutActions.statusLabel" type="info" variant="tonal" class="mb-3">
                    {{ payoutActions.statusLabel }}
                </VAlert>
                <VBtnPrimary v-if="payoutActions.canResolveReconciliation" class="w-100 mb-3" @click="openReconciliation">
                    Resolver conciliacion
                </VBtnPrimary>
            </div>
        </div>
    </div>

    <dialog-global
        :dialog="modalExternalPayment"
        @close-dialog="modalExternalPayment = false"
        width-dialog="300"
    >
        <div class="text-center">
            <input-component v-model="txid" name="Ingresa el tx id">
                <template #label>
                    <span class="font-weight-bold text-table">Ingresa el tx id</span>
                </template>
            </input-component>
            <input-component v-model="manualReason" name="Motivo del registro manual">
                <template #label>
                    <span class="font-weight-bold text-table">Motivo</span>
                </template>
            </input-component>
        </div>
        <div class="text-center my-3">
            <VBtnPrimary :disabled="!canRegisterManualTxid || !txid || !manualReason" @click="accepOrder">
                Enviar
            </VBtnPrimary>
        </div>
    </dialog-global>
</template>

<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";
const { authorizeWithTwoFactor } = useTwoFactorGuard();
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import QrcodeVue from "qrcode.vue";
import InputComponent from "@/components/InputComponent.vue";
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import BtnWithModalComponent from "@/components/BtnWithModalComponent.vue";
import QuestionIcon from "@/assets/icons/QuestionIcon.vue";
import { TransactionStore } from "@/stores/TransactionStore";
import { UserStore } from "@/stores/UserStore";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";
import { helperStore } from "@/helper";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";
import { approveCryptoPaymentProof, createCryptoPayoutForOrder, retryCryptoPayoutForOrder } from "@/services/cryptoPayoutsApi";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import { resolveCryptoPayoutActions } from "@/services/cryptoPayoutActions";

const helper = helperStore();
const router = useRouter();
const userStore = UserStore();
const transactionStore = TransactionStore();
const twoFactor = TwoFactorAuthStore();
const { order } = storeToRefs(transactionStore);
const emits = defineEmits<{(e: "external-pay"): void}>();

const canManageOrders = computed(() => userStore.hasPermission("orders.updated"));
const canPayoutCrypto = computed(() => userStore.hasPermission("crypto.payout.process"));
const payoutActions = computed(() => resolveCryptoPayoutActions(
    order.value?.attributes,
    canManageOrders.value && canPayoutCrypto.value,
));
const isBuyOrder = computed(() =>
    Boolean(order.value?.attributes.is_buy_order ?? (order.value?.attributes.type === OrderTypes.COMPRA))
);

const canApprovePaymentProof = computed(() => {
    return Boolean(order.value?.id)
        && canManageOrders.value
        && canPayoutCrypto.value
        && Boolean(order.value?.attributes.can_approve_payment_proof);
});

const canProcessPayout = computed(() => {
    const currentOrder = order.value;
    return Boolean(
        currentOrder
        && isBuyOrder.value
        && payoutActions.value.canProcess
    );
});
const canRetryPayout = computed(() => Boolean(
    order.value
    && payoutActions.value.canRetry
));
const canRegisterManualTxid = computed(() => Boolean(
    order.value
    && payoutActions.value.canRegisterManualTxid
));

const openReconciliation = () => {
    const transactionId = order.value?.attributes.latest_outgoing_crypto_transaction_id;
    if (transactionId) router.push(`/admin/integrations/crypto/transactions/${transactionId}`);
};

const getDataForQr = () => {
    return transactionStore.getDataForQr(
        order.value?.relationships?.currency.attributes.name!,
        order.value?.attributes.address_send!,
        order.value?.attributes.amount_currency as string
    );
};

const modalExternalPayment = ref(false);
const txid = ref("");
const manualReason = ref("");

const openExternalPaymentModal = () => {
    if (!canRegisterManualTxid.value) {
        helper.showNotify("La orden no esta aprobada o ya tiene un desembolso activo", { type: "error" });
        return;
    }
    modalExternalPayment.value = true;
};

const requestCryptoPayout = () => {
    if ((!canProcessPayout.value && !canRetryPayout.value) || !order.value?.id) {
        helper.showNotify("La orden no esta aprobada o ya tiene un desembolso activo", { type: "error" });
        return;
    }

    twoFactor.modal = true;
    twoFactor.newFlow = true;
    twoFactor.requestedScope = "finance.crypto_payout";
    twoFactor.callback = {
        fn: executeCryptoPayout,
    };
};

const executeCryptoPayout = async () => {
    if (!order.value?.id) return;
    const code = localStorage.getItem("2fa") ? twoFactor.code : undefined;
    if (canRetryPayout.value) {
        await retryCryptoPayoutForOrder(order.value.id, code);
    } else {
        await createCryptoPayoutForOrder(order.value.id, code);
    }
    helper.showNotify("Desembolso crypto enviado");
    emits("external-pay");
};

const approvePaymentProof = async () => {
    if (!order.value?.id || !canApprovePaymentProof.value) return;
    await authorizeWithTwoFactor(approveCryptoPaymentProof.bind(undefined, order.value.id), "finance.crypto_payout");
    helper.showNotify("Comprobante aprobado");
    emits("external-pay");
};

const accepOrder = async () => {
    if (!canRegisterManualTxid.value || !order.value?.id || !txid.value || !manualReason.value) {
        helper.showNotify("La orden no esta aprobada o ya tiene un desembolso activo", { type: "error" });
        modalExternalPayment.value = false;
        return;
    }

    twoFactor.modal = true;
    twoFactor.newFlow = true;
    twoFactor.requestedScope = "finance.order_admin";
    twoFactor.callback = {
        fn: executeExternalDisbursement,
    };
};

const executeExternalDisbursement = async () => {
    try {
        if (!canRegisterManualTxid.value || !order.value?.id) {
            helper.showNotify("La orden no esta aprobada o ya tiene un desembolso activo", { type: "error" });
            modalExternalPayment.value = false;
            return;
        }

        const url = "order/external/accept/deposit";
        const data = {
            order_id: order.value.id,
            txid: txid.value,
            reason: manualReason.value,
            ...(localStorage.getItem("2fa") ? { two_factor_code: twoFactor.code } : {}),
        };
        const scope = `order-external-deposit-${order.value.id}`;
        const idempotencyPayload = {
            order_id: order.value.id,
            txid: txid.value,
            reason: manualReason.value,
        };

        await helper.http(url, "post", { data }, "", false, {
            idempotent: true,
            idempotencyKey: createOperationKey(scope, idempotencyPayload),
            financialAction: true,
        });

        clearOperationKey(scope);
        modalExternalPayment.value = false;
        emits("external-pay");
    } catch (e) {
        return e;
    }
};
</script>

<style scoped></style>
