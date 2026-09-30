<template>
    <div class="d-flex justify-space-between flex-column flex-sm-row mb-8" >
        <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
        <div>
            <VBtn
                v-if="helper.canAction('create')"
                @click="openModal"
                prepend-icon="mdi-plus"
                class="rounded-xl"
                >
                {{$t('buttons.add')}}
            </VBtn>
        </div>
    </div>
    
    <CrudComponent :singular="$t('views.type_documents.title')" :rows="rows"></CrudComponent>
    <!-- <h3>{{$t('views.type_documents.title',2)}}</h3> -->
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
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import type { TypeDocument } from '@/interfaces/TypeDocument/TypeDocument.model';
import type { TypeDocumentCreate } from '@/interfaces/TypeDocument/TypeDocument.dto';
import SearchInputComponentVue from '@/components/global/SearchInputComponent.vue';
import * as validator from '@/validator'
const helper = helperStore()
helper.url = 'type/documents'
helper.initView()

helper.index()

const search = ref<string>('')
const getSearch = () => {
    helper.index({
        type_document: search.value
    })
}
const openUpdate = (item:TypeDocument) => {
    itemH.value = item
    const itemUpdate: TypeDocumentCreate = {
        type_document: item.attributes.type_document
    }
    formCrud.value = itemUpdate
    openModalCrud.value = true;
}

const openModal = async () => {
    itemH.value = false
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
                valueForm: 'type_document',
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
        value: 'attributes.type_document',
    },

    {
        name: 'Status',
        value: 'deleted_at',
        status: 'deleted'
    },
]


</script>

<style scoped>
.custom-text-field .v-input__control {
  border-radius: 50px;
}
</style>
