import type { BaseModel } from "../Base.model";
import type { Permission } from "../Permission/Permission.model";

export declare interface Role extends BaseModel<RoleAttributes, RoleRelationships> {}

export declare interface RoleAttributes {
    name: string;
    guard_name: string;
}

export declare interface RoleRelationships {
    permissions: Permission[];
}