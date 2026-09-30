<template>
    <div class="d-flex justify-space-between flex-column flex-sm-row mb-8">
        <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
        <div>
            <VBtn v-if="helper.canAction('create')" @click="openModal" prepend-icon="mdi-plus" class="rounded-xl">
                {{ $t('buttons.add') }}
            </VBtn>
        </div>
    </div>

    <CrudComponent 
        :singular="$t('views.currencies.title')" 
        :rows="rowSelected"
        @click:post="postCurrency"
     require-two-factor financial-scope="finance.financial_configuration">
    </CrudComponent>
    <TableComponentVue
    optionsHabilit
    icon-update
    icon-delete
    :headers="headers"
    @update="openUpdate"
    :items="helper.items"
     require-two-factor financial-scope="finance.financial_configuration">
    <template #cel-attributes.name="{data}">
        <div class="d-flex gap-2">
            <div class="text-table text-left" style="width: 25px;">  
                <VImg inline class="mx-auto my-auto" v-if="itemHaveImages(currency(data).relationships?.images)" :src="(itemHaveImages(currency(data).relationships?.images) as string)" width="25" />
            </div>
            <div>
                {{ currency(data).attributes.name }}
            </div>
        </div>
    </template>
    </TableComponentVue>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CrudComponent from '@/components/global/CrudComponent.vue';
import TableComponentVue from '@/components/global/TableComponent.vue';
import { helperStore, itemHaveImages } from '@/helper';
import type { Row } from '@/interfaces/FormComponent.helper';
import type { Head } from '@/interfaces/TableComponent.helper';
import { storeToRefs} from 'pinia';
import { useI18n } from 'vue-i18n';
import type { Currency } from '@/interfaces/Currency/Currency.model';
import type { CurrencyCreate } from '@/interfaces/Currency/Currency.dto';
import SearchInputComponentVue from '@/components/global/SearchInputComponent.vue';
import * as validator from '@/validator'
import { CurrencyStore } from '@/stores/CurrencyStore';

const helper = helperStore()
helper.url = 'currency'
helper.initView()

helper.index()
const currencyStore = CurrencyStore()
currencyStore.getCurrencyTypes()
currencyStore.getPlatforms()
const currency  = (item:any): Currency => item as Currency

const { currencyTypes,platforms } = storeToRefs(currencyStore)
const search = ref<string>('')
const getSearch = () => {
    helper.index({
        name: search.value
    })
}
const openUpdate = (item:Currency) => {
    itemH.value = item
    const itemUpdate: CurrencyCreate = {
        name: item.attributes.name,
        abbreviation: item.attributes.abbreviation,
        symbol: item.attributes.symbol,
        type_currency_id: item.relationships?.typeCurrency?.id ??  '',
        reference_system_currency: !!item.attributes.reference_system_currency,
        wallet_default: !!item.attributes.wallet_default,
        sale: !!item.attributes.sale,
        buy: !!item.attributes.buy,
        icon: item.relationships?.images && item.relationships.images.length>0 ? item.relationships.images[0].attributes.aws_url ?? "" : "",
        color: item.attributes.color,
        min_buy: item.attributes.min_buy,
        min_sale: item.attributes.min_sale,
        platform_crypto_id: item.relationships?.platformCrypto?.id
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

const rowSelected = computed(()=> {
    const selectedType = currencyTypes.value.find(type => type.id === formCrud.value.type_currency_id)
    if(selectedType?.attributes.name.trim().toLowerCase() === 'fiat'){
        return rowsFiat
    }
    return rows
})
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
                label: t('views.currencies.abbreviation'),
                type: 'text',
                valueForm: 'abbreviation',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ]
            },
            {
                label: t('views.currencies.symbol'),
                type: 'text',
                valueForm: 'symbol',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ]
            },
            {
                label: t('views.currency-types.title'),
                type: 'select',
                valueForm: 'type_currency_id',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ],
                select: {
                    items: currencyTypes,
                    itemTitle: 'attributes.name',
                    itemValue: 'id'
                }
            },
            {
                label: t('views.platforms.title'),
                type: 'select',
                valueForm: 'platform_crypto_id',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ],
                select: {
                    items: platforms,
                    itemTitle: 'attributes.name',
                    itemValue: 'id'
                }
            }
        ]
    },
    {
        fields: [
            {
                label: t('views.currencies.buy'),
                type: 'switch',
                valueForm: 'buy',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [ ]
            },
            {
                label: t('views.currencies.sale'),
                type: 'switch',
                valueForm: 'sale',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: []
            },
            {
                label: t('views.currencies.reference'),
                type: 'switch',
                valueForm: 'reference_system_currency',
                rules: []
            },
            // {
            //     label: t('views.currencies.wallet-default'),
            //     type: 'switch',
            //     valueForm: 'wallet_default',
            //     rules: []
            // }
        ]
    },
    {
        fields: [
            {
                label: 'Mín. para venta (COP)',
                type: 'number',
                valueForm: 'min_sale',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ]
            },
            {
                label: 'Mín. para compra (COP)',
                type: 'number',
                valueForm: 'min_buy',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ]
            },
        ]
    },
    {
        fields: [
            {
                label: t('views.currencies.image'),
                type: 'image',
                valueForm: 'icon',
                rules: [ ],
                props: {
                    sizeImage: 100
                }
            },
            {
                label: t('general-views.color'),
                type: 'color',
                valueForm: 'color',
            },
        ]
    }
]

const rowsFiat: Row[] = [
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
                label: t('views.currencies.abbreviation'),
                type: 'text',
                valueForm: 'abbreviation',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ]
            },
            {
                label: t('views.currencies.symbol'),
                type: 'text',
                valueForm: 'symbol',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ]
            },
            {
                label: t('views.currency-types.title'),
                type: 'select',
                valueForm: 'type_currency_id',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ],
                select: {
                    items: currencyTypes,
                    itemTitle: 'attributes.name',
                    itemValue: 'id'
                }
            }
        ]
    },
    {
        fields: [
            {
                label: t('views.currencies.reference'),
                type: 'switch',
                valueForm: 'reference_system_currency',
                rules: []
            },
        ]
    },
    {
        fields: [
            {
                label: t('views.currencies.image'),
                type: 'image',
                valueForm: 'icon',
                rules: [ ],
                props: {
                    sizeImage: 100
                }
            },
            {
                label: t('general-views.color'),
                type: 'color',
                valueForm: 'color',
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
        name: t('views.currencies.abbreviation'),
        value: 'attributes.abbreviation',
    },
    {
        name: t('views.currencies.symbol'),
        value: 'attributes.symbol',
    },
    {
        name: 'Status',
        value: 'deleted_at',
        status: 'deleted'
    },
]

const postCurrency = async (item: CurrencyCreate) => {
    const data = new FormData()

    for(let key in formCrud.value){
        if(key == 'icon'){
            continue
        }
        data.append(key,formCrud.value[key])
    }
    const url = clickIn.value == 'Create' ? 'currency' : `currency/${itemH.value}`
    const method = clickIn.value == 'Create' ? 'post' : 'put'
    const res = clickIn.value == 'Edit' 
            ? await helper.put(itemH.value.id, data)
            : await helper.create(data)

    if (res === false) return
    formRef.value.reset()
    openModalCrud.value = false
    helper.index()
}
</script>

<style scoped>

</style>
