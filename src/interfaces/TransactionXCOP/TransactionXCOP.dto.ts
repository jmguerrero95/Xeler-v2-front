import type { TransactionXCOPAttributes } from "./TransactionXCOP.model"

export declare interface TransactionXCOPCreate  {
    amount: string
    recipient_reference: string
    note?: string
}

// type pickCreate = 'user_receipt_id'
// type create = Pick<TransactionXCOPAttributes,pickCreate>
