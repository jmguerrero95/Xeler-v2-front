<template>
  <div>
    <div
      v-if="!itemsDetails || itemsDetails.length === 0"
      class="text-table rounded-lg pa-4"
      style="background-color: rgba(239, 93, 168, 0.08)"
    >
      No hay puntos de efectivo disponibles en este momento.
    </div>
    <VRow v-else>
      <VCol
        cols="4"
        v-for="(efectyAccount, i) in itemsDetails as EfectyAccount[]"
        :key="i"
        @click="selectItem(efectyAccount)"
      >
        <VBtnDegree
          rounded="lg"
          :class="{
            'payment-selected': efectyAccount.id == modelValue?.id,
          }"
          color="white"
        >
          <template #prepend>
            <VIcon icon="mdi-map-marker" size="28"></VIcon>
          </template>
          {{ efectyAccount.attributes.location }}
        </VBtnDegree>
      </VCol>
    </VRow>

    <VRow v-if="itemSelect" class="px-5">
      <VCol
        cols="12"
        sm="12"
        class="text-table border-degree text-left font-22 font-weight-light"
      >
        <p class="">
          <span class="text-primary font-weight-light">Dirección:</span>
          <br />{{ itemSelect?.attributes.description }}
        </p>
        <p>Nombre: {{ itemSelect?.attributes.beneficiary }}</p>
        <VSpacer></VSpacer>
        <div class="mt-5">
          <span class="text-primary font-weight-light">Indicaciones:</span>
          <ul class="ml-10" style="list-style-type: decimal">
            <li>Informar un pago para Xeler Go!.</li>
            <li>Entregar el dinero.</li>
            <li>Conservar el recibo.</li>
          </ul>
        </div>
      </VCol>
      <VCol cols="12" sm="12">
        <div v-if="center" style="width: 100%; height: 500px">
          <LeafMap :coordinates="center" />
        </div>
        <div
          v-else
          class="text-table rounded-lg pa-4 mt-4"
          style="background-color: rgba(239, 93, 168, 0.08)"
        >
          Este punto no tiene coordenadas registradas.
        </div>
      </VCol>
    </VRow>
  </div>
</template>

<script setup lang="ts">
import type { EfectyAccount } from "@/interfaces/CompanyAccount/EfectyAccount/EfectyAccount.model";
import { ref } from "vue";
import LeafMap from "@/components/LeafMap.vue";
const { modelValue, itemsDetails } = defineProps<{
  itemsDetails: any[] | null | undefined;
  modelValue: any;
}>();
const itemSelect = ref<EfectyAccount | null>(null);

const center = ref<[number, number] | null>(null);

const emits = defineEmits<{
  (e: "update:model-value", value: EfectyAccount): void;
}>();

const parseCoordinates = (value: unknown): [number, number] | null => {
  if (typeof value !== "string" || !value.includes(",")) {
    return null;
  }

  const [lat, lng] = value
    .split(",")
    .map((item: string) => Number.parseFloat(item.trim()));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return [lat, lng];
};

const selectItem = (item: EfectyAccount) => {
  emits("update:model-value", item);
  center.value = parseCoordinates(item.attributes.coordinate);
  itemSelect.value = item;
};
</script>

<style scoped lang="scss">
@use "@/scss/variables.scss" as *;
.v-text-field__slot.payment-selected {
  background: none;
}

.payment-selected {
  color: white !important;
  background-color: $color-primary !important;
}
</style>
