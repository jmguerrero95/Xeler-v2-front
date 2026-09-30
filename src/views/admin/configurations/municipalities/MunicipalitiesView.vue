<template>
    <div class="d-flex justify-space-between flex-column flex-sm-row mb-8">
        <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
        <div>
            <VBtn v-if="helper.canAction('create')" @click="openModal" prepend-icon="mdi-plus" class="rounded-xl">
                {{ $t('buttons.add') }}
            </VBtn>
        </div>
    </div>

    <CrudComponent :singular="$t('views.municipalities.title')" :rows="rows"></CrudComponent>
    <!-- <h3>{{$t('views.municipalities.title',2)}}</h3> -->
    <TableComponentVue optionsHabilit icon-update icon-delete :headers="headers" @update="openUpdate" :items="helper.items">
    </TableComponentVue>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CrudComponent from '@/components/global/CrudComponent.vue';
import TableComponentVue from '@/components/global/TableComponent.vue';
import { helperStore } from '@/helper';
import type { Row } from '@/interfaces/FormComponent.helper';
import type { Head } from '@/interfaces/TableComponent.helper';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import type { Municipality } from '@/interfaces/Municipality/Municipality.model';
import type { MunicipalityCreate } from '@/interfaces/Municipality/Municipality.dto';
import { MunicipalityStore } from '@/stores/MunicipalityStore'
import SearchInputComponentVue from '@/components/global/SearchInputComponent.vue';
import * as validator from '@/validator'
const helper = helperStore()
helper.url = 'municipalitys'
helper.initView()

helper.index()

const search = ref<string>('')
const getSearch = () => {
    helper.index({
        name: search.value
    })
}
const municipalityStore = MunicipalityStore();
municipalityStore.getDepartaments()

const { departaments } = storeToRefs(municipalityStore)

const openUpdate = (item: Municipality) => {
    itemH.value = item
    const itemUpdate: MunicipalityCreate = {
        name: item.attributes.name,
        department_id: item.relationships?.department.id
    
    }
    formCrud.value = itemUpdate
    openModalCrud.value = true;
}

const openModal = async () => {
    itemH.value = {}
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
    item: itemH } = storeToRefs(helper)
const rows: Row[] = [
    {
        fields: [
            {
                label: t('general-views.name'),
                type: 'text',
                valueForm: 'name',
                rules: [
                    validator.required
                ],
                colClass: ['v-col-12 v-col-sm-6']
            },
            {
                label: t('views.departaments.title'),
                type: 'select',
                valueForm: 'department_id',
                rules: [
                    validator.required
                ],
                select: {
                    items: departaments,
                    itemTitle: 'attributes.name',
                    itemValue: 'id'
                }
            },
        ]
    }
]

const headers: Head[] = [
    {
        name: t('general-views.name'),
        value: 'attributes.name',
    },
    {
        name: t('views.departaments.title'),
        value: 'relationships.department.attributes.name',
    },

    {
        name: 'Status',
        value: 'deleted_at',
        status: 'deleted'
    },
]


</script>

<style scoped></style>
