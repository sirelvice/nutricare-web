import { test, expect, type Page } from "@playwright/test";

async function fillInquiry(page: Page, kind: "contact" | "partner") {
  if (kind === "partner") {
    await page.getByLabel("Organisation", { exact: true }).fill("Community Health Org");
    await page.getByLabel("Contact name", { exact: true }).fill("Jane Doe");
  } else await page.getByLabel("Name", { exact: true }).fill("Jane Doe");
  await page.getByLabel("Email", { exact: true }).fill("jane@example.com");
  await page.getByLabel("Message", { exact: true }).fill("Please tell me more about using NutriCare.");
}

for (const kind of ["contact", "partner"] as const) {
  const url = kind === "contact" ? "/contact" : "/partners";
  const endpoint = kind === "contact" ? "/api/contact" : "/api/partners/inquiries";
  const action = kind === "contact" ? "Send message" : "Submit inquiry";
  for (const width of [375, 1280]) {
    test(`${kind} form validates and saves at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      let writes = 0;
      await page.route((requestUrl) => requestUrl.pathname === endpoint, async (route) => {
        writes += 1;
        await route.fulfill({ status: kind === "contact" ? 200 : 201, json: { ok: true, id: "saved-1" } });
      });
      await page.goto(url);
      await page.getByRole("button", { name: action, exact: true }).click();
      await expect(page.getByLabel(kind === "contact" ? "Name" : "Organisation", { exact: true })).toBeFocused();
      expect(writes).toBe(0);
      await fillInquiry(page, kind);
      await page.getByLabel("Email", { exact: true }).fill("not-an-email");
      await page.getByRole("button", { name: action, exact: true }).click();
      await expect(page.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
      await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
      expect(writes).toBe(0);
      await page.getByLabel("Email", { exact: true }).fill("jane@example.com");
      await page.getByRole("button", { name: action, exact: true }).click();
      await expect(page.getByRole("status")).toContainText("saved.");
      await expect(page.getByLabel("Message", { exact: true })).toHaveValue("");
      expect(writes).toBe(1);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const screenshot = testInfo.outputPath(`public-${kind}-${width}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      await testInfo.attach(`public-${kind}-${width}`, { path: screenshot, contentType: "image/png" });
    });
  }
  test(`${kind} form preserves text after rate rejection`, async ({ page }) => {
    await page.route((requestUrl) => requestUrl.pathname === endpoint, (route) => route.fulfill({ status: 429, json: { error: "Internal detail" } }));
    await page.goto(url);
    await fillInquiry(page, kind);
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(page.getByRole("form", { name: kind === "contact" ? "Contact NutriCare" : "Partner inquiry" }).getByRole("alert")).toHaveText("Too many submissions. Please wait before trying again.");
    await expect(page.getByLabel("Message", { exact: true })).toHaveValue("Please tell me more about using NutriCare.");
    await expect(page.getByRole("button", { name: action, exact: true })).toBeEnabled();
  });
  test(`${kind} form requires a decision after an uncertain write`, async ({ page }) => {
    let writes = 0;
    await page.route((requestUrl) => requestUrl.pathname === endpoint, (route) => {
      writes += 1;
      return route.fulfill({ status: 500, json: { error: "Internal detail" } });
    });
    await page.goto(url);
    await fillInquiry(page, kind);
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(page.getByRole("form", { name: kind === "contact" ? "Contact NutriCare" : "Partner inquiry" }).getByRole("alert")).toContainText("Your submission may already be saved.");
    await expect(page.getByRole("button", { name: action, exact: true })).toBeDisabled();
    await expect(page.getByLabel("Message", { exact: true })).toHaveValue("Please tell me more about using NutriCare.");
    expect(writes).toBe(1);
    await page.getByRole("button", { name: "Allow another attempt", exact: true }).click();
    await expect(page.getByRole("button", { name: action, exact: true })).toBeEnabled();
    expect(writes).toBe(1);
  });
}
