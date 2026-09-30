import { expect, test, type Page } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const userEmail = process.env.E2E_USER_EMAIL;
const userPassword = process.env.E2E_USER_PASSWORD;

const requireCredentials = (email?: string, password?: string) => {
  test.skip(!email || !password, "QA credentials must be supplied by environment.");
};

const login = async (page: Page, email: string, password: string) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(password);
  const loginResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname.endsWith("/api/login"),
  );
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  expect((await loginResponse).ok()).toBe(true);
  await expect(page).not.toHaveURL(/\/login$/);
};

test.describe("controlled local runtime", () => {
  test("admin login and central screens have no unexpected runtime failures", async ({
    page,
  }) => {
    requireCredentials(adminEmail, adminPassword);
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      failedRequests.push(`${request.method()} ${request.url()}`);
    });

    await login(page, adminEmail!, adminPassword!);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("link", { name: "Transacciones" }).first()).toBeVisible();

    for (const path of [
      "/admin/transactions",
      "/admin/control-center",
      "/admin/integrations/crypto/health",
      "/users",
    ]) {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      await page.waitForTimeout(750);
    }

    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });

  test("user cannot open an administrative route", async ({ page }) => {
    requireCredentials(userEmail, userPassword);
    await login(page, userEmail!, userPassword!);
    await page.goto("/admin/control-center");
    await expect(page).toHaveURL(/\/forbidden$/);
  });

  for (const viewport of [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
  ]) {
    test(`login remains usable at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/login");
      await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Contraseña" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Iniciar Sesión" })).toBeVisible();
    });
  }
});
