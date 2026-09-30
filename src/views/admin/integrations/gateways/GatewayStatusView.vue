<script setup lang="ts">
import { onMounted, ref } from "vue";
import { helperStore } from "@/helper";
import {
  listGatewayStatus,
  type GatewayStatus,
  type GatewayStatusParams,
} from "@/services/gatewaysApi";
import { getItems } from "@/utils/pagination";
import StatusChip from "@/views/admin/operability/components/StatusChip.vue";
import type { NormalizedApiError } from "@/services/apiErrors";
import {
  gatewayActionLabel,
  gatewayCircuitLabel,
  gatewayDriverLabel,
  gatewayOperationalLabel,
  gatewayProviderLabel,
  yesNoLabel,
} from "@/utils/internationalAccountsLabels";

const helper = helperStore();
const rows = ref<GatewayStatus[]>([]);
const filters = ref<GatewayStatusParams>({});
const loading = ref(false);
const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";
const clean = (params: GatewayStatusParams) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== "" && v !== null && v !== undefined,
    ),
  );

const load = async () => {
  try {
    loading.value = true;
    const res = await listGatewayStatus(clean(filters.value));
    rows.value = getItems<GatewayStatus>(res);
  } catch (caught: unknown) {
    const error = caught as NormalizedApiError;
    helper.showNotify(
      error?.message ?? "No fue posible cargar los proveedores",
      "error",
    );
  } finally {
    loading.value = false;
  }
};
onMounted(load);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-3">
      <div>
        <h1 class="text-h5 font-weight-bold mb-1">Estado de proveedores</h1>
        <div class="text-body-2 text-medium-emphasis">
          Estado operativo y control de circuitos local. No confirma
          disponibilidad remota.
        </div>
      </div>
      <VBtn prepend-icon="mdi-refresh" :loading="loading" @click="load"
        >Refrescar</VBtn
      >
    </div>
    <VCard rounded="lg" class="mb-4"
      ><VCardText>
        <VRow>
          <VCol cols="12" sm="6"
            ><VTextField v-model="filters.provider" label="Proveedor" clearable
          /></VCol>
          <VCol cols="12" sm="6"
            ><VTextField
              v-model="filters.action"
              label="Acci&oacute;n"
              clearable
          /></VCol>
        </VRow>
        <div class="d-flex justify-end ga-2">
          <VBtn
            variant="text"
            @click="
              filters = {};
              load();
            "
            >Limpiar</VBtn
          ><VBtn :loading="loading" @click="load">Aplicar</VBtn>
        </div>
      </VCardText></VCard
    >
    <VCard rounded="lg">
      <VTable>
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Acci&oacute;n</th>
            <th>Estado</th>
            <th>Circuito</th>
            <th>Configurado</th>
            <th>Llamadas externas</th>
            <th>Integraci&oacute;n</th>
            <th>Fallos</th>
            <th>Pr&oacute;ximo intento</th>
            <th>&Uacute;ltimo error</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="10" class="text-center py-8">
              <VProgressCircular indeterminate />
            </td>
          </tr>
          <tr v-else-if="rows.length === 0">
            <td colspan="10" class="text-center py-8 text-medium-emphasis">
              No hay proveedores para mostrar.
            </td>
          </tr>
          <tr
            v-for="(row, index) in rows"
            v-else
            :key="`${row.provider}-${row.action}-${index}`"
          >
            <td>{{ gatewayProviderLabel(row.provider) }}</td>
            <td>{{ gatewayActionLabel(row.action) }}</td>
            <td>
              <StatusChip
                :value="gatewayOperationalLabel(row.operational_status)"
              />
            </td>
            <td><StatusChip :value="gatewayCircuitLabel(row.state)" /></td>
            <td>
              {{
                row.configured == null
                  ? "No aplica"
                  : yesNoLabel(row.configured)
              }}
            </td>
            <td>
              {{
                row.external_calls_enabled == null
                  ? "No aplica"
                  : yesNoLabel(row.external_calls_enabled)
              }}
            </td>
            <td>{{ gatewayDriverLabel(row.driver) }}</td>
            <td>{{ row.consecutive_failures ?? 0 }}</td>
            <td>{{ formatDate(row.next_attempt_at) }}</td>
            <td class="text-truncate" style="max-width: 240px">
              {{
                row.last_error
                  ? "Fallo registrado; revisa los logs protegidos."
                  : "-"
              }}
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCard>
  </div>
</template>
