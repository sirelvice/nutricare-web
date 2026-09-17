import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/db";

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


test("user can add and delete a weight entry", async ({ page }) => {
  const email = `e2e-weight-lifecycle-${Date.now()}@example.com`;
  const password = "NutriCareE2E!2026";

  await page.goto("/register");

  await page.getByLabel("Full name").fill("NutriCare Weight User");
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

  await page.goto("/tools/tracking/weight");

  await expect(
    page.getByRole("heading", { name: /weight tracking/i }),
  ).toBeVisible();

  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);
  const entryDate = formatDate(today);

  await page.locator('input[type="date"]').fill(entryDate);
  await page.getByPlaceholder("e.g. 70.5").fill("72.5");
  await page.getByPlaceholder("e.g. after workout").fill("E2E lifecycle");

  const addResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/weight-entries") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Add entry" }).click();

  const addResponse = await addResponsePromise;
  if (addResponse.status() !== 201) {
    throw new Error(
      `Weight creation failed with HTTP ${addResponse.status()}: ${await addResponse.text()}`,
    );
  }

  const createdEntry = await addResponse.json();

  expect(createdEntry.weightKg).toBe(72.5);
  expect(createdEntry.date).toBe(entryDate);
  expect(createdEntry.note).toBe("E2E lifecycle");

  await expect(
    page
      .getByText("Latest weight")
      .locator("..")
      .getByText("72.5 kg", { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(`${entryDate} • E2E lifecycle`, { exact: true }),
  ).toBeVisible();

  const entryRow = page
    .locator("div")
    .filter({
      hasText: "72.5 kg",
    })
    .filter({
      hasText: `${entryDate} • E2E lifecycle`,
    })
    .filter({
      has: page.getByRole("button", { name: "Delete" }),
    })
    .first();

  await expect(entryRow).toBeVisible();

  const deleteResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/weight-entries/${createdEntry.id}`) &&
      response.request().method() === "DELETE",
  );

  await entryRow.getByRole("button", { name: "Delete" }).click();

  const deleteResponse = await deleteResponsePromise;

  if (deleteResponse.status() !== 204) {
    throw new Error(
      `Weight deletion failed with HTTP ${deleteResponse.status()}: ${await deleteResponse.text()}`,
    );
  }

  await expect(
    page.getByText(`${entryDate} • E2E lifecycle`, { exact: true }),
  ).not.toBeVisible();

  await expect(
    page.getByText("Your weight history will appear here", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByText("No entries yet — add your first weight above", {
      exact: true,
    }),
  ).toBeVisible();
});


test("user can calculate and recalculate BMI", async ({ page }) => {
  const email = `e2e-bmi-${Date.now()}@example.com`;
  const password = "NutriCareE2E!2026";

  await page.goto("/register");

  await expect(
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();

  await page.getByLabel("Full name").fill("NutriCare BMI User");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);

  const registerResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/auth/register"),
  );

  await page.getByRole("button", { name: "Create free account" }).click();

  const registerResponse = await registerResponsePromise;
  if (registerResponse.status() != 201) {
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

  await page.goto("/tools/bmi");

  await expect(
    page.getByRole("heading", { name: "BMI Calculator", exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(
      "Enter your height and weight, then click calculate.",
      { exact: true },
    ),
  ).toBeVisible();

  const height = page.locator("#height");
  const weight = page.locator("#weight");

  await height.fill("170");
  await weight.fill("60");

  const calculateButton = page.getByRole("button", {
    name: "Calculate BMI",
    exact: true,
  });

  await expect(calculateButton).toBeEnabled();
  await calculateButton.click();

  await expect(page.getByText("20.8", { exact: true })).toBeVisible();
  await expect(page.getByText("Normal", { exact: true })).toBeVisible();

  await expect(
    page.getByText(
      "BMI is a screening tool and does not capture all health factors. It should not be used as a diagnosis.",
      { exact: true },
    ),
  ).toBeVisible();

  await weight.fill("80");

  await expect(
    page.getByText(
      "Enter your height and weight, then click calculate.",
      { exact: true },
    ),
  ).toBeVisible();

  await calculateButton.click();

  await expect(page.getByText("27.7", { exact: true })).toBeVisible();
  await expect(page.getByText("Overweight", { exact: true })).toBeVisible();
});

test("user can view personalized nutrition recommendations", async ({
  page,
}) => {
  const email = `e2e-recommendations-${Date.now()}@example.com`;
  const password = "NutriCareE2E!2026";

  await page.goto("/register");

  await page.getByLabel("Full name").fill("NutriCare Recommendations User");
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

  await page.goto("/tools/tracking/weight");

  const today = new Date();
  const entryDate = today.toISOString().slice(0, 10);

  await page.locator('input[type="date"]').fill(entryDate);
  await page.getByPlaceholder("e.g. 70.5").fill("70");

  const weightResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/weight-entries") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Add entry" }).click();

  const weightResponse = await weightResponsePromise;

  if (weightResponse.status() !== 201) {
    throw new Error(
      `Weight creation failed with HTTP ${weightResponse.status()}: ${await weightResponse.text()}`,
    );
  }

  await page.goto("/dashboard");

  const planResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/nutrition-plan") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Generate nutrition plan →" }).click();

  const planResponse = await planResponsePromise;

  if (planResponse.status() !== 201) {
    throw new Error(
      `Nutrition plan generation failed with HTTP ${planResponse.status()}: ${await planResponse.text()}`,
    );
  }

  await expect(page.getByText("Your nutrition plan is ready.")).toBeVisible();

  const recommendationsResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/recommendations") &&
      response.request().method() === "GET",
  );

  await page.goto("/tools/recommendations");

  const recommendationsResponse = await recommendationsResponsePromise;

  if (recommendationsResponse.status() !== 200) {
    throw new Error(
      `Recommendations request failed with HTTP ${recommendationsResponse.status()}: ${await recommendationsResponse.text()}`,
    );
  }

  const data = await recommendationsResponse.json();

  expect(data.bmi).toBe(22.9);
  expect(data.category).toBeTruthy();
  expect(data.category.label).toBe("Normal");

  expect(data.targetCalories).toBeGreaterThan(0);

  expect(data.macros).toBeTruthy();
  expect(data.macros.proteinG).toBeGreaterThan(0);
  expect(data.macros.carbsG).toBeGreaterThan(0);
  expect(data.macros.fatG).toBeGreaterThan(0);

  expect(data.recommendations).toBeTruthy();
  expect(data.recommendations.summary).toBeTruthy();
  expect(data.recommendations.priorities.length).toBeGreaterThan(0);
  expect(data.recommendations.foodsToFocus.length).toBeGreaterThan(0);
  expect(data.recommendations.foodsToLimit.length).toBeGreaterThan(0);
  expect(data.recommendations.nextSteps.length).toBeGreaterThan(0);

  await expect(
    page.getByRole("heading", { name: "Recommendations", exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(`BMI: ${data.bmi.toFixed(1)}`, { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(data.category.label, { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(`${data.targetCalories} kcal/day`, { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(`${data.macros.proteinG}g`, { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(`${data.macros.carbsG}g`, { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(`${data.macros.fatG}g`, { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Your recommendations", exact: true }),
  ).toBeVisible();

  await expect(page.getByText(data.recommendations.summary, {
    exact: true,
  })).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Top priorities", exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Next steps", exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Foods to focus", exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Foods to limit", exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(
      "Guidance is informational and not a medical diagnosis.",
      { exact: false },
    ),
  ).toBeVisible();
});

test("user can review weight and nutrition plan history", async ({ page }) => {
  const email = `e2e-history-${Date.now()}@example.com`;
  const password = "NutriCareE2E!2026";

  await page.goto("/register");

  await page.getByLabel("Full name").fill("NutriCare History User");
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

  await page.goto("/tools/tracking/weight");

  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);
  const entryDate = formatDate(today);

  await page.locator('input[type="date"]').fill(entryDate);
  await page.getByPlaceholder("e.g. 70.5").fill("70");
  await page.getByPlaceholder("e.g. after workout").fill("History check");

  const weightResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/weight-entries") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Add entry" }).click();

  const weightResponse = await weightResponsePromise;

  if (weightResponse.status() !== 201) {
    throw new Error(
      `Weight creation failed with HTTP ${weightResponse.status()}: ${await weightResponse.text()}`,
    );
  }

  const weightBody = await weightResponse.json();

  expect(weightBody.weightKg).toBe(70);
  expect(weightBody.date).toBe(entryDate);

  await page.goto("/dashboard");

  const planResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/nutrition-plan") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Generate nutrition plan →" }).click();

  const planResponse = await planResponsePromise;

  if (planResponse.status() !== 201) {
    throw new Error(
      `Nutrition plan generation failed with HTTP ${planResponse.status()}: ${await planResponse.text()}`,
    );
  }

  const planBody = await planResponse.json();

  expect(planBody.plan).toBeTruthy();
  expect(planBody.plan.version).toBeTruthy();
  expect(planBody.plan.targetCalories).toBeTruthy();

  await expect(page.getByText("Your nutrition plan is ready.")).toBeVisible();

  await page.goto("/history");

  await expect(
    page.getByRole("heading", { name: "History", exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Weight" }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Nutrition Plans" }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Weight history", exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(`${entryDate} • History check`, { exact: true }),
  ).toBeVisible();

  const weightHistoryCard = page
    .getByRole("heading", { name: "Weight history", exact: true })
    .locator("..")
    .locator("..");

  await expect(
    weightHistoryCard.getByText("70 kg", { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(/BMI 22\.9 • Normal/, { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Nutrition Plans" }).click();

  await expect(
    page.getByRole("heading", {
      name: "Nutrition plan history",
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByText(
      `Version ${planBody.plan.version} • ${planBody.plan.targetCalories} kcal`,
      { exact: true },
    ),
  ).toBeVisible();

  await expect(
    page.getByText(`Goal: ${planBody.plan.goal}`, { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(
      `P ${planBody.plan.proteinG}g • C ${planBody.plan.carbsG}g • F ${planBody.plan.fatG}g`,
      { exact: true },
    ),
  ).toBeVisible();
});

test("user can generate a nutrition plan, log weight, and observe progress", async ({
  page,
}) => {
  const email = `e2e-progress-${Date.now()}@example.com`;
  const password = "NutriCareE2E!2026";

  await page.goto("/register");

  await page.getByLabel("Full name").fill("NutriCare Progress User");
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

  await page.goto("/tools/tracking/weight");

  await expect(
    page.getByRole("heading", { name: /weight/i }).first(),
  ).toBeVisible();

  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);

  await page.locator('input[type="date"]').fill(
    formatDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)),
  );
  await page.getByPlaceholder("e.g. 70.5").fill("70");

  const firstWeightResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/weight-entries") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Add entry" }).click();

  const firstWeightResponse = await firstWeightResponsePromise;
  if (firstWeightResponse.status() !== 201) {
    throw new Error(
      `First weight entry failed with HTTP ${firstWeightResponse.status()}: ${await firstWeightResponse.text()}`,
    );
  }

  await expect(
    page
      .getByText("Latest weight")
      .locator("..")
      .getByText("70 kg", { exact: true }),
  ).toBeVisible();

  await page.goto("/dashboard");

  await expect(
    page.getByRole("button", { name: "Generate nutrition plan →" }),
  ).toBeVisible();

  const planResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/nutrition-plan") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Generate nutrition plan →" }).click();

  const planResponse = await planResponsePromise;
  if (planResponse.status() !== 201) {
    throw new Error(
      `Nutrition plan generation failed with HTTP ${planResponse.status()}: ${await planResponse.text()}`,
    );
  }

  await expect(page.getByText("Your nutrition plan is ready.")).toBeVisible();

  await page.goto("/tools/tracking/weight");

  await page.locator('input[type="date"]').fill(formatDate(today));
  await page.getByPlaceholder("e.g. 70.5").fill("69.4");

  const progressWeightResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/weight-entries") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Add entry" }).click();

  const progressWeightResponse = await progressWeightResponsePromise;
  if (progressWeightResponse.status() !== 201) {
    throw new Error(
      `Progress weight entry failed with HTTP ${progressWeightResponse.status()}: ${await progressWeightResponse.text()}`,
    );
  }

  await expect(
    page
      .getByText("Latest weight")
      .locator("..")
      .getByText("69.4 kg", { exact: true }),
  ).toBeVisible();

  const progressResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/progress") &&
      response.request().method() === "GET",
  );

  await page.goto("/dashboard");

  const progressResponse = await progressResponsePromise;
  const progressBody = await progressResponse.json();

  expect(progressBody.progress.evaluation.state).toBe("INSUFFICIENT_DATA");
  expect(progressBody.progress.evaluation.entriesCount).toBe(1);
  expect(progressBody.progress.recommendation.recommendedAction).toBe(
    "CONTINUE",
  );

  await expect(
    page.getByText("Goal Progress", { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(
      "We need a little more history to understand your progress",
      { exact: false },
    ),
  ).toBeVisible();
});


test("user can decline a progress adjustment and keep the current plan", async ({
  page,
}) => {
  const email = `e2e-adjustment-decline-${Date.now()}@example.com`;
  const password = "NutriCareE2E!2026";

  await page.goto("/register");

  await page.getByLabel("Full name").fill("NutriCare Adjustment Decline User");
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

  await page.goto("/tools/tracking/weight");

  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);

  await page.locator('input[type="date"]').fill(
    formatDate(new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000)),
  );
  await page.getByPlaceholder("e.g. 70.5").fill("70");

  const weightResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/weight-entries") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Add entry" }).click();

  const weightResponse = await weightResponsePromise;
  if (weightResponse.status() !== 201) {
    throw new Error(
      `Weight entry failed with HTTP ${weightResponse.status()}: ${await weightResponse.text()}`,
    );
  }

  await page.goto("/dashboard");

  await expect(
    page.getByRole("button", { name: "Generate nutrition plan →" }),
  ).toBeVisible();

  const planResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/nutrition-plan") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Generate nutrition plan →" }).click();

  const planResponse = await planResponsePromise;
  if (planResponse.status() !== 201) {
    throw new Error(
      `Nutrition plan generation failed with HTTP ${planResponse.status()}: ${await planResponse.text()}`,
    );
  }

  await expect(page.getByText("Your nutrition plan is ready.")).toBeVisible();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    throw new Error("E2E user was not found after registration.");
  }

  const currentPlan = await prisma.nutritionPlan.findFirst({
    where: { userId: user.id },
    orderBy: { version: "desc" },
  });

  if (!currentPlan) {
    throw new Error("E2E nutrition plan was not found after generation.");
  }

  const evaluation = await prisma.progressEvaluation.create({
    data: {
      userId: user.id,
      planVersionId: currentPlan.id,
      state: "PLATEAU",
      changeKg: 0.1,
      entriesCount: 5,
      evaluationDays: 28,
      recommendedAction: "CONSIDER_ADJUSTMENT",
      recommendationReason: "CONSECUTIVE_PROBLEM",
      adjustmentDecision: "PENDING",
      evaluatedAt: new Date(),
    },
  });

  const progressResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/progress") &&
      response.request().method() === "GET",
  );

  await page.reload();

  const progressResponse = await progressResponsePromise;
  if (progressResponse.status() !== 200) {
    throw new Error(
      `Progress request failed with HTTP ${progressResponse.status()}: ${await progressResponse.text()}`,
    );
  }

  const progressBody = await progressResponse.json();

  expect(progressBody.progress.evaluation.id).toBe(evaluation.id);
  expect(progressBody.progress.recommendation.recommendedAction).toBe(
    "CONSIDER_ADJUSTMENT",
  );
  expect(progressBody.progress.recommendation.adjustmentDecision).toBe("PENDING");

  await expect(
    page.getByRole("button", { name: "Keep current plan" }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Use adjusted plan" }),
  ).toBeVisible();

  const adjustmentResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/progress/adjustment") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Keep current plan" }).click();

  const adjustmentResponse = await adjustmentResponsePromise;
  if (adjustmentResponse.status() !== 200) {
    throw new Error(
      `Adjustment decline failed with HTTP ${adjustmentResponse.status()}: ${await adjustmentResponse.text()}`,
    );
  }

  const adjustmentBody = await adjustmentResponse.json();

  expect(adjustmentBody.evaluationId).toBe(evaluation.id);
  expect(adjustmentBody.adjustmentDecision).toBe("DECLINED");
  expect(adjustmentBody.respondedAt).toBeTruthy();

  await expect(
    page.getByRole("status").filter({ hasText: "current plan" }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Keep current plan" }),
  ).not.toBeVisible();

  await expect(
    page.getByRole("button", { name: "Use adjusted plan" }),
  ).not.toBeVisible();

  const immutableResponse = await page.evaluate(
    async (evaluationId) => {
      const response = await fetch("/api/progress/adjustment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evaluationId,
          decision: "ACCEPTED",
        }),
      });

      return {
        status: response.status,
        body: await response.json(),
      };
    },
    evaluation.id,
  );

  expect(immutableResponse.status).toBe(409);
  expect(immutableResponse.body.error).toBe(
    "Adjustment decision has already been recorded",
  );

  const unchangedPlan = await prisma.nutritionPlan.findFirst({
    where: { userId: user.id },
    orderBy: { version: "desc" },
  });

  expect(unchangedPlan?.id).toBe(currentPlan.id);
  expect(unchangedPlan?.version).toBe(currentPlan.version);
});

test("user can accept a progress adjustment and see the new plan version in history", async ({
  page,
}) => {
  const email = `e2e-adjustment-${Date.now()}@example.com`;
  const password = "NutriCareE2E!2026";

  await page.goto("/register");

  await page.getByLabel("Full name").fill("NutriCare Adjustment User");
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

  await page.goto("/tools/tracking/weight");

  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);

  await page.locator('input[type="date"]').fill(
    formatDate(new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000)),
  );
  await page.getByPlaceholder("e.g. 70.5").fill("70");

  const weightResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/weight-entries") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Add entry" }).click();

  const weightResponse = await weightResponsePromise;
  if (weightResponse.status() !== 201) {
    throw new Error(
      `Weight entry failed with HTTP ${weightResponse.status()}: ${await weightResponse.text()}`,
    );
  }

  await page.goto("/dashboard");

  await expect(
    page.getByRole("button", { name: "Generate nutrition plan →" }),
  ).toBeVisible();

  const planResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/nutrition-plan") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Generate nutrition plan →" }).click();

  const planResponse = await planResponsePromise;
  if (planResponse.status() !== 201) {
    throw new Error(
      `Nutrition plan generation failed with HTTP ${planResponse.status()}: ${await planResponse.text()}`,
    );
  }

  await expect(page.getByText("Your nutrition plan is ready.")).toBeVisible();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    throw new Error("E2E user was not found after registration.");
  }

  const currentPlan = await prisma.nutritionPlan.findFirst({
    where: { userId: user.id },
    orderBy: { version: "desc" },
  });

  if (!currentPlan) {
    throw new Error("E2E nutrition plan was not found after generation.");
  }

  const evaluation = await prisma.progressEvaluation.create({
    data: {
      userId: user.id,
      planVersionId: currentPlan.id,
      state: "PLATEAU",
      changeKg: 0.1,
      entriesCount: 5,
      evaluationDays: 28,
      recommendedAction: "CONSIDER_ADJUSTMENT",
      recommendationReason: "CONSECUTIVE_PROBLEM",
      adjustmentDecision: "PENDING",
      evaluatedAt: new Date(),
    },
  });

  const progressResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/progress") &&
      response.request().method() === "GET",
  );

  await page.reload();

  const progressResponse = await progressResponsePromise;
  if (progressResponse.status() !== 200) {
    throw new Error(
      `Progress request failed with HTTP ${progressResponse.status()}: ${await progressResponse.text()}`,
    );
  }

  const progressBody = await progressResponse.json();

  expect(progressBody.progress.evaluation.id).toBe(evaluation.id);
  expect(progressBody.progress.recommendation.recommendedAction).toBe(
    "CONSIDER_ADJUSTMENT",
  );
  expect(progressBody.progress.recommendation.adjustmentDecision).toBe(
    "PENDING",
  );

  await expect(
    page.getByRole("button", { name: "Use adjusted plan" }),
  ).toBeVisible();

  const adjustmentResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/progress/adjustment") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Use adjusted plan" }).click();

  const adjustmentResponse = await adjustmentResponsePromise;
  if (adjustmentResponse.status() !== 200) {
    throw new Error(
      `Adjustment failed with HTTP ${adjustmentResponse.status()}: ${await adjustmentResponse.text()}`,
    );
  }

  const adjustmentBody = await adjustmentResponse.json();

  expect(adjustmentBody.evaluationId).toBe(evaluation.id);
  expect(adjustmentBody.adjustmentDecision).toBe("ACCEPTED");
  expect(adjustmentBody.plan).toBeTruthy();
  expect(adjustmentBody.plan.version).toBe(currentPlan.version + 1);

  await expect(
    page.getByRole("status").filter({ hasText: "new plan" }),
  ).toBeVisible();

  await page.goto("/history");

  await expect(
    page.getByRole("heading", { name: "History", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Nutrition Plans" }).click();

  await expect(
    page.getByText(
      `Version ${currentPlan.version + 1} • ${adjustmentBody.plan.targetCalories} kcal`,
      { exact: true },
    ),
  ).toBeVisible();

  await expect(
    page.getByText(
      `Version ${currentPlan.version} • ${currentPlan.targetCalories} kcal`,
      { exact: true },
    ),
  ).toBeVisible();
});
