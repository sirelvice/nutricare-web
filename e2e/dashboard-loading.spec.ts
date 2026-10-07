import { test, expect, type Page } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";

async function signIn(page: Page) {
  const octets = randomBytes(3);
  const headers = {
    "x-forwarded-for": `10.${octets[0]}.${octets[1]}.${octets[2]}`,
  };
  await page.setExtraHTTPHeaders(headers);
  const email = `e2e-dashboard-${randomUUID()}@example.com`;
  const password = "NutriCareE2E!2026";
  const response = await page.request.post("/api/auth/register", {
    headers,
    data: { email, password, name: "Dashboard loading test" },
  });
  expect(response.status()).toBe(201);

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
}

async function mockCore(page: Page) {
  await page.route((url) => url.pathname === "/api/profile", (route) =>
    route.fulfill({ json: null }),
  );
  await page.route((url) => url.pathname === "/api/weight-entries", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route((url) => url.pathname === "/api/nutrition-plan", (route) =>
    route.fulfill({ json: { plan: null } }),
  );
}

test("dashboard core appears while optional sections are still loading", async ({ page }) => {
  await mockCore(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let heldRequests = 0;
  await page.route(
    (url) => ["/api/recommendations", "/api/progress"].includes(url.pathname),
    async (route) => {
      heldRequests += 1;
      await gate;
      const status = new URL(route.request().url()).pathname === "/api/progress" ? 404 : 422;
      await route.fulfill({ status, json: { error: "Setup not ready" } });
    },
  );

  try {
    await signIn(page);
    await expect.poll(() => heldRequests).toBeGreaterThanOrEqual(2);
    await expect(page.getByText("Setup 0% complete")).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Loading progress..." })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Loading recommendations..." })).toBeVisible();
    release();
    await expect(page.getByText("Complete your profile to get personalised recommendations.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Goal progress", exact: true })).toHaveCount(0);
    await expect(page.getByText(/temporarily unavailable/)).toHaveCount(0);
  } finally {
    release();
  }
});

test("dashboard contains optional network failures", async ({ page }) => {
  await mockCore(page);
  await page.route(
    (url) => ["/api/recommendations", "/api/progress"].includes(url.pathname),
    (route) => route.abort("failed"),
  );
  await signIn(page);
  await expect(page.getByText("Setup 0% complete")).toBeVisible();
  await expect(page.getByText("Recommendations are temporarily unavailable. Your other dashboard information is still available.")).toBeVisible();
  await expect(page.getByText("Progress information is temporarily unavailable. Your other dashboard information is still available.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dashboard unavailable" })).toHaveCount(0);
});

test("dashboard retries failed core data without reloading the page", async ({ page }) => {
  await mockCore(page);
  let profileRequests = 0;
  let profileAvailable = false;
  await page.route((url) => url.pathname === "/api/profile", (route) => {
    profileRequests += 1;
    return profileAvailable
      ? route.fulfill({ json: null })
      : route.fulfill({ status: 503, json: { error: "Unavailable" } });
  });
  await page.route((url) => url.pathname === "/api/recommendations", (route) =>
    route.fulfill({ status: 422, json: { error: "Setup not ready" } }),
  );
  await page.route((url) => url.pathname === "/api/progress", (route) =>
    route.fulfill({ status: 404, json: { error: "No evaluation" } }),
  );
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Dashboard unavailable" })).toBeVisible();
  let documentNavigations = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      documentNavigations += 1;
    }
  });
  const requestsBeforeRetry = profileRequests;
  profileAvailable = true;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText("Setup 0% complete")).toBeVisible();
  expect(profileRequests).toBeGreaterThan(requestsBeforeRetry);
  expect(documentNavigations).toBe(0);
});

async function mockReadyDashboard(page: Page, state = "ON_TRACK") {
  await page.route((url) => url.pathname === "/api/profile", (route) => route.fulfill({ json: {
    heightCm: 175, age: 30, gender: "male", activity: "moderate", goal: "lose",
  } }));
  await page.route((url) => url.pathname === "/api/weight-entries", (route) => route.fulfill({ json: [
    { id: "weight-2", date: "2026-10-07", weightKg: 73 },
    { id: "weight-1", date: "2026-10-01", weightKg: 74 },
  ] }));
  await page.route((url) => url.pathname === "/api/nutrition-plan", (route) => route.fulfill({ json: { plan: {
    id: "plan-1", version: 1, targetCalories: 2000, proteinG: 100, carbsG: 250,
    fatG: 67, goal: "lose", createdAt: "2026-10-01T00:00:00Z",
  } } }));
  await page.route((url) => url.pathname === "/api/recommendations", (route) => route.fulfill({ json: {
    bmi: 23.8, category: { label: "Normal", note: "" }, targetCalories: 2000,
    macros: { proteinG: 100, carbsG: 250, fatG: 67 },
    recommendations: { summary: "Guidance from the service.", priorities: [], foodsToFocus: [], foodsToLimit: [], nextSteps: [] },
  } }));
  await page.route((url) => url.pathname === "/api/progress", (route) => route.fulfill({ json: { progress: {
    planVersionId: "plan-1",
    evaluation: { id: "evaluation-1", state, changeKg: -1, entriesCount: 2,
      evaluationDays: 6, evaluatedAt: "2026-10-07T00:00:00Z",
      headline: "Headline from the progress service", summary: "Interpretation from the progress service." },
    recommendation: { recommendedAction: "CONTINUE", reason: "on_track", adjustmentDecision: "PENDING",
      respondedAt: null, message: "Next step from the progress service." },
  } } }));
}

for (const width of [375, 1280]) {
  test(`dashboard guides a returning user and fits ${width}px`, async ({ page }, testInfo) => {
    const chartWarnings: string[] = [];
    page.on("console", (message) => {
      if (message.text().includes("of chart should be greater than 0")) chartWarnings.push(message.text());
    });
    await page.setViewportSize({ width, height: 900 });
    await mockReadyDashboard(page);
    await signIn(page);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(main.getByRole("region", { name: "Record your weight" })
      .getByRole("link", { name: "Log your weight", exact: true })).toBeVisible();
    await expect(main.getByText("Setup 100% complete")).toBeVisible();
    await expect(main.getByRole("heading", { level: 1 })).toHaveText(/Good (morning|afternoon|evening), Dashboard/);
    await expect(main.getByRole("progressbar", { name: "Account setup" })).toHaveCount(0);
    const disclosure = main.getByText("View measurement data", { exact: true });
    await disclosure.focus();
    await page.keyboard.press("Enter");
    const table = main.getByRole("table", { name: "Recent weight measurements" });
    await expect(table).toBeVisible();
    await expect(table.getByRole("rowheader", { name: "1 Oct 2026" })).toBeVisible();
    await expect(table.getByRole("rowheader", { name: "7 Oct 2026" })).toBeVisible();
    const weightChart = main.getByRole("region", { name: "Weight snapshot" }).locator("svg.recharts-surface");
    await expect(weightChart).toBeVisible();
    await expect(weightChart).not.toHaveAttribute("tabindex", "0");
    await expect(main.getByRole("region", { name: "Weight snapshot" })
      .locator('[aria-hidden="true"] [tabindex="0"]')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    const screenshot = testInfo.outputPath(`dashboard-${width}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach(`dashboard-${width}`, { path: screenshot, contentType: "image/png" });
    if (width === 375) {
      const viewport = testInfo.outputPath("dashboard-mobile-viewport.png");
      await page.screenshot({ path: viewport });
      await testInfo.attach("dashboard-mobile-viewport", { path: viewport, contentType: "image/png" });
      const headerBounds = await page.getByRole("banner").boundingBox();
      expect(headerBounds?.y).toBe(0);
    }
    await page.setViewportSize({ width: width === 375 ? 1280 : 375, height: 900 });
    await expect.poll(async () => {
      const bounds = await main.getByRole("region", { name: "Weight snapshot" }).locator("svg.recharts-surface").boundingBox();
      return !!bounds && bounds.width > 100 && bounds.height > 100;
    }).toBe(true);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const targets = main.getByRole("region", { name: "Your daily targets", exact: true });
    const targetSummary = targets.getByText("How these targets are calculated", { exact: true }).locator("..");
    const targetExplanation = targets.getByText("Your plan uses profile details and recorded weight to estimate daily calorie and macro targets.", { exact: true });
    await expect(targetExplanation).not.toBeVisible();
    await targetSummary.focus();
    await page.keyboard.press("Enter");
    await expect(targetExplanation).toBeVisible();
    await expect(targets.getByText("Calories", { exact: true })).toBeVisible();
    await page.keyboard.press("Space");
    await expect(targetExplanation).not.toBeVisible();
    expect(chartWarnings).toEqual([]);
  });
}

for (const [state, label] of [
  ["ON_TRACK", "On track"],
  ["BEHIND_OPPOSITE", "Worth reviewing"],
  ["PLATEAU", "Holding steady"],
  ["INSUFFICIENT_DATA", "Building your baseline"],
]) {
  test(`dashboard uses the service interpretation for ${state}`, async ({ page }) => {
    await mockReadyDashboard(page, state);
    await signIn(page);
    const progress = page.getByRole("region", { name: "Goal progress", exact: true });
    await expect(progress.getByText(label, { exact: true })).toBeVisible();
    await expect(progress.getByRole("heading", { name: "Headline from the progress service" })).toBeVisible();
    await expect(progress.getByText("Interpretation from the progress service.", { exact: true })).toBeVisible();
    await expect(progress.getByText("Next step from the progress service.", { exact: true })).toBeVisible();
  });
}


test("dashboard gives a new user a clear first step on mobile", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await mockCore(page);
  await page.route((url) => url.pathname === "/api/recommendations", (route) =>
    route.fulfill({ status: 422, json: { error: "Setup not ready" } }),
  );
  await page.route((url) => url.pathname === "/api/progress", (route) =>
    route.fulfill({ status: 404, json: { error: "No evaluation" } }),
  );
  await signIn(page);
  const nextStep = page.getByRole("region", { name: "Build your starting point" });
  await expect(nextStep.getByRole("link", { name: "Add your details", exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Account setup" })).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByText("Complete your profile to get personalised recommendations.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Your daily targets" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Weight snapshot" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Getting started" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const screenshot = testInfo.outputPath("dashboard-new-user-375.png");
  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach("dashboard-new-user-375", { path: screenshot, contentType: "image/png" });
});

const refreshedPlan = {
  id: "plan-2", version: 2, targetCalories: 2200, proteinG: 110, carbsG: 275,
  fatG: 73, goal: "lose", createdAt: "2026-10-07T00:00:00Z",
};
const refreshedGuidance = {
  bmi: 23.8, category: { label: "Normal", note: "" }, targetCalories: 2200,
  macros: { proteinG: 110, carbsG: 275, fatG: 73 },
  recommendations: { summary: "Guidance for the refreshed plan.", priorities: [], foodsToFocus: [], foodsToLimit: [], nextSteps: [] },
};

test("dashboard refreshes insights and cancels older reads after plan generation", async ({ page }) => {
  await mockReadyDashboard(page);
  let generated = false;
  let heldRequests = 0;
  let cancelledOldRead = false;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  page.on("requestfailed", (request) => {
    if (generated && new URL(request.url()).pathname === "/api/recommendations") {
      cancelledOldRead = true;
    }
  });
  await page.route((url) => url.pathname === "/api/nutrition-plan", (route) => {
    if (route.request().method() === "POST") {
      generated = true;
      return route.fulfill({ status: 201, json: { plan: refreshedPlan } });
    }
    return route.fulfill({ json: { plan: null } });
  });
  await page.route((url) => url.pathname === "/api/progress", (route) =>
    route.fulfill({ status: 404, json: { error: "No evaluation for this plan" } }),
  );
  await page.route((url) => url.pathname === "/api/recommendations", async (route) => {
    if (generated) {
      await route.fulfill({ json: refreshedGuidance });
      return;
    }
    heldRequests += 1;
    await gate;
    if (route.request().failure()) return;
    await route.fulfill({ json: {
      ...refreshedGuidance,
      recommendations: { ...refreshedGuidance.recommendations, summary: "Outdated guidance." },
    } });
  });

  try {
    await signIn(page);
    await expect.poll(() => heldRequests).toBeGreaterThanOrEqual(1);
    const main = page.getByRole("main");
    let dashboardDocumentReloaded = false;
    page.on("request", (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) dashboardDocumentReloaded = true;
    });
    await main.getByRole("region", { name: "Build your starting point" })
      .getByRole("button", { name: "Generate your nutrition plan", exact: true }).click();
    await expect(main.getByText("Guidance for the refreshed plan.", { exact: true })).toBeVisible();
    await expect.poll(() => cancelledOldRead).toBe(true);
    release();
    await expect(main.getByText("Outdated guidance.", { exact: true })).toHaveCount(0);
    await expect(main.getByRole("status").filter({ hasText: "Your nutrition plan is ready." })).toBeVisible();
    await expect(main.getByRole("region", { name: "Your daily targets" })).toContainText("2200");
    expect(dashboardDocumentReloaded).toBe(false);
  } finally {
    release();
  }
});

test("dashboard clears the old evaluation and preserves feedback after accepting a new plan", async ({ page }) => {
  await mockReadyDashboard(page);
  let accepted = false;
  await page.route((url) => url.pathname === "/api/progress", (route) => {
    if (accepted) return route.fulfill({ status: 404, json: { error: "No evaluation for the new plan" } });
    return route.fulfill({ json: { progress: {
      planVersionId: "plan-1",
      evaluation: { id: "evaluation-1", state: "PLATEAU", changeKg: 0,
        entriesCount: 5, evaluationDays: 28, evaluatedAt: "2026-10-07T00:00:00Z",
        headline: "Evaluation for the previous plan", summary: "Previous plan interpretation." },
      recommendation: { recommendedAction: "CONSIDER_ADJUSTMENT", reason: "consecutive_problem",
        adjustmentDecision: "PENDING", respondedAt: null, message: "Review an adjusted plan." },
    } } });
  });
  await page.route((url) => url.pathname === "/api/recommendations", (route) =>
    route.fulfill({ json: {
      ...refreshedGuidance,
      recommendations: { ...refreshedGuidance.recommendations, summary: accepted ? "Guidance for the refreshed plan." : "Guidance for the previous plan." },
    } }),
  );
  await page.route((url) => url.pathname === "/api/progress/adjustment", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ evaluationId: "evaluation-1", decision: "ACCEPTED" });
    accepted = true;
    await route.fulfill({ json: { evaluationId: "evaluation-1", adjustmentDecision: "ACCEPTED",
      respondedAt: "2026-10-07T00:00:00Z", plan: refreshedPlan } });
  });
  await signIn(page);
  const progress = page.getByRole("region", { name: "Goal progress", exact: true });
  await expect(progress.getByRole("heading", { name: "Evaluation for the previous plan" })).toBeVisible();
  await progress.getByRole("button", { name: "Use adjusted plan", exact: true }).click();
  await expect(page.getByText("Guidance for the refreshed plan.", { exact: true })).toBeVisible();
  await expect(progress.getByText("Keep logging your weight so we can understand how things are changing over time.")).toBeVisible();
  await expect(progress.getByRole("heading", { name: "Evaluation for the previous plan" })).toHaveCount(0);
  await expect(progress.getByRole("status").filter({ hasText: "Your new plan is active (version 2)" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Your daily targets" })).toContainText("2200");
});
