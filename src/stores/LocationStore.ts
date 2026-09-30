import { defineStore } from "pinia";
import { ref } from "vue";
import { helperStore } from "@/helper";
import type { Country } from "@/interfaces/Country/Country.model";
import type { Departament } from "@/interfaces/Departament/Departament.model";
import type { Municipality } from "@/interfaces/Municipality/Municipality.model";

export const useLocationStore = defineStore("location", () => {
  const helper = helperStore();

  // Listas reactivas
  const countries = ref<Country[]>([]);
  const departments = ref<Departament[]>([]);
  const municipalities = ref<Municipality[]>([]);
  const nationalities = ref<Country[]>([]);

  /** Carga todos los países (id + name) */
  async function fetchCountries(): Promise<void> {
    try {
      const res = await helper.http("countrys/list", "get");
      countries.value = res.data.response;
    } catch (err) {
      console.error("Error cargando países:", err);
      countries.value = [];
    }
  }

  /** Carga departamentos de un país dado */
  async function fetchDepartments(countryId: string): Promise<void> {
    departments.value = [];
    municipalities.value = [];
    if (!countryId) return;

    try {
      const res = await helper.http(`departments/list/${countryId}`, "get");
      departments.value = res.data.response;
    } catch (err) {
      console.error(`Error cargando departamentos de país ${countryId}:`, err);
      departments.value = [];
    }
  }

  /** Carga municipios de un departamento dado */
  async function fetchMunicipalities(departmentId: string): Promise<void> {
    municipalities.value = [];
    if (!departmentId) return;

    try {
      const res = await helper.http(
        `municipalitys/list/${departmentId}`,
        "get"
      );
      municipalities.value = res.data.response;
    } catch (err) {
      console.error(`Error cargando municipios de depto ${departmentId}:`, err);
      municipalities.value = [];
    }
  }

  async function fetchNationalities(page?: number) {
    try {
      const res = await helper.http("nationalities", "get", {
        params: page ? { pag: page } : {},
      });
      nationalities.value = res.data.response;
    } catch (err) {
      console.error("Error cargando nacionalidades:", err);
      nationalities.value = [];
    }
  }

  return {
    countries,
    departments,
    municipalities,
    nationalities,
    fetchCountries,
    fetchDepartments,
    fetchMunicipalities,
    fetchNationalities,
  };
});
