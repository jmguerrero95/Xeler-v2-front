<template>
  <VContainer>
    <h1 class="text-h5 mb-1">Reportes operativos</h1>
    <p class="text-medium-emphasis mb-5">
      Montos historicos y actividad del backoffice.
    </p>
    <VRow>
      <VCol cols="12" sm="3"
        ><VTextField v-model="filters.date_from" type="date" label="Desde"
      /></VCol>
      <VCol cols="12" sm="3"
        ><VTextField v-model="filters.date_to" type="date" label="Hasta"
      /></VCol>
      <VCol cols="12" sm="3"
        ><VSelect
          v-model="filters.order_type"
          clearable
          :items="['Compra', 'Venta']"
          label="Tipo"
      /></VCol>
      <VCol cols="12" sm="3"
        ><VBtn data-test="apply-filters" block @click="load"
          >Aplicar filtros</VBtn
        ></VCol
      >
    </VRow>
    <VAlert v-if="error" type="error" variant="tonal">{{ error }}</VAlert>
    <VProgressLinear v-if="loading" indeterminate />
    <VRow v-if="report" class="mt-4">
      <VCol
        v-for="metric in metrics"
        :key="metric.label"
        cols="12"
        sm="6"
        lg="3"
      >
        <VCard
          ><VCardText
            ><div class="text-medium-emphasis">{{ metric.label }}</div>
            <div class="text-h5">{{ metric.value }}</div></VCardText
          ></VCard
        >
      </VCol>
    </VRow>
    <VAlert
      v-else-if="!loading && !error"
      data-test="empty"
      type="info"
      variant="tonal"
      class="mt-4"
      >Selecciona filtros para consultar el reporte.</VAlert
    >
  </VContainer>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  getAdminReport,
  type AdminReport,
  type AdminReportFilters,
} from "@/services/adminReportsApi";

const filters = reactive<AdminReportFilters>({ timezone: "America/Bogota" });
const report = ref<AdminReport | null>(null);
const loading = ref(false);
const error = ref("");
const metrics = computed(() =>
  report.value
    ? [
        { label: "Ordenes", value: report.value.orders.total },
        { label: "Volumen COP", value: report.value.orders.volume_cop },
        { label: "Usuarios activos", value: report.value.users.active },
        {
          label: "Tickets abiertos",
          value: report.value.operation.open_tickets,
        },
      ]
    : [],
);
const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    const response = await getAdminReport(filters);
    report.value = ((response.data as { data?: AdminReport }).data ??
      response.data) as AdminReport;
  } catch {
    report.value = null;
    error.value = "No fue posible cargar el reporte.";
  } finally {
    loading.value = false;
  }
};
</script>
