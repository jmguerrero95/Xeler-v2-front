<template>
    <div class="d-flex flex-column flex-sm-row mb-8 justify-space-between">
        <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
        <div>
            <VBtn v-if="helper.canAction('create')" @click="openModal" prepend-icon="mdi-plus" class="rounded-xl">
                {{ $t('buttons.add') }}
            </VBtn>
        </div>
    </div>

    <CrudComponent :singular="$t('views.countries.title')" :rows="rows"></CrudComponent>
    <!-- <h3>{{$t('views.countries.title',2)}}</h3> -->
    <TableComponentVue
    optionsHabilit
    icon-update
    icon-delete
    :headers="headers"
    @update="openUpdate"
    :items="helper.items"
    >
    </TableComponentVue>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CrudComponent from '@/components/global/CrudComponent.vue';
import TableComponentVue from '@/components/global/TableComponent.vue';
import { helperStore } from '@/helper';
import type { Row } from '@/interfaces/FormComponent.helper';
import type { Head } from '@/interfaces/TableComponent.helper';
import { storeToRefs} from 'pinia';
import { useI18n } from 'vue-i18n';
import type { Country } from '@/interfaces/Country/Country.model';
import type { CountryCreate } from '@/interfaces/Country/Country.dto';
import SearchInputComponentVue from '@/components/global/SearchInputComponent.vue';
import * as validator from '@/validator'
const helper = helperStore()
helper.url = 'countrys'
helper.initView()

helper.index()
const search = ref<string>('')
const getSearch = () => {
    helper.index({
        name: search.value
    })
}
const openUpdate = (item:Country) => {
    itemH.value = item
    const itemUpdate: CountryCreate = {
        code: item.attributes.code,
        name: item.attributes.name
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
    item:itemH} = storeToRefs(helper)
const rows: Row[] = [
    {
        fields: [
            {
                label: t('general-views.name'),
                type: 'text',
                valueForm: 'name',
                rules: [
                    validator.required
                ]
            },
            {
                label: t('general-views.code'),
                type: 'text',
                valueForm: 'code',
                rules: [
                    validator.required
                ]
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
        name: t('general-views.code'),
        value: 'attributes.code',
    },
    {
        name: 'Status',
        value: 'deleted_at',
        status: 'deleted'
    },

]


</script>

<style scoped>

</style>
