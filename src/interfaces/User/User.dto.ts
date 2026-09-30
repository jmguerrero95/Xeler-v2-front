import type { UserAttributes } from "./User.model"

export declare interface Profile extends Omit<Required<UserAttributes>,OmitFields>{
    nationality_id: '' | number
    country_id: '' | number
    department_id: '' | number
    municipalitie_id: '' | number
    type_documents_id: '' | number
    address: string
    birth: string
    document: string
}

type OmitFields = 'affiliate_id'
| 'referred_by'
| 'phone_verified_at'
| 'confirmation_code_phone'
| 'confirmation_code_email'
| 'email_verified_at'
| 'second_password'
| 'xcop'
| 'google_authentication'
| 'order_system'