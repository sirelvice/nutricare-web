import { test, expect, type Page } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import { submitCredentialsAndWait } from "./helpers/sign-in";

const plans = [
  { id: "plan-1", version: 1, goal: "lose", targetCalories: 2000, proteinG: 100, carbsG: 250, fatG: 60, createdAt: "2026-10-01T00:00:00Z" },
  { id: "plan-2", version: 2, goal: "maintain", targetCalories: 2200, proteinG: 110, carbsG: 275, fatG: 65, createdAt: "2026-10-07T00:00:00Z" },
];
async function signIn(page: Page) {
  const ip = randomBytes(3);
  const headers = { "x-forwarded-for": `10.${ip[0]}.${ip[1]}.${ip[2]}` };
  await page.setExtraHTTPHeaders(headers);
  const email = `e2e-history-${randomUUID()}@example.com`;
  const password = "NutriCareE2E!2026";
  const response = await page.request.post("/api/auth/register", { headers, data: { name: "History test", email, password } });
  expect(response.status()).toBe(201);
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await submitCredentialsAndWait(page);
}

for (const width of [375, 1280]) {
  test(`history stays concise with 100 measurements at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    const entries = Array.from({ length: 100 }, (_, index) => ({
      id: `weight-${index}`, date: "2026-10-07", weightKg: 70 + index / 10, note: index === 0 ? "LongNote".repeat(60) : `Record ${index}`,
    }));
    await page.route((url) => url.pathname === "/api/weight-entries", (route) => route.fulfill({ json: entries }));
    await page.goto("/history");
    const records = page.getByRole("list", { name: "Recorded measurements" }).getByRole("listitem");
    await expect(records).toHaveCount(10);
    await expect(page.getByRole("status").filter({ hasText: "Showing 1 to 10 of 100 records" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
    await expect(page.getByText("LongNote".repeat(60), { exact: true })).toBeHidden();
    await records.first().getByText("Measurement note", { exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("LongNote".repeat(60), { exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.keyboard.press("Enter");
    for (let current = 1; current < 10; current += 1) {
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await expect(records).toHaveCount(10);
      await expect(page.getByRole("status").filter({ hasText: `Showing ${current * 10 + 1} to ${(current + 1) * 10} of 100 records` })).toBeVisible();
    }
    await expect(records.last()).toContainText("79.9 kg");
    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    for (let current = 9; current > 0; current -= 1) {
      await page.getByRole("button", { name: "Previous", exact: true }).click();
    }
    await expect(records.first()).toContainText("70 kg");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const path = testInfo.outputPath(`history-weight-${width}.png`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(`history-weight-${width}`, { path, contentType: "image/png" });
  });
  test(`history compares saved versions at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    await page.route((url) => url.pathname === "/api/weight-entries", (route) => route.fulfill({ json: [] }));
    await page.route((url) => url.pathname === "/api/nutrition-plan/history", (route) => route.fulfill({ json: { plans } }));
    await page.goto("/history");
    await page.getByRole("button", { name: "Nutrition Plans", exact: true }).click();
    await expect(page.getByRole("list", { name: "Saved nutrition plans" }).getByRole("listitem").first()).toContainText("Version 2");
    await expect(page.getByText("+200 kcal/day", { exact: true })).toBeVisible();
    await page.getByLabel("First saved version").selectOption("plan-2");
    await expect(page.getByRole("status").filter({ hasText: "Choose two different versions to compare." })).toHaveText("Choose two different versions to compare.");
    await page.getByLabel("Second saved version").selectOption("plan-1");
    await expect(page.getByText("+200 kcal/day", { exact: true })).toBeVisible();
    await page.getByText("Version 2 details", { exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("110 g", { exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const path = testInfo.outputPath(`history-plans-${width}.png`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(`history-plans-${width}`, { path, contentType: "image/png" });
  });
}

for (const section of ["weight", "plans"] as const) {
  for (const failure of ["http", "malformed"] as const) {
    test(`history recovers from ${section} ${failure} reads without reloading`, async ({ page }) => {
      await signIn(page);
      let available = false;
      const endpoint = section === "weight" ? "/api/weight-entries" : "/api/nutrition-plan/history";
      await page.route((url) => url.pathname === "/api/weight-entries", (route) => route.fulfill({ json: [] }));
      await page.route((url) => url.pathname === endpoint, (route) => available
        ? route.fulfill({ json: section === "weight" ? [] : { plans: [] } })
        : failure === "http" ? route.fulfill({ status: 503, json: { error: "untrusted detail" } })
        : route.fulfill({ json: {} }));
      await page.goto("/history");
      if (section === "plans") await page.getByRole("button", { name: "Nutrition Plans", exact: true }).click();
      await expect(page.getByRole("main").getByRole("alert")).toContainText("Unable to load");
      await expect(page.getByText(section === "weight" ? "No weight entries yet" : "No nutrition plans yet", { exact: true })).toHaveCount(0);
      await page.evaluate(() => { (window as Window & { historyDocument?: string }).historyDocument = "same"; });
      available = true;
      await page.getByRole("button", { name: "Try again", exact: true }).click();
      await expect(page.getByText(section === "weight" ? "No weight entries yet" : "No nutrition plans yet", { exact: true })).toBeVisible();
      expect(await page.evaluate(() => (window as Window & { historyDocument?: string }).historyDocument)).toBe("same");
    });
  }
}

test("history does not let unavailable plans block weight records", async ({ page }) => {
  await signIn(page);
  await page.route((url) => url.pathname === "/api/weight-entries", (route) => route.fulfill({ json: [{ id: "w1", date: "2026-10-07", weightKg: 70 }] }));
  await page.route((url) => url.pathname === "/api/nutrition-plan/history", (route) => route.abort("failed"));
  await page.goto("/history");
  await expect(page.getByText("70 kg", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Nutrition Plans", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Weight", exact: true }).click();
  await expect(page.getByText("70 kg", { exact: true })).toBeVisible();
});
