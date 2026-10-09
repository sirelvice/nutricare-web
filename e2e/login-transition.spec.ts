import { test, expect } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";

test("successful login starts one authenticated page navigation and prevents repeat submissions", async ({ page }) => {
  const octets = randomBytes(3);
  const headers = { "x-forwarded-for": `10.${octets[0]}.${octets[1]}.${octets[2]}` };
  await page.setExtraHTTPHeaders(headers);
  const email = `e2e-login-transition-${randomUUID()}@example.com`;
  const password = "NutriCareE2E!2026";
  const registration = await page.request.post("/api/auth/register", {
    headers, data: { email, password, name: "Login transition test" },
  });
  expect(registration.status()).toBe(201);
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  let credentialWrites = 0;
  let dashboardDocuments = 0;
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/auth/callback/credentials" && request.method() === "POST") credentialWrites += 1;
    if (url.pathname === "/dashboard" && request.isNavigationRequest() && request.frame() === page.mainFrame()) dashboardDocuments += 1;
  });
  await page.locator("form").evaluate((form) => {
    if (!(form instanceof HTMLFormElement)) throw new Error("Login form not found");
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/, { timeout: 15_000 });
  expect(credentialWrites).toBe(1);
  expect(dashboardDocuments).toBe(1);
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
  await expect(page.getByRole("region", { name: "Welcome back", exact: true })).toHaveCount(0);
});
