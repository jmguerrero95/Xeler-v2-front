<template>
  <div class="d-flex justify-space-between flex-column flex-sm-row mb-8">
    <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
    <div>
      <VBtn v-if="helper.canAction('create')" @click="openModal" prepend-icon="mdi-plus" class="rounded-xl">
        {{ $t("buttons.add") }}
      </VBtn>
    </div>
  </div>

  <CrudComponent
    :singular="$t('views.banks.title')"
    :rows="rows"
  ></CrudComponent>
  <!-- <h3>{{$t('views.type_documents.title',2)}}</h3> -->
  <TableComponentVue
    simple
    :options-simple="{ value: 'attributes.name', max_columns: 1 }"
    optionsHabilit
    icon-update
    icon-delete
    :headers="headers"
    @update="openUpdate"
    :items="helper.items"
  >
    <template #cel-name="{ data }">
      <div
        class="text-table"
        :style="[`min-width: ${$vuetify.display.xs ? 110 : 150}px!important;`]"
      >
        {{
          //@ts-ignore
          data.attributes.name
        }}
      </div>
    </template>
  </TableComponentVue>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CrudComponent from "@/components/global/CrudComponent.vue";
import TableComponentVue from "@/components/global/TableComponent.vue";
import { helperStore } from "@/helper";
import type { Row } from "@/interfaces/FormComponent.helper";
import type { Head } from "@/interfaces/TableComponent.helper";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import type { Bank } from "@/interfaces/Bank/Bank.model";
import type { BankCreate } from "@/interfaces/Bank/Bank.dto";
import SearchInputComponentVue from "@/components/global/SearchInputComponent.vue";
import { useLocationStore } from "@/stores/LocationStore";
import * as validator from "@/validator";
const helper = helperStore();
helper.url = "banks";
helper.initView();
helper.defaultParams = {
  deletes: true,
};
helper.index();

const locationStore = useLocationStore();
const { countries } = storeToRefs(locationStore);
locationStore.fetchCountries();

const search = ref<string>("");
const getSearch = () => {
  helper.index({
    name: search.value,
  });
};
const openUpdate = (item: Bank) => {
  itemH.value = item;
  const itemUpdate: BankCreate = {
    color: item.attributes.color,
    country_id: item.relationships?.country.id ?? 0,
    description: item.attributes.description,
    name: item.attributes.name,
    status: item.attributes.status,
    icon:
      item.relationships?.images && item.relationships?.images.length > 0
        ? item.relationships?.images[0].attributes.aws_url ?? ""
        : "",
  };
  formCrud.value = itemUpdate;
  openModalCrud.value = true;
};

const openModal = async () => {
  itemH.value = false;
  formCrud.value = {};
  clickIn.value = "Create";
  openModalCrud.value = true;
};

const { t } = useI18n();
const {
  formCrud,
  openModalCrud,
  clickIn,
  formRef,
  item: itemH,
} = storeToRefs(helper);
const rows: Row[] = [
  {
    fields: [
      {
        label: t("general-views.name"),
        type: "text",
        valueForm: "name",
        rules: [validator.required],
        colClass: ["v-col-12 v-col-sm-6"],
      },
      {
        label: t("general-views.description"),
        type: "text",
        valueForm: "description",
        colClass: ["v-col-12 v-col-sm-6"],
      },
      {
        label: t("views.countries.title"),
        type: "select",
        valueForm: "country_id",
        select: {
          items: countries,
          itemTitle: "attributes.name",
          itemValue: "id",
        },
        rules: [validator.required],
      },
    ],
  },
  {
    fields: [
      {
        label: t("general-views.image"),
        type: "image",
        valueForm: "icon",
      },
      {
        label: t("general-views.color"),
        type: "color",
        valueForm: "color",
      },
    ],
  },
];

const headers: Head[] = [
  {
    name: t("general-views.name"),
    value: "name",
  },
  {
    name: "Status",
    value: "deleted_at",
    status: "deleted",
  },
];
</script>

<style scoped>
.custom-text-field .v-input__control {
  border-radius: 50px;
}
</style>
