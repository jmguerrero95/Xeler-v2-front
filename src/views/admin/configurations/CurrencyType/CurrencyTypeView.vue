<template>
    <div class="d-flex justify-space-between flex-column flex-sm-row mb-8">
        <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
        <div>
            <VBtn v-if="helper.canAction('create')" @click="openModal" prepend-icon="mdi-plus" class="rounded-xl">
                {{ $t('buttons.add') }}
            </VBtn>
        </div>
    </div>

    <CrudComponent :singular="$t('views.currency-types.title')" :rows="rows" require-two-factor financial-scope="finance.financial_configuration"></CrudComponent>
    <TableComponentVue
    optionsHabilit
    icon-update
    icon-delete
    :headers="headers"
    @update="openUpdate"
    :items="helper.items"
     require-two-factor financial-scope="finance.financial_configuration">
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
import type { CurrencyType } from '@/interfaces/CurrencyType/CurrencyType.model';
import type { CurrencyTypeCreate } from '@/interfaces/CurrencyType/CurrencyType.dto';
import SearchInputComponentVue from '@/components/global/SearchInputComponent.vue';
import * as validator from '@/validator'
import { CurrencyStore } from '@/stores/CurrencyStore';
const helper = helperStore()
helper.url = 'type/currency'
helper.initView()

helper.index()

const search = ref<string>('')
const getSearch = () => {
    helper.index({
        name: search.value
    })
}
const openUpdate = (item:CurrencyType) => {
    itemH.value = item
    const itemUpdate: CurrencyTypeCreate = {
        name: item.attributes.name,
        description: item.attributes.description
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
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ]
            },
            {
                label: t('general-views.description'),
                type: 'text',
                valueForm: 'description',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: []
            },
        ]
    },
]

const headers: Head[] = [
    {
        name: t('general-views.name'),
        value: 'attributes.name',
    },
    {
        name: t('general-views.description'),
        value: 'attributes.description',
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
