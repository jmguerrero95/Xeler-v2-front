import type { BaseModel } from "../Base.model";

export declare interface Country extends BaseModel<CountryAttributes,null>{}

export declare interface CountryAttributes {
    name:string
    code:string
}