import type {BaseUpdate } from "@/interfaces/Base.model";
import type { OtherAccountAttributes,OtherAccountClientAttributes } from "./OtherAccount.model";

export declare interface OtherAccountCreate extends Omit<OtherAccountAttributes, 'limit'>{
    limit: string
}
export declare interface OtherAccountUpdate extends OtherAccountAttributes,BaseUpdate{}


export declare interface OtherAccountClientCreate extends OtherAccountClientAttributes{}
export declare interface OtherAccountClientUpdate extends OtherAccountClientAttributes,BaseUpdate{}