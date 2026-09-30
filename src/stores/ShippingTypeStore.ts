import { defineStore, storeToRefs } from "pinia";
import { CompanyAccountStore } from "./CompanyAccountStore";

export const ShippingTypeStore = defineStore('shippingType', () => {
    const companyAccount = CompanyAccountStore()
    const { paymentMethods } = storeToRefs(companyAccount)
    const { getPaymentMethods } = companyAccount
    return {
        getPaymentMethods,
        paymentMethods
    }
})