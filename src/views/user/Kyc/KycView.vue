<template>
  <section>
    <h2 class="text-primary">Verificación de identidad</h2>
    <VAlert class="my-4" type="info" variant="tonal">
      Nivel actual: {{ level }} · Estado: {{ statusLabel(kyc?.workflow_status ?? "not_started") }}
    </VAlert>
    <VAlert v-if="kyc?.correction_reason" class="mb-4" type="warning" variant="tonal">
      Corrección requerida: {{ kyc.correction_reason }}
    </VAlert>
    <VAlert v-if="editable && missingRequirements.length" class="mb-4" type="warning" variant="tonal">
      <strong>Antes de enviar completa:</strong>
      <ul class="pl-5 mt-2">
        <li v-for="item in missingRequirements" :key="item.key">{{ item.label }}</li>
      </ul>
    </VAlert>

    <VForm v-if="editable" @submit.prevent="saveDraft">
      <VRow>
        <VCol cols="12" md="6"><VTextField id="kyc-first-name" v-model="form.first_name" label="Nombres *" /></VCol>
        <VCol cols="12" md="6"><VTextField id="kyc-last-name" v-model="form.last_name" label="Apellidos *" /></VCol>
        <VCol cols="12" md="6"><VSelect id="kyc-document-type" v-model="form.type_documents_id" :items="typeDocuments" :item-title="catalogTitle" item-value="id" label="Tipo de documento *" /></VCol>
        <VCol cols="12" md="6"><VTextField id="kyc-document" v-model="form.document" label="Número de documento *" /></VCol>
        <VCol cols="12" md="6"><VSelect id="kyc-country" v-model="form.country_id" :items="countries" :item-title="catalogTitle" item-value="id" label="País *" /></VCol>
        <VCol cols="12" md="6"><VTextField id="kyc-birth-date" v-model="form.birth_date" type="date" label="Fecha de nacimiento *" /></VCol>
        <VCol cols="12" md="6"><VTextField id="kyc-address" v-model="form.address" label="Dirección *" /></VCol>
        <VCol cols="12" md="6"><VTextField id="kyc-city" v-model="form.city" label="Ciudad *" /></VCol>
        <VCol cols="12" md="6"><VTextField id="kyc-phone" v-model="form.phone" label="Teléfono *" /></VCol>
        <VCol cols="12" md="6"><VTextField id="kyc-occupation" v-model="form.occupation" label="Actividad u ocupación *" /></VCol>
        <VCol cols="12"><VTextarea id="kyc-source-of-funds" v-model="form.source_of_funds" label="Origen de fondos *" /></VCol>
      </VRow>
      <VCheckbox id="kyc-declaration" v-model="form.declaration_accepted" label="Declaro que la información suministrada es correcta *" />
      <VBtnPrimary type="submit" :loading="saving">Guardar borrador</VBtnPrimary>
    </VForm>

    <div v-if="editable" class="mt-6">
      <h3 class="text-primary mb-1">Documentos privados</h3>
      <p class="text-table mb-3">Los tres primeros documentos son obligatorios. La prueba de dirección es opcional.</p>
      <VRow>
        <VCol v-for="document in documents" :key="document.type" cols="12" md="4">
          <VFileInput
            :id="`kyc-document-${document.type}`"
            :label="`${document.label}${document.required ? ' *' : ' (opcional)'}`"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            :loading="uploadingType === document.type"
            @update:model-value="upload(document.type, $event)"
          />
          <div v-if="uploadedTypes.has(document.type)" class="text-success text-caption">Documento cargado</div>
        </VCol>
      </VRow>
      <VBtnPrimary class="mt-3" :loading="submitting" @click="submit">Guardar y enviar a revisión</VBtnPrimary>
    </div>

    <div v-if="kyc?.documents?.length" class="mt-6">
      <h3 class="text-primary">Documentos cargados</h3>
      <VBtn
        v-for="item in activeDocuments"
        :key="item.public_reference ?? item.download_endpoint"
        class="mr-2 mt-2"
        variant="outlined"
        @click="api.downloadDocument(item)"
      >
        {{ documentLabel(item.document_type) }} · v{{ item.version }} · {{ statusLabel(item.status) }}
      </VBtn>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useKycApi } from "@/services/kycApi";
import { statusLabel } from "@/utils/statusLabels";
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { UserStore } from "@/stores/UserStore";
import { useLocationStore } from "@/stores/LocationStore";
import { storeToRefs } from "pinia";

const api = useKycApi();
const kyc = ref<any>(null);
const level = ref(0);
const saving = ref(false);
const submitting = ref(false);
const uploadingType = ref<string | null>(null);
const userStore = UserStore();
const locationStore = useLocationStore();
const { typeDocuments } = storeToRefs(userStore);
const { countries } = storeToRefs(locationStore);

const form = reactive({
  first_name: "",
  last_name: "",
  type_documents_id: "" as string | number,
  document: "",
  country_id: "" as string | number,
  birth_date: "",
  address: "",
  city: "",
  phone: "",
  occupation: "",
  source_of_funds: "",
  declaration_accepted: false,
});

const documents = [
  { type: "identity_front", label: "Documento frontal", required: true },
  { type: "identity_back", label: "Documento posterior", required: true },
  { type: "selfie", label: "Selfie", required: true },
  { type: "proof_of_address", label: "Prueba de dirección", required: false },
] as const;

type Requirement = { key: string; label: string; element: string };
const fieldRequirements: readonly Requirement[] = [
  { key: "first_name", label: "Nombres", element: "kyc-first-name" },
  { key: "last_name", label: "Apellidos", element: "kyc-last-name" },
  { key: "type_documents_id", label: "Tipo de documento", element: "kyc-document-type" },
  { key: "document", label: "Número de documento", element: "kyc-document" },
  { key: "country_id", label: "País", element: "kyc-country" },
  { key: "birth_date", label: "Fecha de nacimiento", element: "kyc-birth-date" },
  { key: "address", label: "Dirección", element: "kyc-address" },
  { key: "city", label: "Ciudad", element: "kyc-city" },
  { key: "phone", label: "Teléfono", element: "kyc-phone" },
  { key: "occupation", label: "Actividad u ocupación", element: "kyc-occupation" },
  { key: "source_of_funds", label: "Origen de fondos", element: "kyc-source-of-funds" },
] as const;

const editable = computed(() =>
  !kyc.value || ["not_started", "draft", "needs_correction"].includes(kyc.value.workflow_status),
);
const activeDocuments = computed(() =>
  (kyc.value?.documents ?? []).filter((item: any) => item.status !== "superseded"),
);
const uploadedTypes = computed(() =>
  new Set(activeDocuments.value.map((item: any) => String(item.document_type))),
);
const missingRequirements = computed(() => {
  if (!editable.value) return [];
  const missing: Requirement[] = fieldRequirements
    .filter((item) => String((form as Record<string, unknown>)[item.key] ?? "").trim() === "")
    .map((item) => ({ key: item.key, label: item.label, element: item.element }));

  if (!form.declaration_accepted) {
    missing.push({ key: "declaration_accepted", label: "Aceptar la declaración", element: "kyc-declaration" });
  }

  documents.filter((item) => item.required && !uploadedTypes.value.has(item.type)).forEach((item) => {
    missing.push({ key: item.type, label: item.label, element: `kyc-document-${item.type}` });
  });

  return missing;
});

const catalogTitle = (item: any) =>
  item?.attributes?.name ?? item?.name ?? item?.attributes?.description ?? String(item?.id ?? "");
const documentLabel = (type: string) => documents.find((item) => item.type === type)?.label ?? type;

const load = async () => {
  const response = await api.me();
  kyc.value = response.kyc;
  level.value = response.level;
  Object.assign(form, kyc.value?.personal_data ?? {});
  await userStore.updateUserAuth();
  const detail = userStore.userAuth?.relationships?.userDetail;
  form.type_documents_id = kyc.value?.type_documents_id ?? detail?.attributes?.type_documents_id ?? form.type_documents_id;
  form.country_id = kyc.value?.country_id ?? detail?.relationships?.country?.id ?? form.country_id;
  form.document = kyc.value?.document ?? form.document ?? "";
  form.declaration_accepted = Boolean(kyc.value?.declaration_accepted);
};

const draftPayload = () => Object.fromEntries(
  Object.entries(form).filter(([key, value]) => key !== "document" || String(value).trim() !== ""),
);

const saveDraft = async () => {
  saving.value = true;
  try {
    await api.saveDraft(draftPayload());
    await load();
  } finally {
    saving.value = false;
  }
};

const upload = async (type: string, input: File | File[] | null) => {
  const file = Array.isArray(input) ? input[0] : input;
  if (!file) return;
  uploadingType.value = type;
  try {
    if (!kyc.value) {
      kyc.value = await api.saveDraft(draftPayload());
    }
    await api.uploadDocument(type, file);
    await load();
  } finally {
    uploadingType.value = null;
  }
};

const focusFirstMissing = async () => {
  await nextTick();
  const target = missingRequirements.value[0]?.element;
  if (!target) return;
  document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "center" });
  (document.getElementById(target)?.querySelector("input,textarea") as HTMLElement | null)?.focus();
};

const submit = async () => {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await api.saveDraft(draftPayload());
    await load();
    if (missingRequirements.value.length > 0) {
      await focusFirstMissing();
      return;
    }
    await api.submit();
    await load();
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await Promise.all([userStore.getTypeDocuments(), locationStore.fetchCountries()]);
  await load();
});
</script>
