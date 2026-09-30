<template>
    <div class="d-flex justify-space-between">
        <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
        <VBtn v-if="helper.canAction('create')" @click="openModal" prepend-icon="mdi-plus" class="rounded-xl">
            {{ $t('buttons.add') }}
        </VBtn>
    </div>

    <CrudComponent :singular="$t('views.categories-faq.title')" :rows="rows"></CrudComponent>
    <TableComponentVue
    optionsHabilit
    icon-update
    icon-delete
    :headers="headers"
    @update="openUpdate"
    :items="helper.items"
    >
    <template #cel-attributes.username="{data}">
        <span class="text-primary"> 
            {{ data.attributes.username }}
        </span>
    </template>
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
import type { CategoryFaq } from '@/interfaces/Faq/CategoryFaq/CategoryFaq.model';
import type { CategoryFaqCreate } from '@/interfaces/Faq/CategoryFaq/CategoryFaq.dto';
import SearchInputComponentVue from '@/components/global/SearchInputComponent.vue';
import * as validator from '@/validator'
const helper = helperStore()
helper.url = 'category/faq'

helper.index()
const search = ref<string>('')
const getSearch = () => {
    helper.index({
        name: search.value
    })
}
const openUpdate = (item:CategoryFaq) => {
    itemH.value = item
    const itemUpdate: CategoryFaqCreate = {
        name: item.attributes.name,
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
        ]
    }
]

const headers: Head[] = [
    {
        name: t('general-views.name'),
        value: 'attributes.name',
    },

]


</script>

<style scoped>

</style>@/interfaces/PaymentMethod/TypeCompanyAccount.model@/interfaces/PaymentMethod/TypeCompanyAccount.dto
