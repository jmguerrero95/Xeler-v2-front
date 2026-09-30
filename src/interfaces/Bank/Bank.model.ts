import type { BaseModel, BaseModelSoftDelete } from "../Base.model";
import type { Country } from "../Country/Country.model";
import type { Image } from "../Image.model";

export declare interface Bank extends BaseModelSoftDelete<BankAttributes,BankRelationships> {}

export declare interface BankAttributes {
  name: string;
  country_id: number;
  description: string;
  status: boolean;
  color:string
}

export declare interface BankRelationships {
    country: Country
    images: Image[]
}