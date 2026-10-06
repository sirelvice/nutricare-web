import { test, expect } from "@playwright/test";

const screens = [
  { path: "/login", heading: "Welcome back" },
  { path: "/register", heading: "Create your account" },
  { path: "/forgot-password", heading: "Forgot Password?" },
  { path: "/reset-password", heading: "Reset Password" },
];

for (const width of [375, 1280]) {
  for (const screen of screens) {
    test(`${screen.path} has official branding and fits ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(screen.path);

      await expect(
        page.getByRole("heading", { name: screen.heading, exact: true }),
      ).toBeVisible();

      const home = page.getByRole("link", { name: "Go to NutriCare home" });
      await expect(home).toHaveAttribute("href", "/");

      const logo = home.getByRole("img", { name: "NutriCare", exact: true });
      await expect(logo).toBeVisible();
      await expect.poll(() =>
        logo.evaluate((element) => (element as HTMLImageElement).naturalWidth),
      ).toBeGreaterThan(0);

      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth <= window.innerWidth,
      )).toBe(true);

      await home.click();
      await expect(page).toHaveURL(/\/$/);
    });
  }
}

for (const screen of [
  { path: "/login", label: "Password", autocomplete: "current-password" },
  { path: "/register", label: "Password", autocomplete: "new-password" },
  { path: "/reset-password?token=test-token", label: "New password", autocomplete: "new-password" },
]) {
  test(`${screen.path} supports keyboard password visibility`, async ({ page }) => {
    await page.goto(screen.path);
    const input = page.getByLabel(screen.label, { exact: true });
    await expect(input).toBeEnabled();
    await input.fill("NutriCareTest!2026");
    await expect(input).toHaveAttribute("type", "password");
    await expect(input).toHaveAttribute("autocomplete", screen.autocomplete);

    const id = await input.getAttribute("id");
    const controlledToggle = page
      .getByRole("button")
      .and(page.locator(`button[aria-controls="${id}"]`));
    await expect(controlledToggle).toHaveAccessibleName("Reveal characters");

    const bounds = await controlledToggle.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);

    await controlledToggle.focus();
    await page.keyboard.press("Enter");
    await expect(input).toHaveAttribute("type", "text");
    await expect(controlledToggle).toHaveAttribute("aria-pressed", "true");
    await expect(controlledToggle).toHaveAccessibleName("Hide characters");

    await page.keyboard.press("Space");
    await expect(input).toHaveAttribute("type", "password");
    await expect(input).toHaveValue("NutriCareTest!2026");
    await expect(controlledToggle).toHaveAttribute("aria-pressed", "false");
  });
}

test("recovery shows generic feedback and allows another email", async ({ page }) => {
  await page.route("**/api/auth/forgot-password", (route) => route.fulfill({
    status: 200,
    json: {
      ok: true,
      message: "If an account exists for that email, reset instructions will be sent shortly.",
    },
  }));
  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill("user@example.com");
  await page.getByRole("button", { name: "Send reset instructions" }).click();

  const region = page.getByRole("region", { name: "Forgot Password?", exact: true });
  await expect(region.getByRole("status")).toContainText(
    "If an account exists with user@example.com, you will receive password reset instructions shortly.",
  );
  await page.getByRole("button", { name: "Try another email" }).click();
  await expect(page.getByLabel("Email address")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Send reset instructions" })).toBeDisabled();
});

test("reset rejects mismatched passwords without submitting", async ({ page }) => {
  let submissions = 0;
  await page.route("**/api/auth/reset-password", (route) => {
    submissions += 1;
    return route.fulfill({ status: 200, json: { ok: true } });
  });
  await page.goto("/reset-password?token=test-token");
  await page.getByLabel("New password", { exact: true }).fill("NutriCareTest!2026");
  await page.getByLabel("Confirm password", { exact: true }).fill("DifferentTest!2026");
  await page.getByRole("button", { name: "Reset password", exact: true }).click();

  await expect(
    page.getByRole("region", { name: "Reset Password", exact: true }).getByRole("alert"),
  ).toHaveText("Passwords do not match.");
  expect(submissions).toBe(0);
});

test("reset submits the token and clears password controls on success", async ({ page }) => {
  await page.route("**/api/auth/reset-password", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      token: "test-token",
      password: "NutriCareTest!2026",
    });
    await route.fulfill({ status: 200, json: { ok: true } });
  });
  await page.goto("/reset-password?token=test-token");
  await page.getByLabel("New password", { exact: true }).fill("NutriCareTest!2026");
  await page.getByLabel("Confirm password", { exact: true }).fill("NutriCareTest!2026");
  await page.getByRole("button", { name: "Reset password", exact: true }).click();

  await expect(
    page.getByRole("region", { name: "Reset Password", exact: true }).getByRole("status"),
  ).toHaveText("Your password has been reset successfully.");
  await expect(page.getByLabel("New password", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Confirm password", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back to sign in" })).toHaveAttribute("href", "/login");
});

test("login recovers from a failed credentials request", async ({ page }) => {
  let intercepted = false;
  await page.route(
    (url) => url.pathname === "/api/auth/callback/credentials",
    async (route) => {
      intercepted = true;
      await route.abort("failed");
    },
  );
  await page.goto("/login");
  await page.getByLabel("Email address").fill("user@example.com");
  await page.getByLabel("Password", { exact: true }).fill("NutriCareTest!2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(
    page.getByRole("region", { name: "Welcome back", exact: true }).getByRole("alert"),
  ).toHaveText("Unable to sign in right now. Please try again.");
  expect(intercepted).toBe(true);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  await expect(page.getByLabel("Email address")).toBeEnabled();
  await expect(page.getByLabel("Password", { exact: true })).toBeEnabled();
  await expect(page).toHaveURL(/\/login$/);
});
