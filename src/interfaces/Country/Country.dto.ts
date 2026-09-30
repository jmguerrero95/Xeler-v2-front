import type { BaseUpdate } from "../Base.model";
import type { CountryAttributes } from "./Country.model";

export declare interface CountryCreate extends CountryAttributes{}
export declare interface CountryUpdate extends CountryAttributes,BaseUpdate{}