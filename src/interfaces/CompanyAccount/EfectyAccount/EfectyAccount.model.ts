import type { BaseModel } from "@/interfaces/Base.model";
import type { Currency } from "@/interfaces/Currency/Currency.model";
import type { PaymentMethod } from "@/interfaces/PaymentMethod/PaymentMethod.model";

export declare interface EfectyAccount extends BaseModel<EfectyAccountAttributes,EfectyAccountRelationships>{}

export declare interface EfectyAccountAttributes {
    currency_id: number
    payment_type_id: number
    account_number:string
    identification_document:string
    beneficiary:string
    description:string
    location:string
    location_name?:string
    link:string
    recommendation:string
    coordinate:string
    limit: number
}

export declare interface EfectyAccountRelationships {
    currency: Currency
    paymentType: PaymentMethod
}
