import type { BaseModelSoftDelete } from "../Base.model";

export declare interface PaymentMethod extends BaseModelSoftDelete<PaymentMethodAttributes,null>{}

export declare interface PaymentMethodAttributes{
    name:string
    slug?: "bank" | "cash" | "other" | "breb" | "xcop" | string
    code?: "bank" | "cash" | "other" | "breb" | "xcop" | string
    description?:string
    available?: boolean
    disabled_reason?: string | null
    requires_company_account?: boolean
    requires_user_account?: boolean
    requires_shipping_type?: boolean
    requires_voucher?: boolean
    requires_bank?: boolean
    requires_account_number?: boolean
    requires_account_type?: boolean
    requires_document?: boolean
    requires_phone?: boolean
    requires_email?: boolean
    requires_proof?: boolean
    proof_not_required?: boolean
    instant_payment?: boolean
    capabilities?: Record<string, boolean>
    available_company_accounts_count?: number
    available_user_accounts_count?: number
    available_shipping_types_count?: number
    currency_id?: number | string | null
}
