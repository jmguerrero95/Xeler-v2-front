import type { BaseUpdate } from "../Base.model";
import type { PenaltyTypeAttributes } from "./PenaltyType.model";

export declare interface PenaltyTypeCreate extends PenaltyTypeAttributes {}

export declare interface PenaltyTypeUpdate extends PenaltyTypeAttributes, BaseUpdate {}