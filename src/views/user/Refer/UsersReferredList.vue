<template>
  <div class="d-flex gap-2 justify-space-between flex-column flex-sm-row mb-1">
    <h3 class="text-primary">Lista de {{ $t("views.users.referreds", 2) }}</h3>
    <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
  </div>
  <div class="text-table mb-3">
    <div>
      Cuando tienes un referido y se registra, tus XCOP seran abonados en el
      momento que el usuario haga su primer transaccion.
    </div>
    <div class="my-5" style="max-width: 330px">
      <div class="d-flex justify-space-between">
        <div>Referidos que han usado tu código:</div>
        <div class="text-primary">
          {{ usersReferreds?.length }}
        </div>
      </div>
      <div class="d-flex justify-space-between border-t">
        <div>Referidos con transacciones:</div>
        <div class="text-primary">
          {{ countReferredsWithTransactions }}
        </div>
      </div>
    </div>
  </div>
  <TableComponentVue
    :optionsHabilit="false"
    :headers="headers"
    :items="usersReferreds!"
  >
    <template #cel-name="{ data }">
      {{ getFullName(data as unknown as User) }}
    </template>
    <template #cel-code="{ data }">
      <VIcon
        :color="user(data).attributes.order_system ? 'ok' : ''"
        :icon="CheckedIcon"
      />
    </template>
  </TableComponentVue>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import TableComponentVue from "@/components/global/TableComponent.vue";
import { getFullName, helperStore } from "@/helper";
import type { Head } from "@/interfaces/TableComponent.helper";
import { useI18n } from "vue-i18n";
import SearchInputComponentVue from "@/components/global/SearchInputComponent.vue";
import type { User } from "@/interfaces/User/User.model";
import CheckedIcon from "@/assets/icons/CheckedIcon.vue";
const helper = helperStore();

const user = (item: unknown): User => item as User;

const props = defineProps<{
  user?: User;
}>();

const usersReferreds = ref<User[]>();

const getReferreds = async () => {
  const url = "users/referes/affiliate";
  const params = { user_id: props.user?.id };
  const res = await helper.http(url, "get", { params });
  usersReferreds.value = res.data.response.relationships.referrals;
};
getReferreds();

const search = ref<string>("");

const getSearch = () => {
  helper.index({
    name: search.value,
  });
};

const { t } = useI18n();

const headers: Head[] = [
  {
    name: t("general-views.name"),
    value: "name",
  },
  {
    name: t("views.transactions.title", 2),
    value: "code",
  },
];

const countReferredsWithTransactions = computed(
  (): number =>
    usersReferreds.value?.filter(
      (userReferred) => userReferred.attributes.order_system
    ).length ?? 0
);
</script>
