<template>
    <div v-if="helper.clickIn == ''">
        <VAlert type="info" variant="tonal" class="mb-4">Los roles esenciales User y Superadmin están protegidos y no pueden renombrarse ni eliminarse.</VAlert>
        <div class="d-flex flex-column mb-8 flex-sm-row justify-space-between">
            <!-- <SearchInputComponentVue v-model="search" @onSearch="getSearch" /> -->
            <div></div>
            <div>
                <VBtn v-if="canCreateRoles" @click="openComponent(undefined)" prepend-icon="mdi-plus" class="rounded-xl">
                    {{ $t("buttons.add") }}
                </VBtn>
            </div>
        </div>

        <TableComponentVue
            optionsHabilit
            icon-update
            icon-delete
            :headers="headers"
            :items="helper.items"
            permission-reference="roles"
            :immutable-item-names="['User', 'Superadmin']"
            
            @update="openComponent"
         require-two-factor financial-scope="admin.security">

        </TableComponentVue>
    </div>
    <create-or-edit-role
        v-if="helper.clickIn == 'Edit' || helper.clickIn == 'Create'"
        :role="role"
        @create-or-update="helper.index()"
        >
    </create-or-edit-role>
</template>

<script setup lang="ts">
import CreateOrEditRole from "@/views/admin/security/roles/CreateOrEditRole.vue";
import SearchInputComponentVue from "@/components/global/SearchInputComponent.vue";
import CrudComponent from "@/components/global/CrudComponent.vue";
import TableComponentVue from "@/components/global/TableComponent.vue";
import { helperStore } from "@/helper";
import type { Row } from "@/interfaces/FormComponent.helper";
import type { Head } from "@/interfaces/TableComponent.helper";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { RoleStore } from "@/stores/RoleStore";
import { ref } from "vue";
import { computed } from "vue";
import type { Role } from "@/interfaces/Role/Role.model";
import { UserStore } from "@/stores/UserStore";
const helper = helperStore();
helper.url = "roles";
helper.initView()
helper.index();
helper.clickIn = ''
const search = ref<string>("");
const getSearch = () => {
    helper.index({
        name: search.value,
    });
};

const roleStore = RoleStore();
const userStore = UserStore();
const canCreateRoles = computed(() => userStore.hasPermission("roles.store"));
roleStore.getPermissionCategories();
const { permissions } = storeToRefs(roleStore);

const role = ref<Role>()

const openModal = async () => {
    formCrud.value = {};
    clickIn.value = "Create";
    openModalCrud.value = true;
};

const openComponent = (roleItem?: Role) => {
    if(roleItem){
        role.value = roleItem
        helper.clickIn = 'Edit'
        return
    }
    role.value = undefined
    helper.clickIn = 'Create';
}

const { t } = useI18n();
const { formCrud, openModalCrud, clickIn, formRef } = storeToRefs(helper);
const rows: Row[] = [
    {
        fields: [
            {
                label: t("general-views.name"),
                type: "text",
                valueForm: "name",
            },
            {
                label: t("views.permissions.title"),
                type: "select",
                select: {
                    items: permissions,
                    itemTitle: "attributes.name",
                    itemValue: "id",
                    multiple: true,
                },
                valueForm: "permissions",
            },
        ],
    },
];

const headers: Head[] = [
    {
        name: t("general-views.name"),
        value: "attributes.name",
    },
];
</script>

<style scoped></style>
