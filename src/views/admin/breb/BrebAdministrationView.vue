<template>
  <VContainer><h2 class="text-primary mb-5">Administracion Bre-B</h2>
    <VTabs v-model="tab"><VTab value="pending">Pendientes</VTab><VTab value="platform">Llaves Xeler</VTab></VTabs>
    <VWindow v-model="tab" class="mt-4">
      <VWindowItem value="pending"><VCard v-for="key in pending" :key="key.id" class="pa-4 mb-3">
        <div class="d-flex justify-space-between"><div><strong>{{ key.masked_value }}</strong><div>{{ key.holder_name }} · {{ key.owner_display || key.owner_type }}</div></div>
          <div class="d-flex ga-2"><VBtn size="small" @click="inspect(key)">Ver valor</VBtn><VBtn size="small" color="success" @click="review(key, 'verify')">Verificar</VBtn><VBtn size="small" color="warning" @click="review(key, 'correction')">Pedir correccion</VBtn><VBtn size="small" color="error" @click="review(key, 'reject')">Rechazar</VBtn></div></div>
        <VAlert v-if="selected?.id === key.id" type="warning" class="mt-3">Valor operativo: {{ selected.attributes.operational_value }}</VAlert>
      </VCard></VWindowItem>
      <VWindowItem value="platform"><VCard class="pa-4 mb-4"><h3>Nueva llave receptora</h3>
        <VSelect v-model="platformForm.key_type" :items="['phone','email','document','alphanumeric']" label="Tipo" /><VTextField v-model="platformForm.value" label="Valor" /><VSelect v-model="platformForm.bank_id" :items="banks" item-title="attributes.name" item-value="id" clearable label="Entidad financiera" /><VTextField v-model="platformForm.holder_name" label="Titular" />
        <VTextField v-model="platformForm.daily_min_cop" label="Minimo COP" /><VTextField v-model="platformForm.daily_max_cop" label="Maximo COP" /><VTextarea v-model="platformForm.instructions" label="Instrucciones" /><VCheckbox v-model="platformForm.is_default" label="Predeterminada" /><VBtn color="primary" @click="savePlatform">{{ platformEditing ? "Guardar cambios" : "Crear" }}</VBtn>
      </VCard><VCard v-for="key in platform" :key="key.id" class="pa-4 mb-2"><strong>{{ key.masked_value }}</strong> · {{ key.holder_name }} <VChip v-if="key.is_default">Predeterminada</VChip><VBtn size="small" variant="text" class="ml-2" @click="editPlatform(key)">Editar</VBtn><VBtn v-if="key.status !== 'disabled'" size="small" color="warning" variant="text" @click="review(key, 'disable')">Desactivar</VBtn><VBtn v-else size="small" color="success" variant="text" @click="review(key, 'verify')">Activar</VBtn></VCard></VWindowItem>
    </VWindow>
  </VContainer>
</template>
<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { brebApi, type BrebKey } from "@/services/brebApi"; import { onMounted, reactive, ref } from "vue"; import { CompanyAccountStore } from "@/stores/CompanyAccountStore"; import { storeToRefs } from "pinia";
const tab=ref("pending"), pending=ref<BrebKey[]>([]), platform=ref<BrebKey[]>([]), selected=ref<any>(null), platformEditing=ref<BrebKey|null>(null);
const accountStore=CompanyAccountStore(), { banks }=storeToRefs(accountStore);
const platformForm=reactive<Record<string,any>>({key_type:"phone",value:"",bank_id:null,holder_name:"",daily_min_cop:null,daily_max_cop:null,instructions:"",is_default:false});
const load=async()=>{ pending.value=await brebApi.pending(); platform.value=await brebApi.platform(); };
const inspect=async(key:BrebKey)=>{ selected.value=await brebApi.adminShow(key.id); };
const review=async(key:BrebKey,decision:string)=>{ const needsReason=["reject","correction","disable"].includes(decision); const reason=needsReason?(window.prompt("Motivo de la decision")??""):undefined; if(needsReason&&!reason)return; await authorizeWithTwoFactor(brebApi.review.bind(brebApi, key.id, decision, reason), "finance.financial_destination"); await load(); };
const editPlatform=(key:BrebKey)=>{ platformEditing.value=key; Object.assign(platformForm,{key_type:key.key_type,value:"",bank_id:key.bank_id??null,holder_name:key.holder_name,daily_min_cop:key.daily_min_cop??null,daily_max_cop:key.daily_max_cop??null,instructions:key.instructions??"",is_default:key.is_default}); };
const savePlatform=async()=>{ const payload={...platformForm}; if(platformEditing.value&&!payload.value){ delete payload.value; delete payload.key_type; } if(platformEditing.value)await authorizeWithTwoFactor(brebApi.updatePlatform.bind(brebApi, platformEditing.value.id, payload), "finance.financial_destination");else await authorizeWithTwoFactor(brebApi.createPlatform.bind(brebApi, payload), "finance.financial_destination"); platformEditing.value=null; await load(); };
onMounted(async()=>{ await Promise.all([load(),accountStore.getBanks()]); });
</script>
