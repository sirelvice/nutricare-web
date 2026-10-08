import { test, expect } from "@playwright/test";

for (const width of [375, 1280, 1600]) {
  test(`marketing retains visuals and fits ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Nutrition guidance that grows with you." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How NutriCare fits together" })).toBeVisible();
    await page.getByRole("group", { name: "Explore the product journey" }).getByRole("button", { name: "Progress", exact: true }).click();
    await expect(page.getByRole("heading", { name: "See the longer view" })).toBeVisible();
    const highlights = page.getByRole("region", { name: "Product highlights" });
    await highlights.getByRole("button", { name: "Pause animation", exact: true }).click();
    await expect(highlights.getByRole("button", { name: "Resume animation", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width === 1600) {
      const bounds = await page.getByRole("main").boundingBox();
      expect(bounds?.width).toBeGreaterThan(1300);
    }
    const path = testInfo.outputPath(`public-home-${width}.png`);
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(`public-home-${width}`, { path, contentType: "image/png" });
  });
}
test("marketing motion respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".marketing-marquee-track")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".marketing-marquee-copy")).toBeHidden();
  await expect(page.locator(".model-connection").first()).toHaveCSS("animation-name", "none");
});
test("mobile public navigation exposes the marketing pages", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await page.getByLabel("Open navigation", { exact: true }).click();
  const navigation = page.getByRole("navigation", { name: "Mobile navigation", exact: true });
  await expect(navigation.getByRole("link", { name: "For Partners" })).toBeVisible();
  await navigation.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
});

for (const width of [375, 1280]) {
  for (const [route, heading] of [
    ["/about", "Make sense of nutrition. Make room for life."],
    ["/learn", "A little understanding. A clearer way forward."],
    ["/pricing", "The core NutriCare experience is free."],
  ]) {
    test(`public page ${route} fits ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(page.getByRole("link", { name: "NutriCare home", exact: true })).toBeVisible();
      if (width >= 768) {
        await expect(page.getByRole("navigation", { name: "Main navigation", exact: true })).toBeVisible();
      } else {
        await expect(page.getByLabel("Open navigation", { exact: true })).toBeVisible();
      }
      await expect(page.getByRole("contentinfo")).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const path = testInfo.outputPath(`public-${route.slice(1)}-${width}.png`);
      await page.screenshot({ path, fullPage: true });
      await testInfo.attach(`public-${route.slice(1)}-${width}`, { path, contentType: "image/png" });
    });
  }
}

test("homepage feature actions retain the brand gold hover", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Explore BMI", "Explore targets", "Start your journey"]) {
    const action = page.getByRole("link", { name, exact: true });
    await action.hover();
    await expect(action).toHaveCSS("background-color", "rgb(217, 144, 26)");
    await action.focus();
    await expect(action).toBeFocused();
  }
});

for (const width of [375, 1280]) {
  test(`journey card explanation toggles by keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/about");
    const info = page.getByRole("button", { name: "About this journey step", exact: true });
    await info.focus();
    await page.keyboard.press("Enter");
    const close = page.getByRole("button", { name: "Show journey illustration", exact: true });
    await expect(close).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("region", { name: "Profile explained", exact: true })).toHaveAttribute("aria-hidden", "false");
    await page.keyboard.press("Escape");
    await expect(info).toBeFocused();
    await expect(info).toHaveAttribute("aria-expanded", "false");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await info.click();
    await expect(close).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("group", { name: "Explore the product journey" }).getByRole("button", { name: "Targets", exact: true }).click();
    await expect(info).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("heading", { name: "Understand your daily targets", exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
