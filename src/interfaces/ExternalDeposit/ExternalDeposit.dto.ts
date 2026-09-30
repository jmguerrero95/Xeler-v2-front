import type { BaseModel, BaseUpdate } from "../Base.model";
import type { Currency } from "../Currency/Currency.model";
import type { ExternalDepositAttributes } from "./ExternalDeposit.model";

export declare interface ExternalDepositUpdate extends Omit<ExternalDepositAttributes,'total_exchange_local'>,BaseUpdate{
    total_exchange_local: string
}
export declare interface ExternalDepositCreate extends ExternalDepositAttributes{}
