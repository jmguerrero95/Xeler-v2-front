import { OrderTypes } from "@/enums/OrderTypes.enum";
import { helperStore } from "@/helper";
import type { Currency } from "@/interfaces/Currency/Currency.model";
import type { Order } from "@/interfaces/Order/Order.model";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";
import { buildCryptoQrValue } from "@/utils/crypto";
import { defineStore } from "pinia";
import { ref } from "vue";

export const TransactionStore = defineStore('Transaction', () => {
    const helper = helperStore()
    const order = ref<Order | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const lastFetchedAt = ref<string | null>(null)

    const getMyOrderByTransaction = (
        tranx_no: string,
        options: { silent?: boolean } = {},
    ): Promise<Order | false> => {
        return new Promise(async (resolve, reject) => {
            if (!options.silent) {
                order.value = null
                loading.value = true
                error.value = null
            }
            try {
                const res = await helper.http('order/my/' + tranx_no, 'get', {}, '', Boolean(options.silent))
                order.value = res.data.response
                if (!options.silent) loading.value = false
                lastFetchedAt.value = new Date().toISOString()
                resolve(res.data.response)
            } catch (err) {
                if (!options.silent) {
                    order.value = null
                    loading.value = false
                    error.value = 'No fue posible cargar la orden.'
                }
                reject(false)
            }
        })
    }

    const getAdminOrderByTransaction = (
        tranx_no: string,
        options: { silent?: boolean } = {},
    ): Promise<Order | false> => {
        return new Promise(async (resolve, reject) => {
            if (!options.silent) {
                order.value = null
                loading.value = true
                error.value = null
            }
            try {
                const res = await helper.http('admin/orders/by-transaction/' + tranx_no, 'get', {}, '', Boolean(options.silent))
                order.value = res.data.response
                if (!options.silent) loading.value = false
                lastFetchedAt.value = new Date().toISOString()
                resolve(res.data.response)
            } catch (err) {
                if (!options.silent) {
                    order.value = null
                    loading.value = false
                    error.value = 'No fue posible cargar la orden.'
                }
                reject(false)
            }
        })
    }

    const showPreviewOrder = ref(false)
    const feeMiner = ref('')
    const feeAdministrative = ref('3000')

    const takeOrder = (order_id: number): Promise<boolean> => {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                const url = 'order/take/accept'
                const data = { order_id }
                const scope = `order-take-${order_id}`
                const res = await helper.http(url, 'post', { data }, "", false, {
                    idempotent: true,
                    idempotencyKey: createOperationKey(scope, data),
                    financialAction: true,
                })
                clearOperationKey(scope)
                resolve(true)
            } catch (e) {
                reject(false)
            }

        })
    }

    const releaseOrder = (order_id: number): Promise<boolean> => {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                const url = 'order/' + order_id + '/release'
                const scope = `order-release-${order_id}`
                const res = await helper.http(url, 'post', {}, "", false, {
                    idempotent: true,
                    idempotencyKey: createOperationKey(scope, { order_id }),
                    financialAction: true,
                })
                clearOperationKey(scope)
                resolve(true)
            } catch (e) {
                reject(false)
            }

        })
    }


    const getDataForQr = (money_name: string, address_send: string, amount: number | string) => {
        return buildCryptoQrValue({
            address: address_send,
            currency: money_name,
        }, amount)
    }

    const currencyUsed = ref<Currency>()
    const typeOrder = ref<OrderTypes>()
    const orderHaveFees = (received_amount:number):boolean => {
        const type = typeOrder.value == OrderTypes.COMPRA ? 'min_buy' : 'min_sale'
        const amountFees = currencyUsed.value?.attributes[type] as number
        const amountCopOrder = received_amount
        return amountFees! > amountCopOrder!
    }
    return {
        typeOrder,
        currencyUsed,
        order,
        loading,
        error,
        lastFetchedAt,
        getMyOrderByTransaction,
        getAdminOrderByTransaction,
        showPreviewOrder,
        feeMiner,
        feeAdministrative,
        takeOrder,
        releaseOrder,
        getDataForQr,
        orderHaveFees,
    }
})
