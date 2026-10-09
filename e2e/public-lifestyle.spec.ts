import { test, expect } from "@playwright/test";

for (const width of [375, 1280]) {
  test(`homepage lifestyle section loads and fits ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const section = page.getByRole("region", { name: "A little clarity. Room for your routine.", exact: true });
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole("heading", { level: 2 })).toBeVisible();
    const photograph = section.getByRole("img");
    await expect(photograph).toBeVisible();
    await expect.poll(() => photograph.evaluate((node) => {
      const image = node as HTMLImageElement;
      return image.complete && image.naturalWidth > 0;
    })).toBe(true);
    await expect(section.getByRole("link", { name: "Find your starting point", exact: true })).toHaveAttribute("href", "/register");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(photograph).toHaveCSS("transition-duration", "0s");
    const path = testInfo.outputPath(`public-lifestyle-${width}.png`);
    await section.screenshot({ path });
    await testInfo.attach(`public-lifestyle-${width}`, { path, contentType: "image/png" });
  });
}
