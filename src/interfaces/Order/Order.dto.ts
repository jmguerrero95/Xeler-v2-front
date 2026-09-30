import type { OrderAttributes } from "./Order.model";

export declare interface OrderCreate extends OmitField {
    fiat_received: string
    quote_id?: string
}

type OmitField = Omit<OrderAttributes,
    | 'user_id'
    | 'tranx_no'
    | 'status_id'
    | 'processed_by'
    | 'account_delivery_type'
>

export declare interface OrderUploadVoucher {
    order_id: number
    vouchers: Blob[]
    name: string
}
