<template>
  <div v-if="helper.clickIn != 'Show'">
    <div class="d-flex justify-space-between flex-column flex-sm-row mb-8">
      <h3 class="text-primary">Lista de {{ $t("views.users.title", 2) }}</h3>
      <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
      <div>
        <VBtn v-if="helper.canAction('create')" @click="openModal" prepend-icon="mdi-plus" class="rounded-xl">
          {{ $t("buttons.add") }}
        </VBtn>
      </div>
    </div>
    <!-- <VBtn @click="openModal">{{ $t('buttons.create') }}</VBtn> -->
    <v-tabs class="mb-5" v-model="role_id" color="primary">
      <v-tab
        v-for="(role, i) in userStore.roles.filter((role) => role.id)"
        :value="role.id"
      >
        {{ role.attributes.name }}
      </v-tab>
    </v-tabs>
    <CrudComponent
      permission-reference="users"
      :singular="$t('views.users.title', 2)"
      :rows="rows"
     require-two-factor financial-scope="admin.security"></CrudComponent>
    <TableComponentVue
      :optionsHabilit="true"
      icon-show
      icon-update
      icon-delete
      text-delete="Desactivar"
      :headers="headers"
      :items="helper.items"
      permission-reference="users"
      new-buttons
      @show="showDetailUser"
      @update="openUpdate"
     require-two-factor financial-scope="admin.security">
      <template #cel-attributes.username="{ data }">
        <span class="text-primary">
          {{ user(data).attributes.username }}
        </span>
      </template>

      <template #cel-verificate-state="{ data }">
        <span class="text-table">
          <VIcon
            :icon="CheckedIcon"
            :color="emailVerificated(user(data)) ? 'success' : 'inactive'"
          >
          </VIcon>
          Email
        </span>
        <span class="text-table">
          <VIcon
            :icon="CheckedIcon"
            :color="phoneVerificated(user(data)) ? 'success' : 'inactive'"
          >
          </VIcon>
          Teléfono
        </span>
        <span class="text-table">
          <VIcon
            :icon="CheckedIcon"
            :color="kycVerificated(user(data)) ? 'success' : 'inactive'"
          >
          </VIcon>
          Kyc
        </span>
        <span class="text-table" id="dolaricon">
          <VIcon
            :icon="DollarIcon"
            :color="haveTransactions(user(data)) ? 'success' : 'inactive'"
          >
          </VIcon>
          Transc.
        </span>
      </template>
      <template #cel-referred="{ data }">
        <div
          v-if="user(data).relationships?.referred"
          class="text-left text-sky cursor-pointer"
          @click="openModalDetailUser(user(data).relationships?.referred?.id!)"
        >
          {{ user(data).relationships?.referred?.attributes.username }}
        </div>
      </template>
      <!-- Botones -->
      <template #newButtons="{ data }">
        <OptionsMenu
          :user="data"
          @click:send-email="
            openModalSendNotification(data, TypeNotification.EMAIL)
          "
          @click:send-sms="
            openModalSendNotification(data, TypeNotification.SMS)
          "
          @click:start-chat="startSupportChat"
        >
        </OptionsMenu>
      </template>
      <template #cel-penalty="{ data }">
        <RemovePenalty @delete-penalty="getSearch()" :user="user(data)" />
      </template>
    </TableComponentVue>
  </div>
  <dialog-global
    :dialog="openDetailUser"
    @close-dialog="
      openDetailUser = false;
      helper.url = 'users';
      getSearch();
    "
  >
    <detail-user-view in-modal :user="userModal!"></detail-user-view>
  </dialog-global>
  <send-message
    ref="sendMessageRef"
    :user="userSelect!"
    @close-modal="userSelect = undefined"
    :type="typeNotification!"
  >
  </send-message>
  <detail-user-view
    v-if="userSelect && helper.clickIn == 'Show'"
    :user="userSelect!"
    @back="back"
  />
</template>

<script setup lang="ts">
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import DetailUserView from "@/views/admin/users/DetailUser/DetailUserView.vue";
import SendMessage from "./OptionsMenu/SendMessage.vue";
import CrudComponent from "@/components/global/CrudComponent.vue";
import TableComponentVue from "@/components/global/TableComponent.vue";
import { helperStore } from "@/helper";
import type { Row } from "@/interfaces/FormComponent.helper";
import type { Head } from "@/interfaces/TableComponent.helper";
import { UserStore } from "@/stores/UserStore";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import CheckedIcon from "@/assets/icons/CheckedIcon.vue";
import { TypeNotification, type User } from "@/interfaces/User/User.model";
import { KYC_STATUS } from "@/enums/Kyc.enum";
import { ref, watch } from "vue";
import SearchInputComponentVue from "@/components/global/SearchInputComponent.vue";
import OptionsMenu from "./OptionsMenu/OptionsMenu.vue";
import type { Profile } from "@/interfaces/User/User.dto";
import { onUnmounted } from "vue";
import DollarIcon from "@/assets/icons/DollarIcon.vue";
import RemovePenalty from "./RemovePenalty.vue";
import { onMounted } from "vue";
import { useLocationStore } from "@/stores/LocationStore";
import { useRouter } from "vue-router";

const helper = helperStore();
helper.url = "users";
helper.initView();

const role_id = ref<number | "">("");
const openDetailUser = ref(false);
const userModal = ref<User>();
const openModalDetailUser = async (user_id: number) => {
  const url = "/users/" + user_id;
  const res = await helper.http(url);
  userModal.value = res.data.response;
  openDetailUser.value = true;
};
const typeNotification = ref<TypeNotification>();
const sendMessageRef = ref<InstanceType<typeof SendMessage> | null>();
const userSelect = ref<User>();

const openModalSendNotification = (
  user: User,
  typeNotificationI: TypeNotification
) => {
  userSelect.value = user;
  typeNotification.value = typeNotificationI;
  sendMessageRef.value!.modal = true;
};

// helper.index();
const search = ref<string>("");
const getSearch = () => {
  helper.index({
    user: search.value,
    role_id: role_id.value,
  });
};
const userStore = UserStore();
const router = useRouter();
const startSupportChat = (target: User) => router.push({ name: "admin-support-chat", query: {
  customer: String(target.id),
} });
userStore.getUsers();
const location = useLocationStore();
const { countries, departments, municipalities } = storeToRefs(location);
const {
  formCrud,
  openModalCrud,
  item: itemH,
  clickIn,
  formRef,
} = storeToRefs(helper);

onMounted(() => {
  location.fetchCountries();
  location.fetchNationalities();
  countries.value = location.countries;
});

watch(
  () => formCrud.value.country_id,
  (id) => {

    formCrud.value.department_id = "";
    formCrud.value.municipalitie_id = "";
    location.fetchDepartments(String(id));
  }
);

watch(
  () => formCrud.value.department_id,
  (id) => {
    formCrud.value.municipalitie_id = "";
    location.fetchMunicipalities(String(id));
  }
);

const loadRoleFiltersAndUsers = async () => {
  if (userStore.hasPermission("roles.index")) {
    try {
      await userStore.getRoles();
      const defaultRole = userStore.roles.find((role) => role.id);
      if (defaultRole) {
        role_id.value = defaultRole.id;
      }
    } catch (error) {
      console.error("Error loading role filters:", error);
    }
  }

  getSearch();
};

void loadRoleFiltersAndUsers();
userStore.getTypeDocuments();

watch(role_id, () => {
  getSearch();
});

const { users, roles, typeDocuments } = storeToRefs(userStore);

const openModal = async () => {
  itemH.value = {};
  formCrud.value = {};
  clickIn.value = "Create";
  openModalCrud.value = true;
};
const { t } = useI18n();

const user = (item: unknown): User => item as User;

const back = () => window.location.reload();

const rows: Row[] = [
  {
    fields: [
      {
        label: t("views.users.first_name"),
        type: "text",
        colClass: ["v-col-12 v-col-md-3 v-col-sm-6"],
        valueForm: "first_name",
      },
      {
        label: t("views.users.second_name"),
        type: "text",
        colClass: ["v-col-12 v-col-md-3 v-col-sm-6"],
        valueForm: "second_name",
      },
      {
        label: t("views.users.last_name"),
        type: "text",
        colClass: ["v-col-12 v-col-md-3 v-col-sm-6"],
        valueForm: "last_name",
      },
      {
        label: t("views.users.second_last_name"),
        type: "text",
        colClass: ["v-col-12 v-col-md-3 v-col-sm-6"],
        valueForm: "second_last_name",
      },
    ],
  },
  {
    fields: [
      {
        label: t("views.users.email"),
        type: "text",
        valueForm: "email",
      },
      {
        label: t("views.users.password"),
        type: "text",
        valueForm: "password",
      },
    ],
  },
  {
    fields: [
      {
        label: t("views.users.phone"),
        valueForm: "phoneFormat",
        rules: [],
        colClass: ["v-col-12 v-col-sm-6"],
        type: "phone",
        phone: {
          fieldCode: "code_phone",
          fieldPhone: "phone",
          fieldValid: "phoneIsValid",
        },
      },
      {
        label: t("views.users.username"),
        type: "text",
        valueForm: "username",
      },
    ],
  },
  {
    fields: [
      {
        label: t("views.users.referred_by"),
        type: "select",
        colClass: ["v-col-12 v-col-sm-4"],
        valueForm: "referred_by",
        select: {
          items: users,
          itemTitle: "attributes.username",
          itemValue: "id",
        },
      },
      {
        label: t("views.roles.title"),
        type: "select",
        colClass: ["v-col-12 v-col-sm-4"],
        valueForm: "role_id",
        select: {
          items: roles,
          itemTitle: "attributes.name",
          itemValue: "id",
        },
      },
      {
        label: t("views.countries.title"),
        type: "select",
        colClass: ["v-col-12 v-col-sm-4"],
        valueForm: "country_id",
        select: {
          items: countries,
          itemTitle: "attributes.name",
          itemValue: "id",
        },
      },
    ],
  },
  {
    fields: [
      {
        label: t("views.departments.title"),
        type: "select",
        colClass: ["v-col-12 v-col-sm-6"],
        valueForm: "department_id",
        select: {
          items: departments,
          itemTitle: "attributes.name",
          itemValue: "id",
        },
      },
      {
        label: t("views.municipalities.title"),
        type: "select",
        colClass: ["v-col-12 v-col-sm-6"],
        valueForm: "municipalitie_id",
        select: {
          items: municipalities,
          itemTitle: "attributes.name",
          itemValue: "id",
        },
      },
    ],
  },
  {
    fields: [
      {
        label: t("views.type_documents.title"),
        type: "select",
        valueForm: "type_documents_id",
        select: {
          items: typeDocuments,
          itemTitle: "attributes.type_document",
          itemValue: "id",
        },
      },
      {
        label: t("views.users.document"),
        type: "text",
        valueForm: "document",
      },
      {
        label: t("views.users.birth"),
        type: "date",
        valueForm: "birth",
      },
      {
        label: t("views.users.address"),
        colClass: ["v-col-12 v-col-sm-12"],
        type: "text",
        valueForm: "address",
      },
    ],
  },
];

const headers: Head[] = [
  {
    name: t("views.users.user"),
    value: "attributes.username",
  },
  {
    name: t("views.users.email"),
    value: "attributes.email",
  },
  {
    name: t("views.users.estate-verification"),
    value: "verificate-state",
    style: "min-width:350px",
  },
  {
    name: t("views.users.referred-by"),
    value: "referred",
  },
  {
    name: t("genereal-views.state"),
    value: "attributes.deleted_at",
    status: "deleted",
  },
  {
    name: "Penalizaciones",
    value: "penalty",
  },
  {
    name: t("views.users.created_at"),
    value: "attributes.created_at",
    type: "date",
    format: "YYYY-MM-DD | HH:mm:ss",
    style: "min-width:250px",
  },
];

const emailVerificated = (user: User): boolean => {
  return user.attributes.email_verified_at ? true : false;
};
const phoneVerificated = (user: User): boolean => {
  return user.attributes.phone_verified_at ? true : false;
};
const kycVerificated = (user: User): boolean => {
  return user.relationships?.kyc?.attributes.status == KYC_STATUS.ACCEPT
    ? true
    : false;
};
const haveTransactions = (user: User): boolean =>
  !!user.attributes.order_system;

const showDetailUser = (user: User) => {
  userSelect.value = user;
};

const openUpdate = (user: User) => {
  const itemUpdate: Profile & { role_id: number | "" } = {
    address: user.relationships?.userDetail.attributes.address ?? "",
    birth: user.relationships?.userDetail.attributes.birth ?? "",
    code_phone: user.attributes.code_phone,
    country_id: user.relationships?.userDetail.attributes.country_id ?? "",
    department_id:
      user.relationships?.userDetail.attributes.department_id ?? "",
    document: user.relationships?.userDetail.attributes.document ?? "",
    email: user.attributes.email,
    first_name: user.attributes.first_name,
    last_name: user.attributes.last_name,
    municipalitie_id:
      user.relationships?.userDetail.attributes.municipalitie_id ?? "",
    nationality_id:
      user.relationships?.userDetail.attributes.nationality_id ?? "",
    phone: user.attributes.phone,
    second_last_name: user.attributes.second_last_name,
    second_name: user.attributes.second_name,
    type_documents_id:
      user.relationships?.userDetail.attributes.type_documents_id ?? "",
    username: user.attributes.username,
    role_id: user.relationships?.roles.find((role) => role.id)?.id ?? "",
  };
  formCrud.value = itemUpdate;
  itemH.value = user;
  openModalCrud.value = true;
};

onUnmounted(() => {
  userSelect.value = undefined;
  helper.clickIn = "";
});
</script>

<style scoped lang="scss">
#dolaricon {
  $icon-line-height: 3;
}
</style>
