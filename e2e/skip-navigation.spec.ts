import { expect, test } from "@playwright/test";

for (const width of [375, 1280]) {
  for (const path of ["/", "/login", "/register", "/forgot-password"]) {
    test(`skip navigation reaches main on ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path);
      await page.keyboard.press("Tab");
      const skip = page.getByRole("link", { name: "Skip to main content", exact: true });
      await expect(skip).toBeFocused();
      await expect(skip).toBeInViewport();
      await page.keyboard.press("Enter");
      await expect(page.locator("main#main-content")).toBeFocused();
      await expect(page.locator("#main-content")).toHaveCount(1);
    });
  }
}
