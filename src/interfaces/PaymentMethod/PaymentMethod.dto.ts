import type { BaseUpdate } from "../Base.model";
import type { PaymentMethodAttributes } from "./PaymentMethod.model";

export declare interface PaymentMethodCreate extends PaymentMethodAttributes{}
export declare interface PaymentMethodUpdate extends PaymentMethodAttributes, BaseUpdate{}