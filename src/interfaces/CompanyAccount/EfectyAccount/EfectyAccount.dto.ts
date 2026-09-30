import type { BaseUpdate } from "@/interfaces/Base.model";
import type { EfectyAccountAttributes } from "./EfectyAccount.model";

export declare interface EfectyAccountCreate extends EfectyAccountAttributes{}
export declare interface EfectyAccountUpdate extends EfectyAccountAttributes, BaseUpdate{}