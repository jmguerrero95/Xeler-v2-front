import type { OtherPaymentAttributes } from "./OtherPayment.model";

export declare interface OtherPaymentCreate extends OtherPaymentAttributes {
    payment_type_id: '' | number
    file: Blob
}

export declare interface OtherPaymentUpdate extends OtherPaymentAttributes {
    payment_type_id: '' | number
    file: Blob | string
}