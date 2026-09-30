<template>
    <div class="d-flex justify-space-between">
        <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
        <VBtn
            v-if="helper.canAction('create', 'permissions')"
            prepend-icon="mdi-plus"
            class="rounded-xl"
            @click="openModal"
        >
            {{ $t('buttons.add') }}
        </VBtn>
    </div>

    <CrudComponent
        singular="Permiso"
        :rows="rows"
        permission-reference="permissions"
        require-two-factor
        financial-scope="admin.security"
    />

    <TableComponentVue
    optionsHabilit
    icon-update
    icon-delete
    :headers="headers"
    @update="openUpdate"
    :items="helper.items"
    permission-reference="permissions"
    
     require-two-factor financial-scope="admin.security">
    </TableComponentVue>
</template>

<script setup lang="ts">
import SearchInputComponentVue from '@/components/global/SearchInputComponent.vue';
import CrudComponent from '@/components/global/CrudComponent.vue';
import TableComponentVue from '@/components/global/TableComponent.vue';
import { helperStore } from '@/helper';
import type { Row } from '@/interfaces/FormComponent.helper';
import type { Permission } from '@/interfaces/Permission/Permission.model';
import type { Head } from '@/interfaces/TableComponent.helper';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import type { PermissionCreate } from '@/interfaces/Permission/PermissionCreate.dto'
import { ref } from 'vue'

const helper = helperStore()
helper.url = 'permissions'

helper.index()

const search = ref<string>('')
const getSearch = () => {
    helper.index({
        name: search.value
    })
}

const openUpdate = (item:Permission) => {
    clickIn.value = 'Edit'
    itemH.value = item
    const itemUpdate: PermissionCreate = {
        name: item.attributes.name
    }
    formCrud.value = itemUpdate
    openModalCrud.value = true;
}

const openModal = async () => {
    formCrud.value = {}
    clickIn.value = 'Create'
    openModalCrud.value = true;
}

const { t } = useI18n()
const {
    formCrud,
    openModalCrud,
    clickIn,
    formRef,
    item:itemH} = storeToRefs(helper)
const rows: Row[] = [
    {
        fields: [
            {
                label: 'Nombre',
                type: 'text',
                valueForm: 'name',
                rules: [(value: string) => Boolean(value?.trim()) || 'El nombre es obligatorio'],
            }
        ]
    }
]

const headers: Head[] = [
    {
        name: t('general-views.name'),
        value: 'attributes.name',
    },
    {
        name: t('views.permissions.guard_name'),
        value: 'attributes.guard_name',
    },
]


</script>

<style scoped>

</style>
