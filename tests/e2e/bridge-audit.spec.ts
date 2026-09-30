import { expect, test, type Page } from "@playwright/test";

type Role = "User" | "Superadmin";

const installSession = async (
  page: Page,
  role: Role,
  permissions: string[],
) => {
  await page.addInitScript(
    ({ roleName, permissionNames }) => {
      sessionStorage.setItem("token", "qa-bridge-browser-token");
      sessionStorage.setItem(
        "user",
        JSON.stringify({
          id: roleName === "User" ? 9001 : 9002,
          first_name: "QA",
          email: `${roleName.toLowerCase()}@example.test`,
          username: `qa-${roleName.toLowerCase()}`,
          email_verified_at: "2026-08-16T00:00:00Z",
          phone_verified_at: "2026-08-16T00:00:00Z",
          created_at: "2026-08-16T00:00:00Z",
          updated_at: "2026-08-16T00:00:00Z",
          roles: [
            {
              name: roleName,
              permissions: permissionNames.map((name) => ({
                name,
                guard_name: "web",
              })),
            },
          ],
        }),
      );
    },
    { roleName: role, permissionNames: permissions },
  );
};

const paginated = (data: unknown[] = []) => ({
  data,
  meta: { current_page: 1, last_page: 1, total: data.length },
});

const mockXelerApi = async (page: Page) => {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(
      /^\/api\//,
      "",
    );
    let json: unknown = paginated();

    if (path === "international-accounts/access") {
      json = {
        data: {
          feature_enabled: true,
          status: "approved",
          can_request: false,
          available_products: ["usd", "eur"],
          access: {
            id: 1,
            status: "approved",
            requested_products: ["usd", "eur"],
          },
        },
      };
    } else if (path === "international-accounts/onboarding") {
      json = {
        data: {
          access_status: "approved",
          can_start: false,
          polling_enabled: false,
          onboarding: {
            provider_status: "active",
            kyc_status: "approved",
            tos_status: "approved",
            is_terminal: true,
            endorsements: [
              {
                product: "usd",
                status: "approved",
                requirement_codes: [],
                future_requirement_codes: [],
              },
              {
                product: "eur",
                status: "approved",
                requirement_codes: [],
                future_requirement_codes: [],
              },
            ],
          },
        },
      };
    } else if (path === "admin/international-accounts") {
      json = {
        data: {
          summary: {
            eligible: 0,
            requested: 0,
            under_review: 0,
            approved: 0,
            rejected: 0,
            suspended: 0,
          },
          items: [],
        },
        meta: { current_page: 1, last_page: 1, total: 0 },
      };
    } else if (path === "admin/international-accounts/accounts") {
      json = {
        data: [],
        meta: {
          current_page: 1,
          last_page: 1,
          total: 0,
          summary: {
            active_usd: 0,
            active_eur: 0,
            deposits_received: 0,
            deposits_processing: 0,
            deposits_completed: 0,
            deposits_incident: 0,
            open_reconciliations: 0,
          },
        },
      };
    } else if (path === "users/activite/user") {
      json = { response: { id: 9002, first_name: "QA" } };
    } else if (path === "notifications/active/user") {
      json = { response: { data: [] } };
    } else if (path === "currency") {
      json = { response: [] };
    } else if (path === "public/ticker") {
      json = { data: [] };
    }

    await route.fulfill({ status: 200, contentType: "application/json", json });
  });
};

const observeRuntime = (page: Page) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const directBridgeRequests: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    if (new URL(request.url()).hostname.endsWith("bridge.xyz")) {
      directBridgeRequests.push(request.url());
    }
  });
  void page.route(/^https?:\/\/(?:[^/]+\.)?bridge\.xyz\//, (route) =>
    route.abort("blockedbyclient"),
  );

  return { pageErrors, consoleErrors, directBridgeRequests };
};

test("Bridge client consumes backend envelopes without provider calls", async ({
  page,
}) => {
  const runtime = observeRuntime(page);
  await installSession(page, "User", [
    "international-accounts.view-own",
    "international-accounts.accounts.view-own",
    "international-accounts.accounts.activate-own",
    "international-accounts.beneficiaries.view-own",
    "international-accounts.beneficiaries.manage-own",
    "international-accounts.transfers.view-own",
    "international-accounts.transfers.create-own",
  ]);
  await mockXelerApi(page);

  await page.goto("/user/international-accounts");
  await expect(
    page.getByText("Cuentas Internacionales", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Aprobado", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Cuenta USD", { exact: true }).first(),
  ).toBeVisible();

  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);
  expect(runtime.directBridgeRequests).toEqual([]);
});

test("Bridge admin consumes paginated envelopes without provider calls", async ({
  page,
}) => {
  const runtime = observeRuntime(page);
  await installSession(page, "Superadmin", [
    "international-accounts.view",
    "international-accounts.accounts.view",
    "international-accounts.deposits.view",
    "international-accounts.beneficiaries.view",
    "international-accounts.transfers.view",
    "international-accounts.fees.view",
  ]);
  await mockXelerApi(page);

  await page.goto("/admin/international-accounts");
  await expect(
    page.getByRole("heading", { name: "Cuentas Internacionales" }),
  ).toBeVisible();
  await expect(
    page.getByText("Beneficiarios", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Transferencias", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Comisiones", { exact: true }).first(),
  ).toBeVisible();

  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.consoleErrors).toEqual([]);
  expect(runtime.directBridgeRequests).toEqual([]);
});
