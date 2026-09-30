import type { BaseModel } from "../Base.model";
import type { Country } from "../Country/Country.model";
import type { Departament } from "../Departament/Departament.model";
import type { Municipality } from "../Municipality/Municipality.model";
import type { User } from "../User/User.model";

export declare interface Bussiness extends BaseModel<BussinessAttributes, BussinessRelationships> { }

interface BussinessRelationships {
    country: Country;
    user: User;
    municipalitie?: Municipality;
    department?: Departament;
    kyc?: BussinessKyc;
}

export declare interface BussinessAttributes {
    user_id: number;
    country_id: number;
    name: string;
    department_id?: number;
    municipalitie_id?: number;
    nic: string;
    code_phone?: number;
    phone: number;
    address?: string;
    verified: number;
}

export interface BussinessKyc extends BaseModel<BussinessKycAttributes,BussinessKycRelationships> {}

interface BussinessKycAttributes {
    company_id: number;
    shareholding_structure_status: StatusKycBussiness;
    chamber_commerce_certificate_status: StatusKycBussiness;
    rut_status: StatusKycBussiness;
    banking_certification_status: StatusKycBussiness;
    address_verification_status: StatusKycBussiness;
    status: StatusKycBussiness;
    
    // created_at: string;
    // updated_at: string;
    // deleted_at?: any;
    url_aws_shareholding_structure: string;
    url_aws_chamber_commerce_certificate: string;
    url_aws_rut: string;
    url_aws_banking_certification: string;
    url_aws_address_verification: string;
}

interface BussinessKycRelationships {
    company: Bussiness
}

export declare type StatusKycBussiness = 'en verificacion'