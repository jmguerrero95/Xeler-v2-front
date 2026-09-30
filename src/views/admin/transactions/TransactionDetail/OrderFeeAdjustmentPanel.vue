<template>
  <VCard v-if="order?.attributes.can_adjust_order_fee" class="pa-4 mx-4 my-3" variant="outlined">
    <h4 class="text-primary">Ajuste de fee</h4>
    <p class="text-table">Los ajustes solo se aplican si la autoridad economica permite versionar el snapshot. De lo contrario se solicitara una requote.</p>
    <VSelect v-model="form.fee_type" :items="['administrative','payment_method','manual']" label="Tipo de fee" />
    <VSelect v-model="form.adjustment_type" :items="['exemption','fixed','percentage']" label="Ajuste" />
    <VTextField v-model="form.value" label="Valor" /><VTextarea v-model="form.reason" label="Motivo" />
    <VBtn size="small" :loading="saving" @click="submit">Solicitar ajuste</VBtn>
    <VAlert v-if="message" type="info" class="mt-3">{{ message }}</VAlert>
  </VCard>
</template>
<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { feesApi } from "@/services/feesApi"; import { TransactionStore } from "@/stores/TransactionStore"; import { storeToRefs } from "pinia"; import { reactive, ref } from "vue";
const { order }=storeToRefs(TransactionStore()); const saving=ref(false),message=ref(""); const form=reactive({fee_type:"administrative",adjustment_type:"exemption",value:"0",reason:""});
const submit=async()=>{ if(!order.value)return; saving.value=true; message.value=""; try{await authorizeWithTwoFactor(feesApi.adjustOrder.bind(feesApi, order.value.id, form), "finance.financial_configuration"); message.value="Ajuste registrado.";}catch(error:any){message.value=error?.code==="ORDER_FEE_ADJUSTMENT_REQUIRES_REQUOTE"||error?.response?.data?.code==="ORDER_FEE_ADJUSTMENT_REQUIRES_REQUOTE"?"La orden requiere una nueva cotizacion; no se modifico su snapshot.":error?.message??"No fue posible solicitar el ajuste.";}finally{saving.value=false;} };
</script>
