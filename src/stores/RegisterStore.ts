import { defineStore } from "pinia";
import { ref } from "vue";

export const RegisterStore = defineStore("register", () => {
  const form = ref<RegisterUser>({
    first_name: "",
    second_name: "",
    last_name: "",
    second_last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
    code_phone: "",
    phone: "",
    username: "",
    referred_by: "",
    country_id: "",
    department_id: "",
    municipalitie_id: "",
    address: "",
    birth: "",
  });

  const steps = ref(1);
  const reset = () => {
    form.value = {
      first_name: "",
      second_name: "",
      last_name: "",
      second_last_name: "",
      email: "",
      password: "",
      password_confirmation: "",
      code_phone: "",
      phone: "",
      username: "",
      referred_by: "",
      country_id: "",
      department_id: "",
      municipalitie_id: "",
      address: "",
      birth: "",
    };
    steps.value = 1;
  };
  return {
    form,
    steps,
    reset,
  };

  interface RegisterUser {
    first_name: string;
    second_name: string;
    last_name: string;
    second_last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    code_phone: string;
    phone: string;
    username: string;
    referred_by?: string;
    country_id: "" | number;
    department_id: "" | number;
    municipalitie_id: "" | number;
    address: string;
    birth: string;
    // type_documents_id: '' | number,
    // document:"2640423711",
  }
});
