<template>
  <section>
    <div class="d-flex align-center justify-space-between mb-4"><h2 class="text-primary">Expedientes KYC</h2><VSelect v-model="status" :items="statusFilterOptions" label="Estado" clearable class="status-filter" @update:model-value="applyStatus" /></div>
    <VTable><thead><tr><th>ID</th><th>Usuario</th><th>Estado</th><th>Nivel</th><th>Acciones</th></tr></thead><tbody><tr v-for="item in items" :key="item.id"><td>{{ item.id }}</td><td>{{ item.user?.name ?? item.user_id }}</td><td>{{ statusLabel(item.workflow_status) }}</td><td>{{ item.level }}</td><td><VBtn size="small" variant="text" @click="openReview(item.id)">Revisar</VBtn></td></tr></tbody></VTable>
    <div class="d-flex align-center justify-space-between mt-4">
      <span class="text-body-2 text-medium-emphasis">Total: {{ total }}</span>
      <div class="d-flex align-center ga-2">
        <VBtn size="small" variant="text" :disabled="currentPage <= 1 || loading" @click="load(currentPage - 1)">Anterior</VBtn>
        <span class="text-body-2">{{ currentPage }} / {{ lastPage }}</span>
        <VBtn size="small" variant="text" :disabled="currentPage >= lastPage || loading" @click="load(currentPage + 1)">Siguiente</VBtn>
      </div>
    </div>
    <VDialog v-model="dialog" max-width="860"><VCard v-if="selected" title="Revision KYC"><VCardText>
      <VRow><VCol v-for="field in detailFields" :key="field.label" cols="12" md="6"><strong>{{ field.label }}:</strong> {{ field.value || "No registrado" }}</VCol></VRow>
      <h3 class="text-primary mt-5">Documentos</h3><div v-for="document in selected.documents" :key="document.public_reference ?? document.download_endpoint" class="d-flex align-center justify-space-between py-2"><span>{{ document.document_type }} · v{{ document.version }} · {{ statusLabel(document.status) }}</span><VBtn variant="outlined" size="small" @click="api.downloadDocument(document)">Descargar</VBtn></div>
      <VTextarea v-if="availableActions.length || canSetLevelThree" v-model="reason" label="Motivo administrativo" />
    </VCardText><VCardActions class="flex-wrap"><VBtn v-for="action in availableActions" :key="action.value" @click="transition(action.value)">{{ action.title }}</VBtn><VBtn v-if="canSetLevelThree" :disabled="reason.trim().length < 3" @click="setLevelThree(!hasLevelThree)">{{ hasLevelThree ? "Revocar Nivel 3" : "Aprobar Nivel 3" }}</VBtn><VBtn @click="dialog = false">Cerrar</VBtn></VCardActions></VCard></VDialog>
  </section>
</template>
<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { useKycApi } from "@/services/kycApi"; import { statusLabel, statusOptions } from "@/utils/statusLabels"; import { computed, onMounted, ref } from "vue";
const api = useKycApi(); const items = ref<any[]>([]); const selected = ref<any>(null); const reason = ref(""); const status = ref<string | null>(null); const currentPage = ref(1); const lastPage = ref(1); const total = ref(0); const loading = ref(false); const statuses = ["submitted", "under_review", "needs_correction", "approved", "rejected", "expired", "suspended"];
const statusFilterOptions = statusOptions(statuses);
const actionMap: Record<string, Array<{ title: string; value: string }>> = { submitted: [{ title: "Tomar revision", value: "start_review" }], needs_correction: [{ title: "Tomar revision", value: "start_review" }], under_review: [{ title: "Solicitar correccion", value: "needs_correction" }, { title: "Aprobar", value: "approve" }, { title: "Rechazar", value: "reject" }], approved: [{ title: "Suspender", value: "suspend" }, { title: "Expirar", value: "expire" }] };
const availableActions = computed(() => actionMap[selected.value?.workflow_status] ?? []); const canSetLevelThree = computed(() => selected.value?.workflow_status === "approved"); const hasLevelThree = computed(() => Boolean(selected.value?.advanced_level_approved_at));
const detailFields = computed(() => { const personal = selected.value?.personal_data ?? {}; return [{ label: "Nombres", value: personal.first_name }, { label: "Apellidos", value: personal.last_name }, { label: "Nacimiento", value: personal.birth_date }, { label: "Direccion", value: personal.address }, { label: "Ciudad", value: personal.city }, { label: "Telefono", value: personal.phone }, { label: "Ocupacion", value: personal.occupation }, { label: "Origen de fondos", value: personal.source_of_funds }, { label: "Tipo de documento", value: selected.value?.type_document_name ?? selected.value?.type_documents_id }, { label: "Documento", value: selected.value?.document_masked }, { label: "Pais", value: selected.value?.country_name ?? selected.value?.country_id }, { label: "Declaracion aceptada", value: selected.value?.declaration_accepted ? "Si" : "No" }, { label: "Nivel", value: selected.value?.level }, { label: "Nivel 3", value: hasLevelThree.value ? "Activo" : "Inactivo" }, { label: "Estado moderno", value: statusLabel(selected.value?.workflow_status) }, { label: "Estado legacy", value: selected.value?.status }, { label: "Enviado", value: selected.value?.submitted_at }, { label: "Motivo de correccion", value: selected.value?.correction_reason }]; });
const dialog = computed({ get: () => selected.value !== null, set: value => { if (!value) selected.value = null; } }); const load = async (page = currentPage.value) => { loading.value = true; try { const result = await api.list(status.value ?? undefined, page); items.value = result.items; currentPage.value = Number(result.meta.current_page ?? page); lastPage.value = Math.max(1, Number(result.meta.last_page ?? 1)); total.value = Number(result.meta.total ?? items.value.length); } finally { loading.value = false; } }; const applyStatus = async () => { currentPage.value = 1; await load(1); }; const openReview = async (id: number) => { selected.value = await api.show(id); reason.value = ""; };
const transition = async (action: string) => { if (!selected.value) return; await authorizeWithTwoFactor(api.transition.bind(api, selected.value.id, action, reason.value || undefined), "admin.security"); selected.value = null; reason.value = ""; await load(); }; const setLevelThree = async (approved: boolean) => { if (!selected.value || reason.value.trim().length < 3 || selected.value.workflow_status !== "approved") return; await authorizeWithTwoFactor(api.levelThree.bind(api, selected.value.id, approved, reason.value.trim()), "admin.security"); reason.value = ""; selected.value = await api.show(selected.value.id); await load(); }; onMounted(load);
</script>
<style scoped>.status-filter { max-width: 260px; }</style>
