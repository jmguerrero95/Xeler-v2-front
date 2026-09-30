import type { BaseModel } from "@/interfaces/Base.model";

export declare interface ActivityUser extends BaseModel<ActivityUserAttributes,null>{}

export declare interface ActivityUserAttributes {
    user_id: number,
    browser: string
    device: string
    ip: string
    city: string
    country: string
    isp: string
    token: string
}