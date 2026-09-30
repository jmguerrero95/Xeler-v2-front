import type { BaseUpdate } from "../Base.model";
import type { MunicipalityAttributes } from "./Municipality.model";

export declare interface MunicipalityCreate extends MunicipalityAttributes{
    department_id?: number
}
export declare interface MunicipalityUpdate extends MunicipalityAttributes,BaseUpdate{}