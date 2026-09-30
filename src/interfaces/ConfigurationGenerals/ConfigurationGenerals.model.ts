import type { BaseModel } from "../Base.model";

export declare interface ConfigurationGenerals extends BaseModel<ConfigurationGeneralsAttributes, null> { }

export declare interface ConfigurationGeneralsAttributes {
    initial_time: string,
    confirmation_time: string,
    administrative_fee: string | number
    order_fee_limit: string | number
    min_withdrawal_xcop: string | number
    fee_withdrawal_xcop: string | number
}