import type { BaseModelSoftDelete } from "../Base.model";
import type { Country } from "../Country/Country.model";
import type { Departament } from "../Departament/Departament.model";
import type { Municipality } from "../Municipality/Municipality.model";
import type { Penalty } from "../Penalty/Penalty.model";
import type { Role } from "../Role/Role.model";
import type { TypeDocument } from "../TypeDocument/TypeDocument.model";
import type { ActivityUser } from "./Activities/Activity.model";
import type { Kyc } from "./Kyc/Kyc.model";

export declare interface User extends BaseModelSoftDelete<UserAttributes,Relationships> {}
export interface UserAttributes {
  first_name: string;
  second_name?: any;
  last_name?: any;
  second_last_name?: any;
  email: string;
  email_verified_at?: Date;
  second_password?: any;
  code_phone?: any;
  phone?: any;
  phone_verified_at?: Date;
  confirmation_code_phone?: any;
  confirmation_code_email?: any;
  username: string;
  referred_by?: any;
  affiliate_id?: any;
  xcop:  number
  google_authentication: boolean
  order_system?: boolean
}

interface Relationships {
  roles: Role[];
  userDetail: UserDetail
  kyc: Kyc
  last_connection: ActivityUser
  penaltyNow: Penalty[]
  referred: User
  referrals: User[]
}

interface UserDetail extends BaseModelSoftDelete<UserDetailAttributes,UserDetailRelationships>{}
interface UserDetailRelationships {
  country: Country;
  nationality: Country;
  typeDocument: TypeDocument;
  municipalitie: Municipality;
  department: Departament;
}
interface UserDetailAttributes {
  user_id: number;
  country_id: number;
  type_documents_id: number;
  nationality_id: number;
  department_id: number;
  municipalitie_id: number;
  document: string;
  address: string;
  birth: string;
  xcop?: string;
}

// --------------------
export interface SendNotification {
    type: TypeNotification
    message: string
}

export enum TypeNotification {
  SMS= 'sms',
  EMAIL= 'email',
  ALL= 'all'
}