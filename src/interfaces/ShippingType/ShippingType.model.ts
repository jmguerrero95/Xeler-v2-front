import type { BaseModel } from "../Base.model";
import type { PaymentMethod } from "../PaymentMethod/PaymentMethod.model";

export declare interface ShippingType extends BaseModel<ShippingTypeAttributes,ShippingTypeRelationships>{}

export declare interface ShippingTypeAttributes {
    name: number
    description?: string
    payment_type_id: number | ''
}

export declare interface ShippingTypeRelationships {
    payment: PaymentMethod
}