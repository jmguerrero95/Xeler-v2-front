<template>
  <section>
    <div class="d-flex justify-space-between align-center mb-4">
      <h2 class="text-primary">Cuenta empresarial</h2>
      <VBtnPrimary @click="newDraft">Nueva empresa</VBtnPrimary>
    </div>

    <VAlert v-if="!editing && companies.length === 0" type="info" variant="tonal">
      Aún no tienes solicitudes empresariales.
    </VAlert>
    <VList v-if="!editing">
      <VListItem
        v-for="company in companies"
        :key="company.id"
        :title="company.legal_name"
        :subtitle="`Estado: ${statusLabel(company.workflow_status)}`"
        @click="edit(company.id)"
      />
    </VList>

    <div v-if="editing">
      <VAlert v-if="selected?.correction_reason" type="warning" variant="tonal" class="mb-4">
        {{ selected.correction_reason }}
      </VAlert>
      <VAlert v-if="selected && !editable" type="info" variant="tonal" class="mb-4">
        Este expediente no puede modificarse en su estado actual: {{ statusLabel(selected.workflow_status) }}.
      </VAlert>
      <VAlert v-if="missingRequirements.length" type="warning" variant="tonal" class="mb-4">
        <strong>Antes de enviar completa:</strong>
        <ul class="pl-5 mt-2">
          <li v-for="item in missingRequirements" :key="item.key">{{ item.label }}</li>
        </ul>
      </VAlert>

      <fieldset :disabled="!editable" class="form-fieldset">
        <VForm @submit.prevent="save">
          <VRow>
            <VCol cols="12" md="6"><VTextField id="company-legal-name" v-model="form.legal_name" label="Razón social *" /></VCol>
            <VCol cols="12" md="6"><VTextField v-model="form.trade_name" label="Nombre comercial" /></VCol>
            <VCol cols="12" md="6"><VTextField id="company-tax-id" v-model="form.tax_id" :placeholder="selected?.tax_id_masked" label="Identificación tributaria *" /></VCol>
            <VCol cols="12" md="6"><VSelect id="company-country" v-model="form.country_id" :items="countries" :item-title="catalogTitle" item-value="id" label="País *" /></VCol>
            <VCol cols="12" md="6"><VTextField id="company-legal-type" v-model="form.legal_type" label="Tipo legal *" /></VCol>
            <VCol cols="12" md="6"><VTextField v-model="form.incorporation_date" type="date" label="Fecha de constitución" /></VCol>
            <VCol cols="12"><VTextField id="company-address" v-model="form.registered_address" label="Dirección registrada *" /></VCol>
            <VCol cols="12" md="6"><VTextField id="company-city" v-model="form.city" label="Ciudad *" /></VCol>
            <VCol cols="12" md="6"><VTextField id="company-phone" v-model="form.phone" label="Teléfono *" /></VCol>
            <VCol cols="12" md="6"><VTextField id="company-email" v-model="form.email" type="email" label="Correo *" /></VCol>
            <VCol cols="12" md="6"><VTextField id="company-activity" v-model="form.economic_activity" label="Actividad económica *" /></VCol>
            <VCol cols="12"><VTextarea id="company-source-funds" v-model="form.source_of_funds" label="Origen de fondos *" /></VCol>
          </VRow>
          <VBtnPrimary v-if="editable" type="submit" :loading="saving">Guardar borrador</VBtnPrimary>
        </VForm>

        <template v-if="selected?.id">
          <h3 class="text-primary mt-6">Beneficiarios finales</h3>
          <VAlert v-if="selected.beneficial_owners?.length === 0" type="info" variant="tonal" class="my-3">
            Registra al menos un beneficiario final antes de enviar el expediente.
          </VAlert>
          <VList>
            <VListItem
              v-for="item in selected.beneficial_owners"
              :key="item.id"
              :title="item.full_name"
              :subtitle="`${item.document_type} · ${item.ownership_percentage ?? 0}%`"
            >
              <template #append>
                <VBtn v-if="editable" size="small" variant="text" @click="editOwner(item)">Editar</VBtn>
                <VBtn v-if="editable" size="small" color="error" variant="text" @click="deleteOwner(item.id)">Eliminar</VBtn>
              </template>
            </VListItem>
          </VList>
          <VRow v-if="editable">
            <VCol cols="12" md="6"><VTextField v-model="owner.full_name" label="Nombre completo" /></VCol>
            <VCol cols="12" md="3"><VTextField v-model="owner.document_type" label="Tipo documento" /></VCol>
            <VCol cols="12" md="3"><VTextField v-model="owner.document_number" :placeholder="editingOwnerId ? 'Conservar documento actual' : ''" label="Número documento" /></VCol>
            <VCol cols="12" md="4"><VTextField v-model="owner.country" label="País" /></VCol>
            <VCol cols="12" md="4"><VTextField v-model="owner.ownership_percentage" label="Participación %" /></VCol>
            <VCol cols="12" md="4"><VCheckbox v-model="owner.is_controller" label="Es controlador" /></VCol>
          </VRow>
          <VBtn v-if="editable" variant="outlined" @click="saveOwner">
            {{ editingOwnerId ? "Actualizar beneficiario" : "Registrar beneficiario" }}
          </VBtn>

          <h3 class="text-primary mt-6">Documentos empresariales privados</h3>
          <p class="text-table mb-3">Los cuatro documentos indicados son obligatorios.</p>
          <VBtn
            v-for="document in activeDocuments"
            :key="document.public_reference"
            class="mr-2 mb-3"
            variant="outlined"
            @click="api.downloadDocument(document)"
          >
            {{ documentLabel(document.document_type) }} · v{{ document.version }} · {{ statusLabel(document.status) }}
          </VBtn>
          <VRow v-if="editable">
            <VCol v-for="document in documentTypes" :key="document.type" cols="12" md="4">
              <VFileInput
                :id="`company-document-${document.type}`"
                :label="`${document.label} *`"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                :loading="uploadingType === document.type"
                @update:model-value="upload(document.type, $event)"
              />
              <div v-if="uploadedTypes.has(document.type)" class="text-success text-caption">Documento cargado</div>
            </VCol>
          </VRow>
          <VBtnPrimary v-if="editable" class="mt-4" :loading="submitting" @click="submit">
            Guardar y enviar expediente empresarial
          </VBtnPrimary>
        </template>
      </fieldset>
      <VBtn class="ml-3" variant="text" @click="editing = false">Volver</VBtn>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useCompaniesApi } from "@/services/companiesApi";
import { statusLabel } from "@/utils/statusLabels";
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { useLocationStore } from "@/stores/LocationStore";
import { storeToRefs } from "pinia";

const api = useCompaniesApi();
const companies = ref<any[]>([]);
const selected = ref<any>(null);
const editing = ref(false);
const editingOwnerId = ref<number | null>(null);
const saving = ref(false);
const submitting = ref(false);
const uploadingType = ref<string | null>(null);
const locationStore = useLocationStore();
const { countries } = storeToRefs(locationStore);

const emptyForm = () => ({
  legal_name: "",
  trade_name: "",
  tax_id: "",
  country_id: "" as string | number,
  legal_type: "",
  incorporation_date: "",
  registered_address: "",
  city: "",
  phone: "",
  email: "",
  economic_activity: "",
  source_of_funds: "",
});
const emptyOwner = () => ({
  full_name: "",
  document_type: "",
  document_number: "",
  country: "",
  ownership_percentage: "",
  is_controller: false,
});
const form = reactive(emptyForm());
const owner = reactive(emptyOwner());
const editable = computed(() =>
  !selected.value || ["draft", "needs_correction"].includes(selected.value.workflow_status),
);
const catalogTitle = (item: any) => item?.attributes?.name ?? item?.name ?? String(item?.id ?? "");
const documentTypes = [
  { type: "certificate_of_incorporation", label: "Certificado de constitución" },
  { type: "tax_registration", label: "Registro tributario" },
  { type: "legal_representative_id", label: "Documento del representante" },
  { type: "shareholder_structure", label: "Estructura accionaria" },
] as const;
const activeDocuments = computed(() =>
  (selected.value?.documents ?? []).filter((item: any) => item.status !== "superseded"),
);
const uploadedTypes = computed(() =>
  new Set(activeDocuments.value.map((item: any) => String(item.document_type))),
);
type Requirement = {
  key: string;
  label: string;
  element: string;
  acceptsExisting?: boolean;
};
const fieldRequirements: readonly Requirement[] = [
  { key: "legal_name", label: "Razón social", element: "company-legal-name" },
  { key: "tax_id", label: "Identificación tributaria", element: "company-tax-id", acceptsExisting: true },
  { key: "country_id", label: "País", element: "company-country" },
  { key: "legal_type", label: "Tipo legal", element: "company-legal-type" },
  { key: "registered_address", label: "Dirección registrada", element: "company-address" },
  { key: "city", label: "Ciudad", element: "company-city" },
  { key: "phone", label: "Teléfono", element: "company-phone" },
  { key: "email", label: "Correo", element: "company-email" },
  { key: "economic_activity", label: "Actividad económica", element: "company-activity" },
  { key: "source_of_funds", label: "Origen de fondos", element: "company-source-funds" },
] as const;
const missingRequirements = computed(() => {
  const missing: Requirement[] = fieldRequirements
    .filter((item) => {
      if (item.key === "tax_id" && selected.value?.tax_id_masked && String(form.tax_id).trim() === "") return false;
      return String((form as Record<string, unknown>)[item.key] ?? "").trim() === "";
    })
    .map((item) => ({ key: item.key, label: item.label, element: item.element }));

  if (selected.value?.id && (selected.value.beneficial_owners ?? []).length === 0) {
    missing.push({ key: "beneficial_owner", label: "Al menos un beneficiario final", element: "" });
  }
  documentTypes.filter((item) => !uploadedTypes.value.has(item.type)).forEach((item) => {
    missing.push({ key: item.type, label: item.label, element: `company-document-${item.type}` });
  });
  return missing;
});

const documentLabel = (type: string) => documentTypes.find((item) => item.type === type)?.label ?? type;
const load = async () => { companies.value = await api.list(); };
const newDraft = () => {
  selected.value = null;
  editingOwnerId.value = null;
  Object.assign(form, emptyForm());
  Object.assign(owner, emptyOwner());
  editing.value = true;
};
const edit = async (id: number) => {
  selected.value = await api.show(id);
  Object.assign(form, emptyForm(), selected.value, { tax_id: "" });
  editing.value = true;
};
const reloadSelected = async () => {
  if (selected.value?.id) {
    selected.value = await api.show(selected.value.id);
    await load();
  }
};
const payload = () => Object.fromEntries(
  Object.entries(form).filter(([key, value]) => key !== "tax_id" || String(value).trim() !== ""),
);
const save = async () => {
  saving.value = true;
  try {
    selected.value = await api.save(payload(), selected.value?.id);
    await reloadSelected();
  } finally {
    saving.value = false;
  }
};
const editOwner = (item: any) => {
  editingOwnerId.value = item.id;
  Object.assign(owner, emptyOwner(), item, { document_number: "" });
};
const saveOwner = async () => {
  if (!selected.value?.id) return;
  const ownerPayload = Object.fromEntries(
    Object.entries(owner).filter(([key, value]) => key !== "document_number" || String(value).trim() !== ""),
  );
  if (editingOwnerId.value) await api.updateOwner(selected.value.id, editingOwnerId.value, ownerPayload);
  else await api.addOwner(selected.value.id, ownerPayload);
  editingOwnerId.value = null;
  Object.assign(owner, emptyOwner());
  await reloadSelected();
};
const deleteOwner = async (ownerId: number) => {
  if (!selected.value?.id) return;
  await api.deleteOwner(selected.value.id, ownerId);
  await reloadSelected();
};
const upload = async (type: string, input: File | File[] | null) => {
  const file = Array.isArray(input) ? input[0] : input;
  if (!selected.value?.id || !file) return;
  uploadingType.value = type;
  try {
    await api.uploadDocument(selected.value.id, type, file);
    await reloadSelected();
  } finally {
    uploadingType.value = null;
  }
};
const focusFirstMissing = async () => {
  await nextTick();
  const target = missingRequirements.value.find((item) => item.element)?.element;
  if (!target) return;
  document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "center" });
  (document.getElementById(target)?.querySelector("input,textarea") as HTMLElement | null)?.focus();
};
const submit = async () => {
  if (!selected.value?.id || submitting.value) return;
  submitting.value = true;
  try {
    selected.value = await api.save(payload(), selected.value.id);
    await reloadSelected();
    if (missingRequirements.value.length > 0) {
      await focusFirstMissing();
      return;
    }
    selected.value = await api.submit(selected.value.id);
    editing.value = false;
    await load();
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await locationStore.fetchCountries();
  await load();
});
</script>

<style scoped>
.form-fieldset { border: 0; margin: 0; padding: 0; min-width: 0; }
</style>
