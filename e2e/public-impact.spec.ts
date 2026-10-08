import { test, expect } from "@playwright/test";

for (const width of [375, 1280]) {
  test(`public impact presents evidence honestly at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/impact");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1 })).toHaveText("A clear approach to measuring impact");
    await expect(main.getByText("No verified programme totals or health outcomes are published here yet.", { exact: false })).toBeVisible();
    await expect(page.getByText(/HIPAA-Ready|AI-Powered|Download impact snapshot/)).toHaveCount(0);
    await expect(main.getByText("Whether guidance is understandable and useful")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(main.getByRole("link", { name: "Explore partnerships" })).toHaveAttribute("href", "/partners");
  });
}
