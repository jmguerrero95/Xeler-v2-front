<template>
    <div v-if="order?.attributes.type == OrderTypes.VENTA" class="border-degree mx-4 my-2">
        <div class="text-18 text-table text-left mt-2">
            Titular: {{ beneficiary?.holder_name || beneficiary?.beneficiary_name || "-" }}<br />
            <template v-if="isBreb">
                Llave Bre-B: {{ beneficiary?.value || beneficiary?.masked_value || "-" }}<br />
                Tipo de llave: {{ beneficiary?.key_type || "-" }}<br />
            </template>
            <template v-else>
                Documento: {{ beneficiary?.beneficiary_document || beneficiary?.beneficiary_document_masked || "-" }}<br />
                Numero de Cuenta: {{ beneficiary?.account_number || beneficiary?.account_number_masked || "-" }}<br />
                Tipo de Cuenta: {{ beneficiary?.account_type || "-" }}<br />
            </template>
            Banco: {{ beneficiary?.bank_name || "-" }}
            <div>
                <VBtn
                    v-if="order?.attributes.can_view_sell_beneficiary && !privateBeneficiary"
                    class="mt-3"
                    size="small"
                    variant="tonal"
                    @click="requestPrivateBeneficiary"
                >
                    Ver datos para pago
                </VBtn>
            </div>
        </div>
        <div v-if="order.attributes.fee_snapshot" class="text-table text-left mt-4">
            <strong>Fees capturados</strong><br />
            Administrativo: {{ order.attributes.fee_snapshot.administrative_fee || "0" }} COP<br />
            Metodo de pago: {{ order.attributes.fee_snapshot.payment_method_fee || "0" }} COP<br />
            Ajuste manual: {{ order.attributes.fee_snapshot.manual_adjustment || "0" }} COP<br />
            Total: {{ order.attributes.fee_snapshot.total_fees || "0" }} COP
        </div>
    </div>
</template>

<script setup lang="ts">
import { TransactionStore } from "@/stores/TransactionStore";
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { helperStore } from "@/helper";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";

const transactionStore = TransactionStore();
const { order } = storeToRefs(transactionStore);
const helper = helperStore();
const twoFactor = TwoFactorAuthStore();
const privateBeneficiary = ref<Record<string, any> | null>(null);
const loadingPrivateBeneficiary = ref(false);
const orderId = computed(() => order.value?.id ?? null);
const beneficiary = computed(() => privateBeneficiary.value ?? order.value?.attributes.payment_account_snapshot ?? null);
const isBreb = computed(() => Boolean(order.value?.attributes.breb));

watch(orderId, () => {
    privateBeneficiary.value = null;
    loadingPrivateBeneficiary.value = false;
}, { immediate: true, flush: "sync" });

onBeforeUnmount(() => {
    privateBeneficiary.value = null;
});

const requestPrivateBeneficiary = () => {
    twoFactor.modal = true;
    twoFactor.newFlow = true;
    twoFactor.requestedScope = "finance.crypto_payout";
    twoFactor.callback = { fn: loadPrivateBeneficiary };
};

const loadPrivateBeneficiary = async () => {
    const requestedOrderId = orderId.value;
    if (!requestedOrderId || loadingPrivateBeneficiary.value) return;
    privateBeneficiary.value = null;
    loadingPrivateBeneficiary.value = true;
    try {
        const data = { two_factor_code: twoFactor.code };
        const response = await helper.http(`admin/crypto/orders/${requestedOrderId}/sell-beneficiary`, "post", { data }, "", false, {
            financialAction: true,
        });
        if (orderId.value === requestedOrderId) {
            privateBeneficiary.value = response?.data?.data ?? response?.data ?? null;
        }
    } catch (error) {
        privateBeneficiary.value = null;
        throw error;
    } finally {
        loadingPrivateBeneficiary.value = false;
    }
};

</script>

<style scoped lang="scss">
</style>
