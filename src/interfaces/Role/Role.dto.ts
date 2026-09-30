import type { BaseUpdate } from "../Base.model";
import type { RoleAttributes } from "./Role.model";

export declare interface RoleCreate extends Omit<RoleAttributes, 'guard_name'>{
    permissions: number[]
}

export declare interface RoleUpdate extends BaseUpdate,RoleCreate{}