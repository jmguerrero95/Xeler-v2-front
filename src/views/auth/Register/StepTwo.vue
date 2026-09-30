<template>
  <VRow>
    <VCol class="text-center h4 font-weight-bold">
      {{ $t("views.register.step-one.ubication-data") }}
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <SelectComponentVue
        :name="$t('views.countries.title')"
        :items="countries"
        itemTitle="attributes.name"
        itemValue="id"
        :firstElement="{ id: '', attributes: { name: 'Seleccione un país' } }"
        v-model="form.country_id"
        id="country"
      ></SelectComponentVue>
    </VCol>
    <VCol>
      <SelectComponentVue
        :name="$t('views.departaments.title')"
        :items="departments"
        itemTitle="attributes.name"
        itemValue="id"
        :firstElement="{
          id: '',
          attributes: { name: 'Seleccione un departamento' },
        }"
        v-model="form.department_id"
        id="departament"
      ></SelectComponentVue>
    </VCol>
    <VCol>
      <SelectComponentVue
        :name="$t('views.municipalities.title')"
        :items="municipalities"
        itemTitle="attributes.name"
        itemValue="id"
        :firstElement="{
          id: '',
          attributes: { name: 'Seleccione un Municipio' },
        }"
        v-model="form.municipalitie_id"
        id="municipalities"
      ></SelectComponentVue>
    </VCol>
  </VRow>
  <VRow>
    <InputComponent
      id="dirrecion"
      :name="$t('views.register.address')"
      v-model="form.address"
      :rules="[validator.required]"
    />
  </VRow>
</template>

<script setup lang="ts">
import InputComponent from "@/components/InputComponent.vue";
import * as validator from "@/validator";
import { storeToRefs } from "pinia";
import { RegisterStore } from "@/stores/RegisterStore";
import { useLocationStore } from "@/stores/LocationStore";
import SelectComponentVue from "@/components/SelectComponent.vue";
import { onMounted, watch } from "vue";

const registerStore = RegisterStore();
const { form } = storeToRefs(registerStore);
const locationStore = useLocationStore();
const { countries, departments, municipalities } = storeToRefs(locationStore);

onMounted(() => {
  locationStore.fetchCountries();
});

watch(
  () => form.value.country_id,
  async (countryId) => {
    form.value.department_id = "";
    form.value.municipalitie_id = "";
    departments.value = [];
    municipalities.value = [];

    if (!countryId) return;
    await locationStore.fetchDepartments(String(countryId));
  },
);

watch(
  () => form.value.department_id,
  async (departmentId) => {
    form.value.municipalitie_id = "";
    municipalities.value = [];

    if (!departmentId) return;
    await locationStore.fetchMunicipalities(String(departmentId));
  },
);
</script>
