import type { BaseUpdate } from "../Base.model";
import type { BankAttributes } from "./Bank.model";

export declare interface BankCreate extends OmitFields{
    icon: string | Blob
}
export declare interface BankUpdate extends OmitFields,BaseUpdate{
    icon: string | Blob
}

type OmitFields = Omit<BankAttributes, 'icon'>