import type { BaseModel } from "../Base.model";
import type { PenaltyType } from "../PenaltyType/PenaltyType.model";
import type { User } from "../User/User.model";

export declare interface Penalty extends BaseModel<PenaltyAttributes,PenaltyRelationships> { }

export declare interface PenaltyAttributes {
    user_id: number;
    type_penaltie_id: number;
    initial_time: string;
    end_time: string;
}

export declare interface PenaltyRelationships {
    user: User
    typePenalty: PenaltyType
}