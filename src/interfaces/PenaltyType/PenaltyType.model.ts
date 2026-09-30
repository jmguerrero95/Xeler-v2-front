import type { BaseModel } from "../Base.model";

export declare interface PenaltyType extends BaseModel<PenaltyTypeAttributes,null>{}

export declare interface PenaltyTypeAttributes {
    name:string
    code?: "buy" | "sell" | string
    time: number
}
