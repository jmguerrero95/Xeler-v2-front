import type {  BaseUpdate } from "@/interfaces/Base.model";
import type { BankAccountAttributes, BankAccountClientAttributes } from "./BankAccount.model";

export declare interface BankAccountCreate extends BankAccountAttributes{}
export declare interface BankAccountUpdate extends BankAccountAttributes, BaseUpdate{}

export declare interface BankAccountClientCreate extends BankAccountClientAttributes{}
export declare interface BankAccountClientUpdate extends BankAccountClientAttributes, BaseUpdate{}