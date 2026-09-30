<template>
    <div class="d-flex justify-space-between">
        <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
        <VBtn v-if="helper.canAction('create')" @click="openModal" prepend-icon="mdi-plus" class="rounded-xl">
            {{ $t('buttons.add') }}
        </VBtn>
    </div>

    <CrudComponent :singular="$t('views.faq.title')" :rows="rows"></CrudComponent>
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
import type { Faq } from '@/interfaces/Faq/Faq.model';
import type { FaqCreate } from '@/interfaces/Faq/Faq.dto';
import SearchInputComponentVue from '@/components/global/SearchInputComponent.vue';
import * as validator from '@/validator'
import { FaqStore } from '@/stores/FaqStore';
const helper = helperStore()
helper.url = 'faq'

helper.index()

const faqStore = FaqStore()
faqStore.getCategoriesFaq()
const { categoriesFaq } = storeToRefs(faqStore)

const search = ref<string>('')
const getSearch = () => {
    helper.index({
        name: search.value
    })
}
const openUpdate = (item:Faq) => {
    itemH.value = item
    const itemUpdate: FaqCreate = {
        title: item.attributes.title,
        body: item.attributes.body,
        category_faq_id: item.attributes.category_faq_id
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
                label: t('general-views.title'),
                type: 'text',
                valueForm: 'title',
                rules: [
                    validator.required
                ]
            },
            {
                label: t('general-views.body'),
                type: 'text',
                valueForm: 'body',
                rules: [
                    validator.required
                ]
            },
            {
                label: t('views.categories-faq.title'),
                type: 'select',
                valueForm: 'category_faq_id',
                select: {
                    items: categoriesFaq,
                    itemTitle: 'attributes.name',
                    itemValue: 'id'
                },
                rules: [
                    validator.required
                ]
            },
        ]
    }
]

const headers: Head[] = [
    {
        name: t('general-views.title'),
        value: 'attributes.title',
    },
    {
        name: t('general-views.body'),
        value: 'attributes.body',
    },

]


</script>

<style scoped>

</style>@/interfaces/PaymentMethod/TypeCompanyAccount.model@/interfaces/PaymentMethod/TypeCompanyAccount.dto
