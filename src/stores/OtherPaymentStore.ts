import { defineStore, storeToRefs } from "pinia";
import { CompanyAccountStore } from "./CompanyAccountStore";
import type { OtherPayment } from "@/interfaces/OtherPayment/OtherPayment.model";
import { ref } from "vue";
import { helperStore } from "@/helper";

export const OtherPaymentStore = defineStore('OtherPaymentStore', () => {
    const helper = helperStore()
    const companyAccount = CompanyAccountStore()
    const { paymentMethods } = storeToRefs(companyAccount)
    const { getPaymentMethods } = companyAccount

    const otherPayments = ref<OtherPayment[]>([])
    const getOtherPayments = (): Promise<Boolean> => {
        return new Promise<Boolean> (async (resolve, reject) => {
            try{
                const url = 'client/account/catalog/sub-payment-types'
                const res = await helper.http(url)
                otherPayments.value = res.data.response
                resolve(true)
            }catch(err){
                reject(false)
            }
        })
    }
    return{
        paymentMethods,
        getPaymentMethods,
        getOtherPayments,
        otherPayments
    }
})
