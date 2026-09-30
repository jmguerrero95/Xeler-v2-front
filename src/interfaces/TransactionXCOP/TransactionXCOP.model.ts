import type { BaseModel } from "../Base.model";
import type { User } from "../User/User.model";

export declare interface TransactionXCOP extends BaseModel<TransactionXCOPAttributes, TransactionXCOPRelationships> { }

export declare interface TransactionXCOPAttributes {
    user_receipt: number | ''
    user_send: number | ''
    quantity: string
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export declare interface TransactionXCOPRelationships {
    userSend: User
    userReceipt: User
}

export declare interface WithdrawalXCOP extends BaseModel<WithdrawalXCOPAttributes,WithdrawalXCOPRelationships>{}

export declare interface WithdrawalXCOPRelationships {
    user: User;
    wallet?: any;
    account?: any;
}

export declare interface WithdrawalXCOPAttributes {
    public_reference: string;
    destination_type: "bank_account" | "polygon" | "legacy_crypto";
    destination: Record<string, string | null>;
    amount: string;
    total_debit: string;
    status: string;
    fee: string;
    can_cancel: boolean;
    version: number;
    requested_at?: string | null;
    processing_started_at?: string | null;
    completed_at?: string | null;
    processing_reference?: string | null;
    txid?: string | null;
    review_reason?: string | null;
    proofs?: Array<{
        id: number;
        original_name: string;
        mime_type: string;
        size: number;
        created_at: string;
    }>;
    created_at: string;
    updated_at: string;
}
