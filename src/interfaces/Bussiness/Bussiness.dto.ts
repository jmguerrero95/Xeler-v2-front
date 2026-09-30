import type { BaseUpdate } from "../Base.model";
import type { BussinessAttributes } from "./Bussiness.model";

export declare interface BussinessCreate extends OmitFieldsCreate {
    shareholding_structure: Blob
    chamber_commerce_certificate: Blob
    rut: Blob
    banking_certification: Blob
    address_verification: Blob
}

type OmitFieldsCreate = Omit<BussinessAttributes, 'user_id'>

export declare interface BussinessUpdate extends OmitFieldsCreate,BaseUpdate{
    shareholding_structure: string | Blob
    chamber_commerce_certificate: string | Blob
    rut: string | Blob
    banking_certification: string | Blob
    address_verification: string | Blob
}