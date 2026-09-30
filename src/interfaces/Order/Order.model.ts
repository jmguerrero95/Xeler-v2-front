import type { OrderTypes } from "@/enums/OrderTypes.enum";
import type { BaseModel, BaseModelSoftDelete } from "../Base.model";
import type { BankAccount } from "../CompanyAccount/BankAccount/BankAccount.model";
import type { EfectyAccount } from "../CompanyAccount/EfectyAccount/EfectyAccount.model";
import type { OtherAccount } from "../CompanyAccount/OtherAccount/OtherAccount.model";
import type { Currency } from "../Currency/Currency.model";
import type { Image } from "../Image.model";
import type { NetworkType } from "../NetworkType/NetworkType.model";
import type { PaymentMethod } from "../PaymentMethod/PaymentMethod.model";
import type { ShippingType } from "../ShippingType/ShippingType.model";
import type { User } from "../User/User.model";
import type { CryptoAddress, CryptoInfo, CryptoTransaction } from "../Crypto/Crypto.model";

export type Order = BaseModelSoftDelete<OrderAttributes, OrderRelationships>;

export declare interface OrderAttributes {
        wallet_id?: number | ''
        quote_id?: string
        currency_id: number | ''
        payment_type_id: number | ''
        shipping_type_id: number | ''
        account_delivery_id: number | ''
        type: OrderTypes
        red_id: number | ''
        amount_currency: string
        received_amount: string
        fee: string
        fee_mining_cop?: string
        currency_price: string
        exchange_reference: string
        total_exchange_reference: string
        exchange_local: string
        total_exchange_local: string
        grades?: string
        address_send?: string
        estimated_time?: string,
        user_id: number;
        tranx_no: string;
        status_id: number;
        status_name?: string | null;
        final_crypto_received_amount?: string | null;
        txid?: string | null;
        decimal_scale?: number | null;
        network?: string | null;
        provider?: string | null;
        payout_amount?: string | null;
        expected_deposit_amount?: string | null;
        detected_crypto_amount?: string | null;
        confirmed_crypto_amount?: string | null;
        pending_crypto_amount?: string | null;
        variance_type?: "exact" | "within_tolerance" | "underpaid" | "overpaid" | string | null;
        variance_message?: string | null;
        variance_amount?: string | null;
        variance_percentage?: string | null;
        final_fiat_payout?: string | null;
        payment_method_code?: string | null;
        buy_payment_mode?: "fiat" | "xcop";
        payment_settled?: boolean;
        payment_source?: "xcop" | string | null;
        payment_proof_required?: boolean;
        xcop_debited_amount?: string | null;
        destination_address_masked?: string | null;
        manual_review_public_message?: string | null;
        breb?: {
            breb_key_id: number;
            key_type: string;
            masked_value: string;
            operational_value?: string;
            bank_name?: string | null;
            holder_name: string;
            instructions?: string | null;
        } | null;
        breb_payment_reference?: string | null;
        fees?: Record<string, string>;
        fee_snapshot?: {
            network_fee?: string;
            administrative_fee?: string;
            payment_method_fee?: string;
            manual_adjustment?: string;
            non_network_fees?: string;
            principal_local?: string;
            gross_local?: string;
            input_semantics?: string;
            total_fees?: string;
            applied_rules?: Array<Record<string, unknown>>;
            exemption?: Array<Record<string, unknown>>;
        } | null;
        can_adjust_order_fee?: boolean;
        beneficiary?: Record<string, string> | null;
        fiat_payout_status?: string | null;
        payment_reference?: string | null;
        payment_sent_at?: string | null;
        sale_payment_proof_download_url?: string | null;
        deposit_qr_payload?: string | null;
        deposit_txids?: string[];
        network_fee_currency?: string | null;
        network_fee_crypto?: string | null;
        network_fee_local?: string | null;
        administrative_fee_local?: string | null;
        fee_type?: string | null;
        fee_asset?: string | null;
        fee_policy?: string | null;
        fee_source?: string | null;
        fee_is_estimated?: boolean;
        net_amount_currency?: string | null;
        server_time?: string | null;
        quote_expires_at?: string | null;
        order_expires_at?: string | null;
        voucher_deadline_at?: string | null;
        deposit_deadline_at?: string | null;
        payment_deadline_at?: string | null;
        rate_policy?: "stable_locked" | "volatile_recalculating" | string | null;
        rate_locked_until?: string | null;
        rate_recalculation_due_at?: string | null;
        last_rate_recalculated_at?: string | null;
        rate_recalculation_count?: number;
        rate_recalculation_status?: "pending" | "recalculated" | "failed_retryable" | "not_required" | string | null;
        rate_recalculation_block_reason?: "ticker_unavailable" | "rate_recalculation_pending" | string | null;
        rate_recalculation_failed_at?: string | null;
        rate_recalculation_last_error_code?: string | null;
        original_rate?: string | null;
        current_rate?: string | null;
        current_total_exchange_local?: string | null;
        crypto_status?: string | null;
        crypto_address?: string | null;
        crypto_txid?: string | null;
        crypto_confirmations?: number | null;
        is_buy_order?: boolean;
        is_sell_order?: boolean;
        is_terminal?: boolean;
        is_completed?: boolean;
        is_cancelled?: boolean;
        is_initial_received?: boolean;
        has_live_outgoing_crypto_tx?: boolean;
        can_approve_payment_proof?: boolean;
        can_crypto_payout?: boolean;
        can_prepare_cash_order?: boolean;
        can_admin_prepare_cash_order?: boolean;
        can_user_accept_order?: boolean;
        can_upload_voucher?: boolean;
        upload_voucher_block_reason?: string | null;
        can_cancel_order?: boolean;
        can_admin_upload_sale_payment_proof?: boolean;
        can_admin_complete_sale_payment?: boolean;
        sale_payment_proof_required?: boolean;
        sale_payment_proof_uploaded?: boolean;
        admin_complete_sale_payment_block_reason?: string | null;
        manual_review_reason?: string | null;
        manual_review_code?: string | null;
        manual_review_action_hint?: string | null;
        address_assignment_pending?: boolean;
        voucher_uploaded_at?: string | null;
        sale_payment_completed_at?: string | null;
        sale_payment_proof_uploaded_at?: string | null;
        underpaid?: boolean;
        overpaid?: boolean;
        late_deposit?: boolean;
        can_mark_resolved?: boolean;
        can_retry_payout?: boolean;
        can_process_crypto_payout?: boolean;
        can_retry_crypto_payout?: boolean;
        can_register_manual_txid?: boolean;
        can_resolve_crypto_transaction?: boolean;
        can_resolve_crypto_reconciliation?: boolean;
        payout_status_label?: string | null;
        latest_outgoing_crypto_transaction_id?: number | null;
        process_action_label?: string | null;
        payout_status?: string | null;
        payout_mode_recommended?: string | null;
        payout_reason_code?: string | null;
        liquidity_status?: string | null;
        liquidity_required_amount?: string | null;
        liquidity_available_amount?: string | null;
        manual_review?: boolean;
        can_retry_address_assignment?: boolean;
        can_close_manual_review?: boolean;
        can_reconcile_deposit_by_txid?: boolean;
        reconcile_deposit_block_reason?: string | null;
        can_submit_manual_incoming_verification?: boolean;
        can_approve_manual_incoming_verification?: boolean;
        can_view_manual_incoming_evidence?: boolean;
        manual_incoming_verification_status?: string | null;
        manual_incoming_verification_id?: number | null;
        can_resolve_amount_variance?: boolean;
        late_deposits?: Array<{
            id: number;
            txid?: string | null;
            amount: string;
            confirmations: number;
            required_confirmations: number;
            status: string;
            late_deposit_status: string;
            blocks_completion: boolean;
            adjustment_payout_id?: number | null;
            resolved_at?: string | null;
            suspense_open: boolean;
            financial_recovery_open: boolean;
            can_process_adjustment: boolean;
            reason_code?: string | null;
            adjustment_payout_status?: string | null;
            proof_integrity_status?: string | null;
            adjustment_economically_sent?: boolean;
            can_repair_payment_proof?: boolean;
            repair_payment_proof_block_reason?: string | null;
            proof_integrity_incident_status?: string;
            proof_repair_status?: string;
        }>;
        can_process_fiat_payout?: boolean;
        can_upload_payment_proof?: boolean;
        can_mark_fiat_payout_sent?: boolean;
        can_complete_sell_order?: boolean;
        can_change_payment_account?: boolean;
        can_view_sell_beneficiary?: boolean;
        sell_payout_block_reason?: string | null;
        principal_payout_economically_sent?: boolean;
        principal_payout_state?: string;
        principal_payout_documentation_valid?: boolean;
        can_repair_payment_proof?: boolean;
        repair_payment_proof_block_reason?: string | null;
        proof_integrity_incident_status?: string;
        proof_repair_status?: string;
        sell_fiat_payout_id?: number | null;
        payout_basis_stale?: boolean;
        proof_integrity_status?: string | null;
        payment_account_snapshot?: {
            payment_method_code?: string;
            beneficiary_name?: string;
            beneficiary_document_masked?: string;
            bank_name?: string;
            account_type?: string;
            account_number_masked?: string;
            phone_masked?: string;
            location_name?: string;
            [key: string]: unknown;
        } | null;
        applied_sale_rate?: string | null;
        can_accept_underpaid?: boolean;
        can_refund_overpaid?: boolean;
        crypto?: CryptoInfo | null;
        processed_by?: number | null;
        assigned_admin?: { id: number; name: string } | null;
        backoffice_actions?: {
            can_take?: boolean;
            can_release?: boolean;
            can_transfer?: boolean;
            can_reassign?: boolean;
            can_change_bank_account?: boolean;
            can_change_payout_account?: boolean;
            can_change_destination_wallet?: boolean;
            can_change_payment_method?: boolean;
            read_only_by_assignment?: boolean;
        };
        account_delivery_type: string;
        xcop_payment: boolean
        administrative_fee_order: string | number;
}

export declare interface OrderRelationships {
        account_delivery: BankAccount | EfectyAccount | OtherAccount
        adminProcess?: User
        currency: Currency
        currencyExchangeOrder: CurrencyExchangeOrder
        payment: PaymentMethod
        shipping: ShippingType
        status: OrderStatus
        user: User
        images: Image[]
        red: NetworkType
        cryptoAddress?: CryptoAddress | null
        cryptoTransactions?: CryptoTransaction[]
        effectiveOrderCode?: EffectiveOrderCode
}

// ----------------------------------------------------------------
export declare interface EffectiveOrderCode {
        code_one: string
        has_code_two?: boolean
        created_at?: string | null
        updated_at?: string | null
}
export type OrderStatus = BaseModel<OrderStatusAttributes, null>;
interface OrderStatusAttributes {
        name: string;
        description: string;
}

export type CurrencyExchangeOrder = BaseModel<CurrencyExchangeOrderAttributes, CurrencyExchangeOrderRelationships>;

interface CurrencyExchangeOrderAttributes {
        order_id: 3
        local_currency_id: number
        reference_currency_id: number
        exchange_local: string
        exchange_reference: string
        total_exchange_local: string
        total_exchange_reference: string

}

interface CurrencyExchangeOrderRelationships {
        localCurrency: Currency
        referenceCurrency: Currency
}

//---------------
export declare interface CountOrders {
        pendings: number
        cancels: number
        takes: number
        done: number
        total: number
}

export type TypeOrderFilter = 'pendings'|'takes' | 'dones' | 'cancels'
