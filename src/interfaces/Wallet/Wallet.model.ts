import type { BaseModel } from "../Base.model";
import type { Currency } from "../Currency/Currency.model";

export declare interface Wallet extends BaseModel<WalletAttributes,WalletRelationships>{}

export declare interface WalletAttributes {
    currency_id: number
    wallet_id?: string
    address?: string
    alias: string
    is_favorite?: boolean
}

export declare interface WalletRelationships {
    currency: Currency
}
