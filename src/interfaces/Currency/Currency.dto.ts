import type { BaseUpdate } from "../Base.model";
import type { CurrencyAttributes } from "./Currency.model";

export declare interface CurrencyCreate extends OmitsField{
    type_currency_id: '' | number
    icon: string | Blob
}

export declare interface CurrencyUpdate extends OmitsField, BaseUpdate{
    type_currency_id: '' | number
    icon: Blob | string
}

type OmitsField = Omit<CurrencyAttributes, 'icon'>