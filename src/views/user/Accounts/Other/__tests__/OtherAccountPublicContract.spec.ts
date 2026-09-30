import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/views/user/Accounts/Other/OtherAccountView.vue"),
  "utf8",
);
const storeSource = readFileSync(
  resolve(process.cwd(), "src/stores/OtherPaymentStore.ts"),
  "utf8",
);

describe("other account public API contract", () => {
  it("loads only catalogs required by the form", () => {
    expect(source).toContain("companyAccount.getCurrencies()");
    expect(source).toContain("otherPaymentsStore.getOtherPayments()");
    expect(source).not.toContain("companyAccount.getBanks()");
    expect(source).toContain("companyAccount.getPaymentMethods()");
    expect(source).not.toContain("companyAccount.getTypeBankAccounts()");
    expect(storeSource).toContain("client/account/catalog/sub-payment-types");
    expect(storeSource).not.toContain("'sub/payment/type'");
  });
});
