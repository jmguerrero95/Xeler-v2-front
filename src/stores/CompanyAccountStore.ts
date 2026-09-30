import { helperStore } from "@/helper";
import type { Bank } from "@/interfaces/Bank/Bank.model";
import type { Currency } from "@/interfaces/Currency/Currency.model";
import type { PaymentMethod } from "@/interfaces/PaymentMethod/PaymentMethod.model";
import type { TypeBankAccount } from "@/interfaces/TypeBankAccount/TypeBankAccount.model";
import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";

export const CompanyAccountStore = defineStore('CompanyAccounts', () => {
    const helper = helperStore()

    const banks = ref<Bank[]>([])
    const getBanks = async () => {
        const res = await helper.http('banks','get')
        banks.value = res.data.response as Bank[];
    }
    const paymentMethods = ref<PaymentMethod[]>([])
    const getPaymentMethods = async () => {
        const res = await helper.http('payment/types','get')
        paymentMethods.value = res.data.response as PaymentMethod[]
    }
    const flowPaymentMethods = ref<PaymentMethod[]>([])
    const getFlowPaymentMethods = async (params: {
        type: "buy" | "sale",
        currency_id: number | string,
        company_id?: number | null,
        include_unavailable?: boolean,
    }) => {
        const res = await helper.http('order/flow/payment-methods','get', {
            params: {
                type: params.type === "buy" ? "Compra" : "Venta",
                currency_id: params.currency_id,
                company_id: params.company_id ?? undefined,
                include_unavailable: params.include_unavailable ? 1 : undefined,
            },
        })
        flowPaymentMethods.value = res.data.response as PaymentMethod[]
    }

    const currencies = ref<Currency[]>([])
    const getCurrencies = async () => {
        const res = await helper.http('currency','get')
         currencies.value = (res.data.response as Currency[])
            .filter(c => 
            c.relationships
            && c.relationships.typeCurrency
            && c.relationships.typeCurrency.attributes.name === 'Fiat'
        );
    }

    const typeBankAccounts = ref<TypeBankAccount[]>([])
    const getTypeBankAccounts = async () => {
        const res = await helper.http('type/company/bank/accounts','get')
        typeBankAccounts.value = res.data.response as TypeBankAccount[]
    }
    return {
        banks,
        getBanks,
        currencies,
        getCurrencies,
        paymentMethods,
        getPaymentMethods,
        flowPaymentMethods,
        getFlowPaymentMethods,
        typeBankAccounts,
        getTypeBankAccounts,
    }
})
