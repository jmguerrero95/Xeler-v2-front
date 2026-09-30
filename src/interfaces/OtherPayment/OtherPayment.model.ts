import type { BaseModel } from "../Base.model";
import type { Image } from "../Image.model";
import type { PaymentMethod } from "../PaymentMethod/PaymentMethod.model";

export declare interface OtherPayment extends BaseModel<OtherPaymentAttributes, OtherPaymentRelationships> { }

export declare interface OtherPaymentAttributes {
    name: string
    description: string
}
export declare interface OtherPaymentRelationships {
    payment: PaymentMethod
    images: Image[]
}