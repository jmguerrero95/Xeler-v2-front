<template>
  <div class="mt-4">
    <div v-if="!loading && subjects.length === 1" class="operation-subject-single" data-test="single-operation-subject">
      Operas como <strong>{{ subjects[0].title }}</strong>
    </div>
    <VSelect
      v-else
      :model-value="modelValue"
      :items="subjects"
      item-title="title"
      item-value="value"
      label="Operar como"
      :loading="loading"
      :error-messages="error ? [error] : []"
      @update:model-value="emit('update:modelValue', $event ?? null)"
    />
    <p class="text-table text-caption mt-1">Monto máximo por orden: COP 9.000.000.</p>
  </div>
</template>

<script setup lang="ts">
import { useCompaniesApi } from "@/services/companiesApi";
import { onMounted, ref } from "vue";

defineProps<{ modelValue: number | null }>();
const emit = defineEmits<{ (event: "update:modelValue", value: number | null): void }>();
const api = useCompaniesApi();
const loading = ref(false);
const error = ref("");
const subjects = ref<Array<{ title: string; value: number | null }>>([
  { title: "Persona natural", value: null },
]);

onMounted(async () => {
  loading.value = true;
  try {
    const companies = await api.approved();
    subjects.value = [
      { title: "Persona natural", value: null },
      ...companies.map((company: any) => ({
        title: `Empresa aprobada - ${company.legal_name}`,
        value: Number(company.id),
      })),
    ];
  } catch {
    error.value = "No pudimos cargar las empresas aprobadas.";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.operation-subject-single { color: #344054; padding: 8px 0; }
</style>
