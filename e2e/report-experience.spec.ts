import { test, expect, type Page } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import { submitCredentialsAndWait } from "./helpers/sign-in";
const report = {
  generatedAt: "2026-10-08T12:00:00Z",
  profile: { heightCm: 175, age: 30, gender: "male", activity: "moderate", goal: "lose" },
  bmi: { latest: { value: 22.9, category: { label: "Normal", note: "Adult screening" } } },
  nutritionPlan: { id: "plan-1", version: 1, goal: "lose", targetCalories: 2000, proteinG: 100, carbsG: 250, fatG: 67, createdAt: "2026-10-08T00:00:00Z" },
  weight: { stats: null, entriesCount: 0, entries: [] }, progress: null,
};
async function signIn(page: Page) {
  const ip = randomBytes(3);
  const headers = { "x-forwarded-for": `10.${ip[0]}.${ip[1]}.${ip[2]}` };
  await page.setExtraHTTPHeaders(headers);
  const email = `e2e-report-${randomUUID()}@example.com`;
  const password = "NutriCareE2E!2026";
  expect((await page.request.post("/api/auth/register", { headers, data: { name: "Report test", email, password } })).status()).toBe(201);
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await submitCredentialsAndWait(page);
}
for (const width of [375, 1280]) {
  test(`report stays concise at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    await page.route((url) => url.pathname === "/api/report", (route) => route.fulfill({ json: report }));
    await page.goto("/report");
    await expect(page.getByRole("button", { name: "Download PDF report" })).toBeEnabled();
    await expect(page.getByText("Normal", { exact: true })).toBeVisible();
    const disclosure = page.locator("summary").filter({ hasText: /^Macro targets$/ });
    await disclosure.focus();
    await expect(disclosure).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText(/Protein 100 g\/day/)).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    const path = testInfo.outputPath(`report-${width}.png`);
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(`report-${width}`, { path, contentType: "image/png" });
  });
}
for (const failure of ["http", "malformed"]) {
  test(`report retries ${failure} reads without reloading`, async ({ page }) => {
    await signIn(page);
    let ready = false;
    await page.route((url) => url.pathname === "/api/report", (route) => ready ? route.fulfill({ json: report }) : failure === "http" ? route.fulfill({ status: 500, json: { error: "untrusted" } }) : route.fulfill({ json: {} }));
    await page.goto("/report");
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Unable to load your report. Try again.");
    await expect(page.getByRole("button", { name: "Download PDF report" })).toHaveCount(0);
    await page.evaluate(() => { (window as Window & { reportMarker?: string }).reportMarker = "same"; });
    ready = true;
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(page.getByRole("button", { name: "Download PDF report" })).toBeEnabled();
    expect(await page.evaluate(() => (window as Window & { reportMarker?: string }).reportMarker)).toBe("same");
  });
}
test("report guides a user without a profile", async ({ page }) => {
  await signIn(page);
  await page.route((url) => url.pathname === "/api/report", (route) => route.fulfill({ status: 404, json: { error: "Profile not found" } }));
  await page.goto("/report");
  await expect(page.getByRole("link", { name: "Complete your profile" })).toHaveAttribute("href", "/profile");
  await expect(page.getByRole("button", { name: "Download PDF report" })).toHaveCount(0);
});
for (const invalid of ["failure", "html"]) {
  test(`report recovers from ${invalid} PDF responses`, async ({ page }) => {
    await signIn(page);
    await page.route((url) => url.pathname === "/api/report", (route) => route.fulfill({ json: report }));
    let ready = false;
    await page.route((url) => url.pathname === "/api/report/pdf", (route) => ready
      ? route.fulfill({ contentType: "application/pdf", body: "%PDF-1.7\nexample" })
      : route.fulfill({ status: invalid === "failure" ? 500 : 200, contentType: "text/html", body: "untrusted" }));
    await page.goto("/report");
    await page.getByRole("button", { name: "Download PDF report" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Unable to download your report. Try again.");
    ready = true;
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PDF report" }).click();
    expect((await download).suggestedFilename()).toBe("nutricare-personal-report.pdf");
    await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  });
}
