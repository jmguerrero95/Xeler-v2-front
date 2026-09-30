import type { BaseUpdate } from "../Base.model";
import type { TypeBankAccountAttributes } from "./TypeBankAccount.model";

export declare interface TypeBankAccountCreate extends TypeBankAccountAttributes{}

export declare interface TypeBankAccountUpdate extends TypeBankAccountAttributes, BaseUpdate{}