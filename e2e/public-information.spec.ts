import { test, expect } from "@playwright/test";

for (const width of [375, 768, 1280]) {
  for (const [route, title] of [["/privacy", "Privacy Policy"], ["/terms", "Terms of Use"], ["/site-map", "Sitemap"]]) {
    test(`${route} remains readable at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (route === "/site-map") {
        await page.getByRole("main").getByRole("link", { name: "Pricing", exact: true }).click();
        await expect(page).toHaveURL(/\/pricing$/);
      } else {
        await expect(page.getByRole("main").getByRole("link", { name: "Contact page", exact: true })).toHaveAttribute("href", "/contact");
      }
      const path = testInfo.outputPath(`information-${route.slice(1)}-${width}.png`);
      await page.screenshot({ path, fullPage: true });
      await testInfo.attach(`information-${route.slice(1)}-${width}`, { path, contentType: "image/png" });
    });
  }
}

test("homepage FAQ is collapsed and works with keyboard", async ({ page }) => {
  await page.goto("/");
  const question = page.locator("summary").filter({ hasText: "Is NutriCare free to use?" });
  const answer = page.getByText("The core experience is free. There is no payment or subscription requirement today.", { exact: true });
  await expect(answer).toBeHidden();
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(answer).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(answer).toBeHidden();
});
