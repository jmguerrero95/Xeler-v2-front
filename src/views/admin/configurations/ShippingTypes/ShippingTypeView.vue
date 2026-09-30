<template>
    <div class="d-flex justify-space-between flex-column flex-sm-row mb-8">
        <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
        <div>
            <VBtn v-if="helper.canAction('create')" @click="openModal" prepend-icon="mdi-plus" class="rounded-xl">
                {{ $t('buttons.add') }}
            </VBtn>
        </div>
    </div>

    <CrudComponent :singular="$t('views.shipping-types.title')" :rows="rows"></CrudComponent>
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
import SearchInputComponentVue from '@/components/global/SearchInputComponent.vue';
import * as validator from '@/validator'
import type { ShippingType } from '@/interfaces/ShippingType/ShippingType.model';
import type { ShippingTypeCreate } from '@/interfaces/ShippingType/ShippingType.dto';
import { ShippingTypeStore } from '@/stores/ShippingTypeStore';
const helper = helperStore()
helper.url = 'shipping/types'
helper.initView()

helper.index()

const shippingTypeStore = ShippingTypeStore()
const { paymentMethods } = storeToRefs(shippingTypeStore)
shippingTypeStore.getPaymentMethods()

const search = ref<string>('')
const getSearch = () => {
    helper.index({
        name: search.value
    })
}
const openUpdate = (item:ShippingType) => {
    itemH.value = item
    const itemUpdate: ShippingTypeCreate = {
        name: item.attributes.name,
        description: item.attributes.description,
        payment_type_id: item.relationships?.payment.id ?? ''
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
            },
            {
                label: t('general-views.description'),
                type: 'text',
                valueForm: 'description',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                ]
            },
            {
                label: t('views.type-company-account.title'),
                type: 'select',
                valueForm: 'payment_type_id',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ],
                select: {
                    items: paymentMethods,
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
        name: t('general-views.description'),
        value: 'attributes.description',
    },
    {
        name: t('views.type-company-account.title'),
        value: 'relationships.payment.attributes.name',
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
