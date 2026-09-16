import { test, expect } from "@playwright/test";

test("user can register, sign in, and save a profile goal", async ({ page }) => {


  const email = `e2e-${Date.now()}@example.com`;
  const password = "NutriCareE2E!2026";

  await page.goto("/register");

  await expect(
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();

  await page.getByLabel("Full name").fill("NutriCare E2E User");
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

  await expect(
    page.getByText("Setup 0% complete", { exact: false }),
  ).toBeVisible();

  await page.goto("/profile");

  await expect(
    page.getByRole("heading", { name: "Your profile" }),
  ).toBeVisible();

  await page.getByLabel("Height (cm)").fill("175");
  await page.getByLabel("Age (years)").fill("30");
  await page.getByLabel("Gender").selectOption("male");
  await page.getByLabel("Your goal").selectOption("lose");
  await page.getByLabel("Activity level").selectOption("moderate");

  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(page.getByText("Saved ✓")).toBeVisible();
  await expect(page.getByText("Goal: Lose weight")).toBeVisible();
});

test("dashboard remains usable when recommendations are unavailable", async ({
  page,
}) => {
  const email = `e2e-dashboard-${Date.now()}@example.com`;
  const password = "NutriCareE2E!2026";

  await page.goto("/register");

  await page.getByLabel("Full name").fill("NutriCare Dashboard User");
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

  await page.route("**/api/recommendations", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Recommendations unavailable" }),
    });
  });

  await page.reload();

  await expect(
    page.getByText("BMI information is temporarily unavailable.", {
      exact: false,
    }),
  ).toBeVisible();

  await expect(
    page.getByText("Setup 0% complete", { exact: false }),
  ).toBeVisible();

  await expect(
    page.getByText("Add your details to get started", {
      exact: false,
    }),
  ).toBeVisible();
});
