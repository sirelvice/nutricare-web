import { expect, test, type Page } from "@playwright/test";

const password = "NutriCareE2E!2026";

async function registerAndSignIn(page: Page) {
  const email = `e2e-shell-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@example.com`;

  await page.goto("/register");

  await page.getByLabel("Full name").fill("NutriCare Shell User");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);

  const registerResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/auth/register"),
  );

  await page.getByRole("button", { name: "Create free account" }).click();

  const registerResponse = await registerResponsePromise;

  if (registerResponse.status() !== 201) {
    throw new Error(
      `Registration failed with HTTP ${registerResponse.status()}: ${await registerResponse.text()}`,
    );
  }

  await expect(
    page.getByText("Account created successfully. You can now sign in."),
  ).toBeVisible();

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
}

test.beforeEach(async ({ page }, testInfo) => {
  let hash = 0;

  for (const character of testInfo.testId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  const octet2 = (hash >>> 16) & 255;
  const octet3 = (hash >>> 8) & 255;
  const runOctet = Math.floor(Date.now() / 1000) % 250;

  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `10.${octet2}.${octet3}.${runOctet}`,
  });
});

test("desktop workspace can collapse and remembers the preference", async ({
  page,
}) => {
  await registerAndSignIn(page);

  const workspaceNavigation = page.getByRole("navigation", {
    name: "NutriCare workspace",
  });

  await expect(workspaceNavigation).toBeVisible();
  await expect(
    workspaceNavigation.getByRole("link", { name: "Dashboard" }),
  ).toHaveAttribute("aria-current", "page");

  const collapseButton = page.getByRole("button", {
    name: "Collapse NutriCare navigation",
  });

  await expect(collapseButton).toBeVisible();
  await collapseButton.click();

  await expect(
    page.getByRole("button", { name: "Expand NutriCare navigation" }),
  ).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() =>
        window.localStorage.getItem("nutricare-sidebar-collapsed"),
      ),
    )
    .toBe("true");

  await workspaceNavigation
    .getByRole("link", { name: "Profile & goal" })
    .click();

  await expect(page).toHaveURL(/\/profile/);

  await expect(
    page.getByRole("button", { name: "Expand NutriCare navigation" }),
  ).toBeVisible();

  await page.reload();

  await expect(
    page.getByRole("button", { name: "Expand NutriCare navigation" }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Expand NutriCare navigation" })
    .click();

  await expect(
    page.getByRole("button", { name: "Collapse NutriCare navigation" }),
  ).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() =>
        window.localStorage.getItem("nutricare-sidebar-collapsed"),
      ),
    )
    .toBe("false");
});

test("desktop workspace exposes the public site and sign out", async ({
  page,
}) => {
  await registerAndSignIn(page);

  await expect(
    page.getByRole("link", { name: "NutriCare home" }),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Main site", exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Sign out" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL("/");
});

test("mobile workspace uses the drawer navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await registerAndSignIn(page);

  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Collapse NutriCare navigation" }),
  ).toBeHidden();

  await page.getByRole("button", { name: "Open navigation" }).click();

  const drawer = page.locator("#mobile-workspace-navigation");

  await expect(drawer).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);

  await expect(
    drawer.getByRole("link", { name: /NutriCare Shell User.*Account/ }),
  ).toBeVisible();

  await expect(
    drawer.getByRole("link", { name: "Dashboard" }),
  ).toBeVisible();

  await expect(
    drawer.getByRole("button", { name: "Sign out" }),
  ).toBeVisible();

  await drawer.getByRole("link", { name: "Profile & goal" }).click();

  await expect(page).toHaveURL(/\/profile/);

  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
});

test("workspace renders one content tree and preserves form state across resizing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await registerAndSignIn(page);
  await page.goto("/tools/bmi");

  await expect(page.getByRole("heading", { name: "BMI Calculator", exact: true })).toBeVisible();
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("#height")).toHaveCount(1);
  await expect(page.locator("#weight")).toHaveCount(1);

  await page.locator("#height").fill("170");
  await page.locator("#weight").fill("60");

  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator("#height")).toHaveCount(1);
    await expect(page.locator("#weight")).toHaveCount(1);
    await expect(page.locator("#height")).toBeVisible();
    await expect(page.locator("#height")).toHaveValue("170");
    await expect(page.locator("#weight")).toHaveValue("60");
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }

  await page.getByRole("button", { name: "Calculate BMI", exact: true }).click();
  await expect(page.getByText("20.8", { exact: true })).toBeVisible();

  await page.goto("/tools/tracking/weight");
  await expect(page.locator("#weight-date")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#weight-date")).toHaveCount(1);
  await expect(page.locator("#weight-date")).toBeVisible();
});
