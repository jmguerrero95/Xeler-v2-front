import type { BaseModel, BaseModelSoftDelete } from "@/interfaces/Base.model";
import type { Currency } from "@/interfaces/Currency/Currency.model";
import type { PaymentMethod } from "@/interfaces/PaymentMethod/PaymentMethod.model";

export interface SubPaymentType
  extends BaseModelSoftDelete<SubPaymentTypeAttributes, SubPaymentTypeRelationships | null> {}

export interface SubPaymentTypeAttributes {
  name: string;
  description?: string;
  payment_type_id: number;
}

export interface SubPaymentTypeRelationships {
  payment?: PaymentMethod | null;
}

export interface OtherAccount
  extends BaseModel<OtherAccountAttributes, OtherAccountRelationships> {}

export interface OtherAccountAttributes {
  currency_id: number;
  payment_type_id: number;
  sub_payment_type?: number | string | null;
  limit?: number | null;
  account_number?: string | null;
  identification_document?: string | null;
  beneficiary?: string | null;
  description?: string | null;
  phone?: string | null;
  code_phone?: string | null;
  recommendation?: string | null;
}

export interface OtherAccountRelationships {
  currency?: Currency | null;
  paymentType?: PaymentMethod | null;
  typePayment?: PaymentMethod | null;
  typeSubPayment?: SubPaymentType | null;
}

export interface OtherAccountClient
  extends BaseModel<OtherAccountClientAttributes, OtherAccountClientRelationships> {}

export interface OtherAccountClientAttributes {
  sub_payment_type?: number | string | null;
  currency_id: number;
  payment_type_id: number;
  account_number?: string | null;
  identification_document?: string | null;
  beneficiary?: string | null;
  phone?: string | null;
  code_phone?: string | null;
  is_favorite?: boolean;
}

export interface OtherAccountClientRelationships {
  currency?: Currency | null;
  paymentType?: PaymentMethod | null;
  typePayment?: PaymentMethod | null;
  typeSubPayment?: SubPaymentType | null;
  bank?: null;
}
