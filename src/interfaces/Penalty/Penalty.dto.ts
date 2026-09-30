import type { PenaltyAttributes } from "./Penalty.model";

export declare interface PenaltyCreate extends Pick<PenaltyAttributes,'type_penaltie_id'>{
    user_id?: number | ''
}