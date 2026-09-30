import type { BaseModel } from "../Base.model";
import type { Currency } from "../Currency/Currency.model";

export declare interface ExternalDeposit extends BaseModel<ExternalDepositAttributes,ExternalDepositRelationships>{}

export declare interface ExternalDepositRelationships {
    // payment?: any;
    currency: Currency;
    // referenceCurrency?: any;
    // localCurrency: Currency;
}

export declare interface ExternalDepositAttributes {
    currency_id: number;
    // amount_currency: string;
    received_amount: string;
    currency_price?: any;
    // payment_type_id?: any;
    // tranx_no?: any;
    // reference_currency_id?: any;
    // exchange_reference: number;
    total_exchange_reference: string;
    // local_currency_id: number;
    exchange_local?: string | number;
    total_exchange_local: string;
    // created_at: string;
    // updated_at: string;
    fec_pay?: string;
    // deleted_at?: any;
}
