<template>
  <VContainer>
    <h2 class="text-primary">Reglas de fees</h2>
    <p class="text-table mb-5">Configura fees administrativos, por metodo y manuales antes del snapshot de la quote.</p>
    <VCard class="pa-5 mb-5">
      <VRow>
        <VCol cols="12" md="4"><VTextField v-model="form.name" label="Nombre" /></VCol>
        <VCol cols="12" md="4"><VSelect v-model="form.fee_type" :items="ruleFeeTypes" label="Tipo" /></VCol>
        <VCol cols="12" md="4"><VSelect v-model="form.operation_type" :items="operations" label="Operacion" /></VCol>
        <VCol cols="12" md="3"><VAutocomplete v-model="form.currency_id" :items="currencies" :item-title="catalogTitle" item-value="id" clearable label="Moneda" /></VCol>
        <VCol cols="12" md="3"><VAutocomplete v-model="form.network_id" :items="ruleNetworks" :item-title="catalogTitle" item-value="id" clearable label="Red" /></VCol>
        <VCol cols="12" md="3"><VAutocomplete v-model="form.payment_method_id" :items="paymentMethods" :item-title="catalogTitle" item-value="id" clearable label="Metodo" /></VCol>
        <VCol cols="12" md="3"><VTextField v-model="form.priority" label="Prioridad" /></VCol>
        <VCol cols="12" md="3"><VAutocomplete v-model="form.user_id" :items="users" :item-title="userTitle" item-value="id" clearable label="Usuario" @update:search="searchUsers" /></VCol>
        <VCol cols="12" md="3"><VAutocomplete v-model="form.company_id" :items="companies" :item-title="companyTitle" item-value="id" clearable label="Empresa" @update:search="searchCompanies" /></VCol>
        <VCol cols="12" md="3"><VTextField v-model="form.amount_min_cop" label="Monto minimo COP" /></VCol>
        <VCol cols="12" md="3"><VTextField v-model="form.amount_max_cop" label="Monto maximo COP" /></VCol>
        <VCol cols="12" md="3"><VTextField v-model="form.fixed_cop" label="Fijo COP" /></VCol>
        <VCol cols="12" md="3"><VTextField v-model="form.percentage" label="Porcentaje" /></VCol>
        <VCol cols="12" md="3"><VTextField v-model="form.minimum_cop" label="Minimo fee" /></VCol>
        <VCol cols="12" md="3"><VTextField v-model="form.maximum_cop" label="Maximo fee" /></VCol>
        <VCol cols="12" md="3"><VTextField v-model="form.starts_at" type="datetime-local" label="Vigente desde" /></VCol>
        <VCol cols="12" md="3"><VTextField v-model="form.ends_at" type="datetime-local" label="Vigente hasta" /></VCol>
        <VCol v-if="form.fee_type === 'manual'" cols="12"><VTextarea v-model="form.reason" label="Motivo obligatorio del fee manual" /></VCol>
        <VCol><VCheckbox v-model="form.stackable" label="Acumulable" /><VBtn color="primary" @click="saveRule">{{ editingId ? "Guardar cambios" : "Crear regla" }}</VBtn></VCol>
      </VRow>
    </VCard>
    <VTable><thead><tr><th>Nombre</th><th>Tipo</th><th>Operacion</th><th>Fee</th><th>Prioridad</th><th>Estado</th><th></th></tr></thead><tbody>
      <tr v-for="rule in rules" :key="rule.id"><td>{{ rule.name }}</td><td>{{ rule.fee_type }}</td><td>{{ rule.operation_type }}</td><td>{{ rule.fixed_cop }} COP + {{ rule.percentage }}%</td><td>{{ rule.priority }}</td><td><VSwitch :model-value="rule.active" @update:model-value="toggleRule(rule, Boolean($event))" /></td><td><VBtn size="small" variant="text" @click="editRule(rule)">Editar</VBtn></td></tr>
    </tbody></VTable>

    <VCard class="pa-5 mt-6"><h3>Exoneraciones</h3><VRow>
      <VCol cols="12" md="4"><VAutocomplete v-model="exemption.user_id" :items="users" :item-title="userTitle" item-value="id" clearable label="Usuario" @update:search="searchUsers" /></VCol>
      <VCol cols="12" md="4"><VAutocomplete v-model="exemption.company_id" :items="companies" :item-title="companyTitle" item-value="id" clearable label="Empresa" @update:search="searchCompanies" /></VCol>
      <VCol cols="12" md="4"><VSelect v-model="exemption.fee_type" :items="exemptionFeeTypes" clearable label="Tipo fee" /></VCol>
      <VCol cols="12" md="3"><VSelect v-model="exemption.operation_type" :items="operations" clearable label="Operacion" /></VCol>
      <VCol cols="12" md="3"><VAutocomplete v-model="exemption.currency_id" :items="currencies" :item-title="catalogTitle" item-value="id" clearable label="Moneda" /></VCol>
      <VCol cols="12" md="3"><VAutocomplete v-model="exemption.network_id" :items="exemptionNetworks" :item-title="catalogTitle" item-value="id" clearable label="Red" /></VCol>
      <VCol cols="12" md="3"><VAutocomplete v-model="exemption.payment_method_id" :items="paymentMethods" :item-title="catalogTitle" item-value="id" clearable label="Metodo" /></VCol>
      <VCol cols="12" md="3"><VTextField v-model="exemption.starts_at" type="datetime-local" label="Vigente desde" /></VCol>
      <VCol cols="12" md="3"><VTextField v-model="exemption.ends_at" type="datetime-local" label="Vigente hasta" /></VCol>
      <VCol cols="12"><VTextarea v-model="exemption.reason" label="Motivo" /><VBtn @click="saveExemption">{{ editingExemptionId ? "Guardar exoneracion" : "Crear exoneracion" }}</VBtn></VCol>
    </VRow></VCard>
    <VTable class="mt-4"><thead><tr><th>Beneficiario</th><th>Tipo</th><th>Operacion</th><th>Motivo</th><th>Estado</th><th></th></tr></thead><tbody>
      <tr v-for="item in exemptions" :key="item.id"><td>{{ exemptionOwnerTitle(item) }}</td><td>{{ item.fee_type || "Todas" }}</td><td>{{ item.operation_type || "Todas" }}</td><td>{{ item.reason }}</td><td><VSwitch :model-value="item.active" @update:model-value="toggleExemption(item, Boolean($event))" /></td><td><VBtn size="small" variant="text" @click="editExemption(item)">Editar</VBtn></td></tr>
    </tbody></VTable>
  </VContainer>
</template>

<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { feesApi } from "@/services/feesApi";
import { apiClient } from "@/services/apiClient";
import { onMounted, reactive, ref, watch } from "vue";

const ruleFeeTypes = ["administrative", "payment_method", "manual"];
const exemptionFeeTypes = [...ruleFeeTypes, "blockchain"];
const operations = ["buy", "sell"];
const rules = ref<any[]>([]); const exemptions = ref<any[]>([]);
const currencies = ref<any[]>([]); const paymentMethods = ref<any[]>([]); const companies = ref<any[]>([]); const users = ref<any[]>([]);
const ruleNetworks = ref<any[]>([]); const exemptionNetworks = ref<any[]>([]);
const editingId = ref<number | null>(null); const editingExemptionId = ref<number | null>(null);
const form = reactive<Record<string, any>>({name:"",reason:null,fee_type:"payment_method",operation_type:"buy",currency_id:null,network_id:null,payment_method_id:null,user_id:null,company_id:null,amount_min_cop:null,amount_max_cop:null,fixed_cop:"0",percentage:"0",minimum_cop:null,maximum_cop:null,priority:0,stackable:false,active:true,starts_at:null,ends_at:null});
const exemption = reactive<Record<string, any>>({user_id:null,company_id:null,fee_type:"administrative",operation_type:null,currency_id:null,network_id:null,payment_method_id:null,starts_at:null,ends_at:null,reason:""});
const clean = (data: Record<string, any>) => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== ""));
const resources = (response: any) => response.data?.response ?? response.data?.data ?? [];
const collectionItems = (value: unknown[] | { data: unknown[] }): unknown[] =>
  Array.isArray(value) ? value : value.data;
const catalogTitle = (item: any) => item?.attributes?.abbreviation ?? item?.attributes?.name ?? item?.name ?? String(item?.id ?? "");
const userTitle = (item: any) => item ? `${item.username}${item.display_name ? ` · ${item.display_name}` : ""}` : "";
const companyTitle = (item: any) => item ? `${item.legal_name}${item.masked_tax_id ? ` · ${item.masked_tax_id}` : ""}` : "";
const exemptionOwnerTitle = (item: any) => item.user_id
  ? userTitle(users.value.find(user => Number(user.id) === Number(item.user_id)))
  : companyTitle(companies.value.find(company => Number(company.id) === Number(item.company_id)));
const loadNetworks = async (currencyId: number | null, target: typeof ruleNetworks) => { target.value = currencyId ? resources(await apiClient.get("order/flow/networks", { params: { currency_id: currencyId } })) : []; };
let userSearchTimer: ReturnType<typeof setTimeout> | undefined; let companySearchTimer: ReturnType<typeof setTimeout> | undefined;
const searchUsers = (value: string) => { clearTimeout(userSearchTimer); const query = value?.trim() ?? ""; if (query.length < 2) { users.value = []; return; } userSearchTimer = setTimeout(async () => { users.value = await feesApi.userCatalog(query); }, 250); };
const searchCompanies = (value: string) => { clearTimeout(companySearchTimer); const query = value?.trim() ?? ""; if (query.length < 2) { companies.value = []; return; } companySearchTimer = setTimeout(async () => { companies.value = await feesApi.companyCatalog(query); }, 250); };
const load = async () => { const [ruleData, exemptionData] = await Promise.all([feesApi.list(), feesApi.exemptions()]); rules.value = collectionItems(ruleData); exemptions.value = collectionItems(exemptionData); };
const saveRule = async () => { if (editingId.value) await authorizeWithTwoFactor(feesApi.update.bind(feesApi, editingId.value, clean(form)), "finance.financial_configuration"); else await authorizeWithTwoFactor(feesApi.create.bind(feesApi, clean(form)), "finance.financial_configuration"); editingId.value = null; await load(); };
const editRule = async (rule: any) => { editingId.value = rule.id; const networkId = rule.network_id ?? null; Object.keys(form).forEach(key => form[key] = key === "network_id" ? null : (rule[key] ?? null)); await loadNetworks(rule.currency_id ?? null, ruleNetworks); form.network_id = networkId; window.scrollTo({ top: 0, behavior: "smooth" }); };
const toggleRule = async (rule: any, active: boolean) => { const reason = active ? undefined : window.prompt("Motivo para desactivar la regla") ?? ""; if (!active && !reason) return; await authorizeWithTwoFactor(feesApi.toggle.bind(feesApi, rule.id, active, reason), "finance.financial_configuration"); await load(); };
const saveExemption = async () => { if (editingExemptionId.value) await authorizeWithTwoFactor(feesApi.updateExemption.bind(feesApi, editingExemptionId.value, clean(exemption)), "finance.financial_configuration"); else await authorizeWithTwoFactor(feesApi.createExemption.bind(feesApi, clean(exemption)), "finance.financial_configuration"); editingExemptionId.value = null; await load(); };
const editExemption = async (item: any) => { editingExemptionId.value = item.id; const networkId = item.network_id ?? null; Object.keys(exemption).forEach(key => exemption[key] = key === "network_id" ? null : (item[key] ?? null)); await loadNetworks(item.currency_id ?? null, exemptionNetworks); exemption.network_id = networkId; };
const toggleExemption = async (item: any, active: boolean) => { const reason = window.prompt(active ? "Motivo para activar la exoneracion" : "Motivo para desactivar la exoneracion") ?? ""; if (!reason) return; await authorizeWithTwoFactor(feesApi.toggleExemption.bind(feesApi, item.id, active, reason), "finance.financial_configuration"); await load(); };
watch(() => form.currency_id, value => { form.network_id = null; void loadNetworks(value, ruleNetworks); });
watch(() => exemption.currency_id, value => { exemption.network_id = null; void loadNetworks(value, exemptionNetworks); });
onMounted(async () => { const [currencyResponse, paymentResponse] = await Promise.all([apiClient.get("currency"), apiClient.get("payment/types"), load()]); currencies.value = resources(currencyResponse); paymentMethods.value = resources(paymentResponse); });
</script>
