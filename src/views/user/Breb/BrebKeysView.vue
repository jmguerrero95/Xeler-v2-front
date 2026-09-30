<template>
  <VContainer>
    <div class="d-flex justify-space-between align-center mb-5">
      <div><h2 class="text-primary">Mis llaves Bre-B</h2><p class="text-table">Gestiona destinos personales y empresariales para tus ventas.</p></div>
      <VBtn color="primary" @click="newKey">Nueva llave</VBtn>
    </div>
    <VCard v-if="showForm" class="pa-5 mb-5">
      <VSelect v-model="form.owner_type" :items="ownerTypes" item-title="title" item-value="value" label="Propietario" />
      <VSelect v-if="form.owner_type === 'company'" v-model="form.company_id" :items="companies" item-title="legal_name" item-value="id" label="Empresa aprobada" />
      <VSelect v-model="form.key_type" :items="keyTypes" item-title="title" item-value="value" label="Tipo de llave" />
      <VTextField v-model="form.value" label="Valor de la llave" />
      <VSelect v-model="form.bank_id" :items="banks" item-title="attributes.name" item-value="id" clearable label="Entidad financiera" />
      <VTextField v-model="form.holder_name" label="Titular" />
      <VBtn color="primary" :loading="saving" @click="save">{{ editing ? "Guardar cambios" : "Guardar" }}</VBtn>
    </VCard>
    <VAlert v-if="error" type="error" class="mb-4">{{ error }}</VAlert>
    <VRow>
      <VCol v-for="key in keys" :key="key.id" cols="12" md="6">
        <VCard class="pa-4">
          <div class="d-flex justify-space-between"><strong>{{ key.masked_value }}</strong><VChip>{{ statusLabel(key.status) }}</VChip></div>
          <div>{{ key.holder_name }} · {{ key.owner_type }}</div>
          <div v-if="key.rejection_reason" class="text-error mt-2">{{ key.rejection_reason }}</div>
          <div class="d-flex ga-2 mt-3">
            <VBtn v-if="['draft', 'rejected', 'disabled'].includes(key.status)" size="small" variant="text" @click="edit(key)">Editar</VBtn>
            <VBtn v-if="key.status === 'verified'" size="small" variant="tonal" @click="favorite(key)">{{ key.is_favorite ? "Quitar favorita" : "★ Favorita" }}</VBtn>
            <VBtn v-if="key.status === 'draft'" size="small" @click="submit(key)">Enviar a revision</VBtn>
            <VBtn v-if="key.status !== 'disabled'" size="small" color="warning" @click="disable(key)">Desactivar</VBtn>
            <VBtn v-if="key.status !== 'verified'" size="small" color="error" variant="text" @click="remove(key)">Eliminar</VBtn>
          </div>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup lang="ts">
const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { statusLabel } from "@/utils/statusLabels";
import { brebApi, type BrebKey } from "@/services/brebApi";
import { onMounted, reactive, ref } from "vue";
import { useCompaniesApi } from "@/services/companiesApi";
import { CompanyAccountStore } from "@/stores/CompanyAccountStore";
import { storeToRefs } from "pinia";
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";
const keys = ref<BrebKey[]>([]); const showForm = ref(false); const saving = ref(false); const error = ref(""); const editing = ref<BrebKey|null>(null);
const companiesApi = useCompaniesApi(); const companies = ref<any[]>([]); const accountStore = CompanyAccountStore(); const { banks } = storeToRefs(accountStore);
const { runWithTwoFactor } = useTwoFactorGuard();
const ownerTypes = [{ title: "Personal", value: "user" }, { title: "Empresa", value: "company" }];
const keyTypes = [{ title: "Telefono", value: "phone" }, { title: "Correo", value: "email" }, { title: "Documento", value: "document" }, { title: "Alfanumerica", value: "alphanumeric" }];
const form = reactive<Record<string, any>>({ owner_type: "user", company_id: null, key_type: "phone", value: "", bank_id: null, holder_name: "" });
const load = async () => { keys.value = await brebApi.list(); };
const newKey=()=>{ editing.value=null; Object.assign(form,{owner_type:"user",company_id:null,key_type:"phone",value:"",bank_id:null,holder_name:""}); showForm.value=true; };
const edit=(key:BrebKey)=>{ editing.value=key; Object.assign(form,{owner_type:key.owner_type,company_id:key.company_id??null,key_type:key.key_type,value:"",bank_id:key.bank_id??null,holder_name:key.holder_name}); showForm.value=true; };
const save = async () => runWithTwoFactor(async () => { saving.value = true; error.value = ""; try { const payload={...form}; if(editing.value&&!payload.value){ delete payload.value; delete payload.key_type; } if(editing.value)await brebApi.update(editing.value.id,payload); else await brebApi.create(payload); showForm.value = false; editing.value=null; await load(); } catch (e: any) { error.value = e?.message ?? "No fue posible guardar la llave."; } finally { saving.value = false; } }, "finance.financial_destination");
const favorite = async (key: BrebKey) => { await brebApi.favorite(key.id, !key.is_favorite); await load(); };
const submit = async (key: BrebKey) => { await authorizeWithTwoFactor(brebApi.submit.bind(brebApi, key.id), "finance.financial_destination"); await load(); };
const disable = async (key: BrebKey) => runWithTwoFactor(async () => { await brebApi.disable(key.id); await load(); }, "finance.financial_destination");
const remove = async (key: BrebKey) => runWithTwoFactor(async () => { await brebApi.remove(key.id); await load(); }, "finance.financial_destination");
onMounted(async()=>{ await Promise.all([load(), accountStore.getBanks(), companiesApi.approved().then(items=>{ companies.value=items.filter(Boolean); })]); });
</script>
