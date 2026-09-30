import { defineStore, storeToRefs } from 'pinia'
import { CompanyAccountStore } from './CompanyAccountStore'
export const ExternalDeposit = defineStore('external-deposit',() => {
    const companyAccount = CompanyAccountStore()
    const { currencies } = storeToRefs(companyAccount)
    const { getCurrencies } = companyAccount
    
    return {
        currencies,
        getCurrencies
    }
})