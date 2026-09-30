<template>
    <div class="d-flex justify-space-between">
        <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
    </div>

    <CrudComponent :singular="$t('views.penalties-types.title')" :rows="rows">

    </CrudComponent>
    <TableComponentVue
    optionsHabilit
    icon-update
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
import type { PenaltyType } from '@/interfaces/PenaltyType/PenaltyType.model';
import type { PenaltyTypeCreate } from '@/interfaces/PenaltyType/PenaltyType.dto';
import SearchInputComponentVue from '@/components/global/SearchInputComponent.vue';
import * as validator from '@/validator'
const helper = helperStore()
helper.url = 'type/penalties'
helper.initView()

helper.index()

const search = ref<string>('')
const getSearch = () => {
    helper.index({
        name: search.value
    })
}
const openUpdate = (item: PenaltyType) => {
    itemH.value = item
    const itemUpdate: PenaltyTypeCreate = {
        name: item.attributes.name,
        time: item.attributes.time
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
                ],
                props: {
                    disabled: true
                }
            },
            {
                label: t('general-views.time'),
                type: 'number',
                colClass: ['v-col-12 v-col-sm-6'],
                valueForm: 'time',
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
        name: t('general-views.time'),
        value: 'attributes.time',
    },
]


</script>

<style scoped>

</style>