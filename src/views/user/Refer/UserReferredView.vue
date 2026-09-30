<template>
  <div
    class="d-flex justify-space-between align-center align-sm-start flex-column flex-sm-row text-primary"
  >
    <div class="w-100 text-center">
      <h3 class="mt-2">Lista de referidos</h3>
    </div>
    <div style="width: 300px">
      <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
    </div>
  </div>
  <div class="text-table my-5">
    Cuando tienes un referido y se registra, tus
    <span class="text-primary">XCOP</span> seran abonados en el momento que el
    usuario haga su primer transaccion.
  </div>
  <div class="w-100 d-sm-flex justify-end">
    <div class="text-table">
      <div class="d-flex justify-space-between border-b" style="width: 320px">
        <div class="">Referidos que han usado tu código:</div>
        <div class="text-primary">
          {{ referredUsers?.length }}
        </div>
      </div>
      <div class="d-flex justify-space-between" style="width: 320px">
        <div class="">Referidos con transacciones:</div>
        <div class="text-primary">
          {{ referredUsers?.length }}
        </div>
      </div>
    </div>
  </div>
  <TableComponent
    :optionsHabilit="false"
    :headers="headers"
    :items="referredUsers ?? []"
  >
    <template #cel-name="{ data }">
      {{ getFullName(user(data)) }}
    </template>
  </TableComponent>
</template>

<script setup lang="ts">
import TableComponent from "@/components/global/TableComponent.vue";
import { getFullName, helperStore } from "@/helper";
import type { Head } from "@/interfaces/TableComponent.helper";
import type { User } from "@/interfaces/User/User.model";
import { ref } from "vue";
import SearchInputComponentVue from "@/components/global/SearchInputComponent.vue";

const helper = helperStore();

const search = ref<string>("");
const getSearch = () => {
  helper.index({
    tranx_no: search.value,
  });
};
const referredUsers = ref<User[]>();
const url = "users/referes/affiliate";
const user = (data: unknown): User => data as User;

helper.http(url).then((res: any) => {
  referredUsers.value =
    (res.data.response as User).relationships?.referrals ?? [];
});

const headers: Head[] = [
  {
    name: "Nombre",
    value: "name",
  },
  {
    name: "Transacciones",
    value: "transactions",
  },
];
</script>
