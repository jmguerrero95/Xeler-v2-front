<template>
    <div class="d-flex justify-space-between flex-column flex-sm-row mb-8">
        <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
        <div>
            <VBtn v-if="helper.canAction('create')" @click="openModal" prepend-icon="mdi-plus" class="rounded-xl">
                {{ $t("buttons.add") }}
            </VBtn>
        </div>
    </div>

    <CrudComponent
        :singular="$t('views.company-accounts.other.title')"
        :rows="rows"
     require-two-factor financial-scope="finance.financial_destination"></CrudComponent>
    <TableComponentVue
        optionsHabilit
        icon-update
        icon-delete
        :headers="headers"
        @update="openUpdate"
        :items="helper.items"
     require-two-factor financial-scope="finance.financial_destination">
    <template #cel-limit="{data}">
        {{ formatNumber((data as OtherAccount).attributes.limit ?? 0) }}
    </template>
    </TableComponentVue>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import CrudComponent from "@/components/global/CrudComponent.vue";
import TableComponentVue from "@/components/global/TableComponent.vue";
import { formatNumber, formatNumberStringToNumber, helperStore } from "@/helper";
import type { Row } from "@/interfaces/FormComponent.helper";
import type { Head } from "@/interfaces/TableComponent.helper";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import type { OtherAccount } from "@/interfaces/CompanyAccount/OtherAccount/OtherAccount.model";
import type { OtherAccountCreate } from "@/interfaces/CompanyAccount/OtherAccount/OtherAccount.dto";
import SearchInputComponentVue from "@/components/global/SearchInputComponent.vue";
import * as validator from "@/validator";
import { CompanyAccountStore } from "@/stores/CompanyAccountStore";
import { requirePaymentMethod } from "@/utils/paymentMethodSemantics";
import { OtherPaymentStore } from "@/stores/OtherPaymentStore";
import type { EventComponent } from "@/interfaces/Components.helper";


const helper = helperStore();
helper.url = "company/account";
helper.initView()

const search = ref<string>("");
const getSearch = () => {
    helper.index({
        name: search.value,
    });
};

const otherPaymentsStore = OtherPaymentStore();
otherPaymentsStore.getOtherPayments();
const { otherPayments } = storeToRefs(otherPaymentsStore);
const companyAccount = CompanyAccountStore();
const { banks, currencies, paymentMethods, typeBankAccounts } =
    storeToRefs(companyAccount);
onMounted(async () => {
    await Promise.all([companyAccount.getBanks(), companyAccount.getCurrencies(), companyAccount.getPaymentMethods(), companyAccount.getTypeBankAccounts()]);
    const other = requirePaymentMethod(paymentMethods.value, "other", message => helper.showNotify(message, { type: "error" }));
    helper.defaultParams.payment_type_id = other.id;
    helper.defaultParamsByCrud.payment_type_id = other.id;
    await helper.index();
});

const openUpdate = (item: OtherAccount) => {
    itemH.value = item;

    const itemUpdate: OtherAccountCreate = {
        sub_payment_type: item.attributes.sub_payment_type ?? "",
        account_number: item.attributes.account_number,
        beneficiary: item.attributes.beneficiary,
        currency_id: item.relationships?.currency?.id ?? 0,
        description: item.attributes.description,
        identification_document: item.attributes.identification_document,
        recommendation: item.attributes.recommendation,
        payment_type_id: item.attributes.payment_type_id,
        code_phone: item.attributes.code_phone,
        limit: formatNumber(item.attributes.limit ?? 0),
        phone: item.attributes.phone,
    };
    formCrud.value = itemUpdate;
    openModalCrud.value = true;
};

const openModal = async () => {
    itemH.value = {};
    formCrud.value = {};
    clickIn.value = "Create";
    openModalCrud.value = true;
};

const { t } = useI18n();
const {
    formCrud,
    openModalCrud,
    clickIn,
    formRef,
    item: itemH,
} = storeToRefs(helper);

const eventsXcop: EventComponent = {
    keypress: validator.keyPressOnlyNumberAndBackscape,
    keyup: (event: any) => {
        formCrud.value.limit = validator.amountFormat(event);
    },
};
const rows: Row[] = [
    {
        fields: [
            {
                label: "Tipo de Pago",
                valueForm: "sub_payment_type",
                rules: [validator.required],
                type: "select",
                select: {
                    items: otherPayments,
                    itemTitle: "attributes.name",
                    itemValue: "id",
                },
            },
            {
                label: t("views.currencies.title"),
                valueForm: "currency_id",
                rules: [validator.required],
                type: "select",
                select: {
                    items: currencies,
                    itemTitle: "attributes.name",
                    itemValue: "id",
                },
            },
            {
                label: t("views.company-accounts.bank.account-number"),
                valueForm: "account_number",
                rules: [validator.required],
                type: "number",
                hideSpinner: true,
            },
        ],
    },
    {
        fields: [
            {
                label: t("views.company-accounts.bank.beneficiary"),
                valueForm: "beneficiary",
                rules: [validator.required],
                type: "text",
            },
            {
                label: t("views.company-accounts.bank.identification-document"),
                valueForm: "identification_document",
                rules: [validator.required],
                type: "number",
                hideSpinner: true,
            },
            {
                label: t("views.users.phone"),
                valueForm: "phoneFormat",
                rules: [],
                type: "phone",
                phone: {
                    fieldCode: "code_phone",
                    fieldPhone: "phone",
                    fieldValid: "phoneIsValid",
                },
            },
        ],
    },
    {
        fields: [
            {
                label: t("views.company-accounts.bank.limit"),
                valueForm: "limit",
                colClass: ["v-col-12 v-col-sm-6"],
                rules: [validator.required],
                type: "text",
                events: eventsXcop,
                decode: formatNumberStringToNumber
            },
            {
                label: t("views.company-accounts.bank.recommendation"),
                colClass: ["v-col-12 v-col-sm-6"],
                valueForm: "recommendation",
                rules: [validator.required],
                type: "text",
            },
        ],
    },
    {
        fields: [
            {
                label: t("general-views.description"),
                valueForm: "description",
                rules: [validator.required],
                type: "text",
            },
        ],
    },
];

const headers: Head[] = [
    {
        name: t("views.currencies.title"),
        value: "relationships.currency.attributes.abbreviation",
    },
    {
        name: t("views.company-accounts.bank.beneficiary"),
        value: "attributes.beneficiary",
    },
    {
        name: t("views.company-accounts.bank.account-number"),
        value: "attributes.account_number",
    },
    {
        name: t("views.company-accounts.bank.limit"),
        value: "limit",
    },
];
</script>

<style scoped></style>
