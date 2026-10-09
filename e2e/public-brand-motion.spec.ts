import { test, expect } from "@playwright/test";

test("NutriCare supplies its own browser icon and branded link preview", async ({ page }) => {
  await page.goto("/");
  const icons = page.locator('link[rel="icon"]');
  await expect(icons).toHaveCount(1);
  await expect(icons).toHaveAttribute("href", "/brand/nutricare-mark.png?v=3");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "NutriCare");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/marketing\/nutricare-everyday-nutrition\.webp$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  const response = await page.request.get("/brand/nutricare-mark.png?v=3");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/png");
});
