import { defineStore, storeToRefs } from "pinia";
import { useLocationStore } from "./LocationStore";

export const BankStore = defineStore("bank", () => {
  const locationStore = useLocationStore();
  const { countries } = storeToRefs(locationStore);
  const getCountries = locationStore.fetchCountries;
  return {
    countries,
    getCountries,
  };
});
