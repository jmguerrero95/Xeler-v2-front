import type { BaseModelSoftDelete } from "../Base.model";

export declare interface Platform extends BaseModelSoftDelete<PlatformAttributes,PlatformRelationships>{}

export declare interface PlatformAttributes {
    name:string
    description?:string
}

export declare interface PlatformRelationships {}