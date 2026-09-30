<template>
    <div class="d-flex justify-space-between flex-column flex-sm-row mb-8">
        <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
        <div>
            <VBtn v-if="helper.canAction('create')" @click="openModal" prepend-icon="mdi-plus" class="rounded-xl">
                {{ $t('buttons.add') }}
            </VBtn>
        </div>
    </div>

    <CrudComponent :singular="$t('views.company-accounts.efecty.title')" :rows="rows" require-two-factor financial-scope="finance.financial_destination"></CrudComponent>
    <TableComponentVue
    optionsHabilit
    icon-update
    icon-delete
    icon-show
    @show="openUpdate"
    :headers="headers"
    @update="openUpdate"
    :items="helper.items"
     require-two-factor financial-scope="finance.financial_destination">
    </TableComponentVue>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import CrudComponent from '@/components/global/CrudComponent.vue';
import TableComponentVue from '@/components/global/TableComponent.vue';
import { helperStore } from '@/helper';
import type { Row } from '@/interfaces/FormComponent.helper';
import type { Head } from '@/interfaces/TableComponent.helper';
import { storeToRefs} from 'pinia';
import { useI18n } from 'vue-i18n';
import type { EfectyAccount } from '@/interfaces/CompanyAccount/EfectyAccount/EfectyAccount.model';
import type { EfectyAccountCreate } from '@/interfaces/CompanyAccount/EfectyAccount/EfectyAccount.dto';
import SearchInputComponentVue from '@/components/global/SearchInputComponent.vue';
import * as validator from '@/validator'
import { CompanyAccountStore } from '@/stores/CompanyAccountStore';
import { requirePaymentMethod } from '@/utils/paymentMethodSemantics';
const helper = helperStore()
helper.url = 'company/account'
helper.initView()

const search = ref<string>('')
const getSearch = () => {
    helper.index({
        name: search.value
    })
}

const companyAccount = CompanyAccountStore()
const { banks,currencies,paymentMethods,typeBankAccounts } = storeToRefs(companyAccount)
onMounted(async () => {
    await Promise.all([companyAccount.getBanks(), companyAccount.getCurrencies(), companyAccount.getPaymentMethods(), companyAccount.getTypeBankAccounts()])
    const cash = requirePaymentMethod(paymentMethods.value, 'cash', message => helper.showNotify(message, { type: 'error' }))
    helper.defaultParams.payment_type_id = cash.id
    helper.defaultParamsByCrud.payment_type_id = cash.id
    await helper.index()
})

const openUpdate = (item:EfectyAccount) => {
    itemH.value = item
    const itemUpdate: EfectyAccountCreate = {
        account_number: item.attributes.account_number,
        limit: item.attributes.limit,
        beneficiary: item.attributes.beneficiary,
        currency_id: item.relationships!.currency.id,
        description: item.attributes.description,
        identification_document: item.attributes.identification_document,
        link: item.attributes.link,
        recommendation: item.attributes.recommendation,
        payment_type_id: item.attributes.payment_type_id,
        coordinate: item.attributes.coordinate,
        location: item.attributes.location
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
                label: t('views.currencies.title'),
                valueForm: 'currency_id',
                rules: [
                    validator.required
                ],
                type: 'select',
                select: {
                    items: currencies,
                    itemTitle: 'attributes.name',
                    itemValue: 'id',
                },
                
            },
            {
                label: t('views.company-accounts.bank.limit'),
                valueForm: 'limit',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ],
                type: 'number',
                
            },
        ]
    },
    {
        fields: [
            {
                label: t('views.company-accounts.bank.account-number'),
                valueForm: 'account_number',
                rules: [
                    validator.required
                ],
                type: "number",
                hideSpinner: true,
            },
            {
                label: t('views.company-accounts.bank.beneficiary'),
                valueForm: 'beneficiary',
                rules: [
                    validator.required
                ],
                type: 'text',
            },
            {
                label: t('views.company-accounts.bank.identification-document'),
                valueForm: 'identification_document',
                rules: [
                    validator.required
                ],
                type: "number",
                hideSpinner: true,
            }
        ]
    },
    {
        fields: [
            {
                label: t('views.company-accounts.efecty.location'),
                valueForm: 'location',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ],
                type: 'text',
            },
            {
                label: t('views.company-accounts.bank.coordinate'),
                colClass: ['v-col-12 v-col-sm-6'],
                valueForm: 'coordinate',
                rules: [
                ],
                type: 'text',
            }
        ]
    },
    {
        fields: [
            {
                label: t('views.company-accounts.efecty.link'),
                valueForm: 'link',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ],
                type: 'text',
            },
            {
                label: t('views.company-accounts.bank.recommendation'),
                valueForm: 'recommendation',
                colClass: ['v-col-12 v-col-sm-6'],
                rules: [
                    validator.required
                ],
                type: 'text',
            }
        ]
    },
    {
        fields: [
            {
                label: t('general-views.description'),
                valueForm: 'description',
                rules: [
                    validator.required
                ],
                type: 'text',
            }
        ]
    }
]

const headers: Head[] = [
    {
        name: t('views.currencies.title'),
        value: 'relationships.currency.attributes.abbreviation',
    },
    {
        name: t('views.company-accounts.bank.beneficiary'),
        value: 'attributes.beneficiary',
    },
    {
        name: t('views.company-accounts.bank.account-number'),
        value: 'attributes.account_number',
    },
    {
        name: t('views.company-accounts.bank.limit'),
        value: 'attributes.limit',
    },
]


</script>

<style scoped>

</style>
