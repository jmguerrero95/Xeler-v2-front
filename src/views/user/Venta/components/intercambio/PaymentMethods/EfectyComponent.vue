<template>
  <div>
    <VRow>
      <VCol
        v-for="(efectyAccount, i) in itemsDetails"
        :key="i"
        cols="4"
        @click="selectItem(efectyAccount)"
      >
        <VBtnDegree
          rounded="lg"
          :class="{
            'payment-selected': efectyAccount.id == props.modelValue?.id,
          }"
          color="primary"
        >
          <template #prepend>
            <VIcon icon="mdi-map-marker" size="28" />
          </template>
          {{ efectyAccount.attributes.location }}
        </VBtnDegree>
      </VCol>
    </VRow>

    <VRow v-if="itemSelect" class="px-5">
      <VCol cols="12" sm="6" class="font-weight-bold text-table">
        <p>Direccion: {{ itemSelect?.attributes.description }}</p>
        <p>Nombre: {{ itemSelect?.attributes.beneficiary }}</p>
        <VSpacer />
        <p>Indicaciones:</p>
        <ul class="ml-10">
          <li>Informar un pago para Xeler Go!.</li>
          <li>Entregar el dinero.</li>
          <li>Conservar el recibo.</li>
        </ul>
      </VCol>
      <VCol cols="12" sm="6">
        <div
          v-if="!center"
          class="text-table rounded-lg pa-4"
          style="background-color: rgba(239, 93, 168, 0.08)"
        >
          Este punto no tiene coordenadas registradas.
        </div>
        <GoogleMap
          v-else
          :api-key="apiGoogleKey"
          style="width: 100%; height: 500px"
        >
          <Marker :options="markerOptions" />
        </GoogleMap>
      </VCol>
    </VRow>
  </div>
</template>

<script setup lang="ts">
import { GoogleMap, Marker } from "vue3-google-map";
import type { EfectyAccount } from "@/interfaces/CompanyAccount/EfectyAccount/EfectyAccount.model";
import { parseCoordinateString } from "@/utils/decimal";
import { computed, ref } from "vue";

const props = defineProps<{
  itemsDetails: EfectyAccount[];
  modelValue: EfectyAccount | null;
}>();

const apiGoogleKey = import.meta.env.VITE_API_GOOGLE as string;
const emits =
  defineEmits<(e: "update:model-value", value: EfectyAccount) => void>();

const itemSelect = ref<EfectyAccount | null>(null);
const center = ref<{ lat: number; lng: number } | null>(null);

const markerOptions = computed(() =>
  center.value
    ? {
        position: center.value,
        label: "L",
        title: "Punto de pago",
      }
    : undefined
);

const parseCoordinates = (value?: string | null) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [latRaw, lngRaw] = value.split(",");
  if (!latRaw || !lngRaw) {
    return null;
  }

  const lat = parseCoordinateString(latRaw.trim());
  const lng = parseCoordinateString(lngRaw.trim());

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return { lat, lng };
};

const selectItem = (item: EfectyAccount) => {
  emits("update:model-value", item);
  center.value = parseCoordinates(item.attributes.coordinate);
  itemSelect.value = item;
};
</script>

<style scoped>
.v-text-field__slot.payment-selected {
  background: none;
}

.payment-selected {
  color: white !important;
}
</style>
