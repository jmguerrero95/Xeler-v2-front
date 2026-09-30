import { mount } from "@vue/test-utils";
import { nextTick, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createVuetify } from "vuetify";

const orderRef = ref<any>(null);
const getAdminOrderByTransactionMock = vi.fn();
const helperHttpMock = vi.fn();
const twoFactorState = {
  modal: false,
  newFlow: false,
  callback: null as null | { fn: () => Promise<void> },
  code: "123456",
};

vi.mock("pinia", async (importOriginal) => {
  const actual = await importOriginal<typeof import("pinia")>();
  return {
    ...actual,
    storeToRefs: () => ({
      order: orderRef,
    }),
  };
});

vi.mock("@/stores/TransactionStore", () => ({
  TransactionStore: () => ({
    getAdminOrderByTransaction: getAdminOrderByTransactionMock,
    takeOrder: vi.fn(),
    releaseOrder: vi.fn(),
  }),
}));

vi.mock("@/stores/UserStore", () => ({
  UserStore: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@/stores/TwoFactorAuthStore", () => ({
  TwoFactorAuthStore: () => twoFactorState,
}));

vi.mock("@/helper", () => ({
  helperStore: () => ({
    http: helperHttpMock,
  }),
  getUserAuth: () => ({ id: 7 }),
  itemHaveImages: () => false,
}));

import TransactionDetailView from "../TransactionDetailView.vue";

describe("TransactionDetailView", () => {
  beforeEach(() => {
    getAdminOrderByTransactionMock.mockReset();
    helperHttpMock.mockReset();
    helperHttpMock.mockResolvedValue({ data: {} });
    twoFactorState.modal = false;
    twoFactorState.newFlow = false;
    twoFactorState.callback = null;
    orderRef.value = {
      id: 10,
      attributes: {
        tranx_no: "TNX-ADMIN-1",
        processed_by: 7,
        is_terminal: false,
        type: "Venta",
        can_admin_upload_sale_payment_proof: false,
        can_admin_complete_sale_payment: false,
        admin_complete_sale_payment_block_reason: "sale_payment_proof_required",
        manual_review_reason: "address_assignment_failed",
        manual_review_action_hint: "Reintentar asignacion de direccion o revisar provider.",
        can_retry_address_assignment: true,
        can_retry_payout: false,
        can_close_manual_review: true,
      },
      relationships: {
        images: [],
      },
    };
    getAdminOrderByTransactionMock.mockResolvedValue(orderRef.value);
  });

  const mountView = () => mount(TransactionDetailView, {
    props: {
      numTransaction: "TNX-ADMIN-1",
    },
    global: {
      plugins: [createVuetify()],
      stubs: {
        VRow: { template: "<div><slot /></div>" },
        VCol: { template: "<div><slot /></div>" },
        VIcon: { template: "<i />" },
        BtnWithModalComponent: { template: "<div><slot /><slot name='contentModal' /></div>" },
        UploadImageComponent: { template: "<div />" },
        VBtnSecondary: { template: "<button><slot /></button>" },
        GeneralDetail: { template: "<div />" },
        UserDetail: { template: "<div />" },
        PaymentDetail: { template: "<div />" },
        CronometerComponent: { template: "<div />" },
        DetailAccountSell: { template: "<div />" },
        AmountDetail: { template: "<div />" },
        QrBuy: { template: "<div />" },
        InputComponent: {
          props: ["modelValue", "name"],
          emits: ["update:modelValue"],
          template: "<input :data-name='name' :value='modelValue' @input='$emit(\"update:modelValue\", $event.target.value)' />",
        },
      },
      mocks: {
        $vuetify: {
          display: {
            mdAndDown: false,
            lgAndUp: true,
          },
        },
      },
    },
  });

  it("shows actionable manual review context and block reason", async () => {
    const wrapper = mountView();

    await nextTick();

    expect(wrapper.text()).toContain("sale_payment_proof_required");
    expect(wrapper.text()).toContain("Revision manual cripto");
    expect(wrapper.text()).toContain("Motivo: address_assignment_failed");
    expect(wrapper.text()).toContain("Reintentar asignacion de direccion o revisar provider.");
    expect(wrapper.text()).toContain("Se puede reintentar asignacion de direccion.");
  });

  it("renders flag-driven sell controls and calls reconciliation and evidence endpoints", async () => {
    orderRef.value.attributes = {
      ...orderRef.value.attributes,
      can_reconcile_deposit_by_txid: true,
      can_submit_manual_incoming_verification: true,
      can_approve_manual_incoming_verification: true,
      can_view_manual_incoming_evidence: true,
      manual_incoming_verification_id: 44,
      can_resolve_amount_variance: true,
      late_deposits: [{
        id: 55,
        txid: "late-txid",
        amount: "1",
        confirmations: 20,
        required_confirmations: 20,
        status: "quarantined",
        late_deposit_status: "confirmed_unresolved",
        blocks_completion: true,
        adjustment_payout_id: null,
        resolved_at: null,
        suspense_open: true,
        financial_recovery_open: false,
        can_process_adjustment: true,
        reason_code: null,
      }],
      can_complete_sell_order: true,
    };
    const createObjectUrl = vi.fn().mockReturnValue("blob:evidence");
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectUrl });
    const openWindow = vi.spyOn(window, "open").mockImplementation(() => null);
    helperHttpMock.mockResolvedValue({ data: new Blob(["evidence"]) });

    const wrapper = mountView();
    await nextTick();

    expect(wrapper.text()).toContain("Conciliar por TXID");
    expect(wrapper.text()).toContain("Registrar verificacion reforzada");
    expect(wrapper.text()).toContain("Segunda aprobacion");
    expect(wrapper.text()).toContain("Consultar evidencia");
    expect(wrapper.text()).toContain("Resolver diferencia de monto");
    expect(wrapper.text()).toContain("Deposito tardio #55");

    await wrapper.get('[data-name="TXID"]').setValue("tx-admin-1");
    await wrapper.get('[data-name="Motivo"]').setValue("Conciliacion operativa");
    await wrapper.findAll("button").find(button => button.text().includes("Consultar transferencia"))!.trigger("click");
    await twoFactorState.callback!.fn();
    expect(helperHttpMock).toHaveBeenCalledWith(
      "admin/crypto/orders/10/reconcile-incoming",
      "post",
      expect.objectContaining({ data: expect.objectContaining({ txid: "tx-admin-1" }) }),
      "",
      false,
      expect.objectContaining({ financialAction: true }),
    );

    await wrapper.findAll("button").find(button => button.text().includes("Consultar evidencia"))!.trigger("click");
    await twoFactorState.callback!.fn();
    expect(helperHttpMock).toHaveBeenCalledWith(
      "admin/crypto/manual-incoming-verifications/44/evidence",
      "post",
      expect.objectContaining({ responseType: "blob" }),
      "",
      false,
      expect.objectContaining({ financialAction: true }),
    );
    expect(openWindow).toHaveBeenCalledWith("blob:evidence", "_blank", "noopener,noreferrer");

    openWindow.mockRestore();
  });

  it("shows the safe readiness reason without enabling TXID reconciliation", async () => {
    orderRef.value.attributes = {
      ...orderRef.value.attributes,
      can_reconcile_deposit_by_txid: false,
      reconcile_deposit_block_reason: "external_calls_disabled",
      can_submit_manual_incoming_verification: false,
    };

    const wrapper = mountView();
    await nextTick();

    expect(wrapper.text()).toContain("Conciliacion por TXID no disponible: external_calls_disabled");
    expect(wrapper.text()).not.toContain("Consultar transferencia");
  });

  it("renders backend late-deposit states without inferring from quarantine", async () => {
    orderRef.value.attributes = {
      ...orderRef.value.attributes,
      late_deposits: [{
        id: 77,
        txid: "dropped-tx",
        amount: "1",
        confirmations: 0,
        required_confirmations: 20,
        status: "reversed",
        late_deposit_status: "dropped_before_confirmation",
        blocks_completion: false,
        adjustment_payout_id: null,
        resolved_at: "2026-07-16T12:00:00Z",
        suspense_open: false,
        financial_recovery_open: false,
        can_process_adjustment: false,
        reason_code: "late_deposit_adjustment_not_available",
      }, {
        id: 78,
        txid: "reappeared-tx",
        amount: "1",
        confirmations: 1,
        required_confirmations: 20,
        status: "confirming",
        late_deposit_status: "reappeared_pending",
        blocks_completion: true,
        adjustment_payout_id: 90,
        adjustment_payout_status: "pending",
        adjustment_economically_sent: false,
        proof_integrity_status: "manual_review",
        resolved_at: null,
        suspense_open: false,
        financial_recovery_open: false,
        can_process_adjustment: false,
        reason_code: "late_deposit_adjustment_not_available",
      }],
    };

    const wrapper = mountView();
    await nextTick();

    expect(wrapper.text()).toContain("No confirmado / descartado");
    expect(wrapper.text()).toContain("Deposito reaparecido y confirmando");
    expect(wrapper.text()).toContain("Payout reservado");
    expect(wrapper.text()).toContain("Comprobante invalido");
  });

  it("shows an economically sent payout and its documentary incident independently", async () => {
    orderRef.value.attributes = {
      ...orderRef.value.attributes,
      principal_payout_economically_sent: true,
      principal_payout_state: "documentation_invalid",
      principal_payout_documentation_valid: false,
      proof_integrity_status: "manual_review",
      sell_fiat_payout_id: 91,
      can_repair_payment_proof: true,
    };

    const wrapper = mountView();
    await nextTick();

    expect(wrapper.text()).toContain("Payout enviado");
    expect(wrapper.text()).toContain("Incidente documental: comprobante invalido");
    expect(wrapper.text()).toContain("Reparar comprobante");
  });

  it("does not show proof repair when the backend flag is false", async () => {
    orderRef.value.attributes = {
      ...orderRef.value.attributes,
      principal_payout_economically_sent: true,
      principal_payout_documentation_valid: false,
      sell_fiat_payout_id: 91,
      can_repair_payment_proof: false,
    };

    const wrapper = mountView();
    await nextTick();

    expect(wrapper.text()).toContain("Payout enviado");
    expect(wrapper.text()).toContain("Incidente documental: comprobante invalido");
    expect(wrapper.text()).not.toContain("Reparar comprobante");
  });

  it("shows the backend repair state without enabling a second repair", async () => {
    orderRef.value.attributes = {
      ...orderRef.value.attributes,
      principal_payout_economically_sent: true,
      principal_payout_documentation_valid: false,
      proof_integrity_incident_status: "open",
      proof_repair_status: "storing",
      sell_fiat_payout_id: 91,
      can_repair_payment_proof: false,
    };

    const wrapper = mountView();
    await nextTick();

    expect(wrapper.text()).toContain("Reparacion de comprobante en curso");
    expect(wrapper.text()).not.toContain("Reparar comprobante");
  });
});
