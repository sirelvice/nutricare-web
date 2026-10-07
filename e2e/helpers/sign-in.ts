import { expect, type Page } from "@playwright/test";

// These feature tests exercise real login, with distinct callback and navigation
// checks so a credentials failure cannot be mistaken for a slow page transition.
export async function submitCredentialsAndWait(page: Page) {
  const callbackResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/auth/callback/credentials" &&
    response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const callback = await callbackResponse;
  expect(callback.ok(), "Credentials callback should succeed").toBe(true);
  const callbackData: unknown = await callback.json();
  const callbackUrl = callbackData && typeof callbackData === "object" &&
    "url" in callbackData && typeof callbackData.url === "string"
    ? new URL(callbackData.url, page.url()) : null;
  expect(callbackUrl, "Credentials callback should return a destination").not.toBeNull();
  expect(callbackUrl?.searchParams.get("error"), "Credentials callback should not report an authentication error").toBeNull();
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/, { timeout: 15_000 });
  await waitForWorkspaceReady(page);
  // Wait for the dashboard's core read to finish before another page installs
  // API mocks. URL alone can become observable while the new document is loading.
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
}


export async function waitForWorkspaceReady(page: Page) {
  await expect(page.locator("[data-sidebar-preference-ready]")).toHaveAttribute(
    "data-sidebar-preference-ready", "true", { timeout: 15_000 },
  );
}
