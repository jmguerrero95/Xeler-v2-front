import type { BaseModelSoftDelete } from "../Base.model";

export declare interface CurrencyType extends BaseModelSoftDelete<CurrencyTypeAttributes,null>{}

export declare interface CurrencyTypeAttributes {
    name:string
    description?:string
}