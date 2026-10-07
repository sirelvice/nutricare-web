import { test, expect, type Page } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";


async function signIn(page: Page) {
  const octets = randomBytes(3);
  const headers = { "x-forwarded-for": `10.${octets[0]}.${octets[1]}.${octets[2]}` };
  await page.setExtraHTTPHeaders(headers);
  const email = `e2e-bmi-${randomUUID()}@example.com`;
  const password = "NutriCareE2E!2026";
  const response = await page.request.post("/api/auth/register", {
    headers, data: { email, password, name: "BMI experience test" },
  });
  expect(response.status()).toBe(201);
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const callbackPromise = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/auth/callback/credentials",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const callback = await callbackPromise;
  const result = await callback.json().catch(() => null) as { url?: string } | null;
  const destination = result?.url ? new URL(result.url) : null;
  expect(callback.status(), "Credentials callback HTTP status").toBeLessThan(400);
  expect(destination?.searchParams.get("error"),
    `Credentials callback error; code=${destination?.searchParams.get("code") ?? "none"}`,
  ).toBeNull();
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
}

for (const width of [375, 1280]) {
  test(`BMI supports keyboard submission and fits ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    await page.goto("/tools/bmi");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: "BMI Calculator", exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1 })).toHaveCount(1);
    await page.getByLabel("Height (cm)").fill("170");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Weight (kg)")).toBeFocused();
    await page.getByLabel("Weight (kg)").fill("60");
    await page.keyboard.press("Enter");
    const result = main.getByRole("region", { name: "Your result", exact: true });
    await expect(result.getByText("20.8", { exact: true })).toBeVisible();
    await expect(result.getByRole("status")).toHaveText("Your BMI is 20.8. Adult screening category: Normal.");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const path = testInfo.outputPath(`bmi-${width}.png`);
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(`bmi-${width}`, { path, contentType: "image/png" });
  });
}

test("BMI focuses missing measurements and associates their errors", async ({ page }) => {
  await signIn(page);
  await page.goto("/tools/bmi");
  await page.getByRole("button", { name: "Calculate BMI", exact: true }).click();
  const height = page.getByLabel("Height (cm)");
  const weight = page.getByLabel("Weight (kg)");
  await expect(height).toBeFocused();
  await expect(height).toHaveAttribute("aria-invalid", "true");
  await expect(height).toHaveAttribute("aria-describedby", "height-hint height-error");
  await expect(page.locator("#height-error")).toHaveText("Enter your height in cm.");
  await expect(page.locator("#weight-error")).toHaveText("Enter your weight in kg.");
  await height.fill("170");
  await page.getByRole("button", { name: "Calculate BMI", exact: true }).click();
  await expect(weight).toBeFocused();
});

test("BMI keeps invalid text editable and clears an outdated result", async ({ page }) => {
  await signIn(page);
  await page.goto("/tools/bmi");
  const height = page.getByLabel("Height (cm)");
  const weight = page.getByLabel("Weight (kg)");
  await height.fill("170");
  await weight.fill("60");
  await page.getByRole("button", { name: "Calculate BMI", exact: true }).click();
  const result = page.getByRole("region", { name: "Your result", exact: true });
  await expect(result.getByText("20.8", { exact: true })).toBeVisible();
  await height.fill("-170");
  await expect(result.getByText("20.8", { exact: true })).toHaveCount(0);
  await expect(result.getByRole("status")).toHaveText("Measurements changed. Calculate BMI again.");
  await page.getByRole("button", { name: "Calculate BMI", exact: true }).click();
  await expect(height).toHaveValue("-170");
  await expect(height).toBeFocused();
  await expect(page.locator("#height-error")).toHaveText("Enter a number between 80 and 250 cm.");
  await height.fill("170");
  await weight.fill("80");
  await page.keyboard.press("Enter");
  await expect(result.getByText("27.7", { exact: true })).toBeVisible();
  await expect(result.getByText("Overweight", { exact: true })).toBeVisible();
});
