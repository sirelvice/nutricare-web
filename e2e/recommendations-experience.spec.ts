import { test, expect, type Page } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import { submitCredentialsAndWait } from "./helpers/sign-in";
import { buildRecommendations } from "../src/lib/reco/engine";

const fixture = {
  context: {
    plan: { id: "plan-1", version: 1, goal: "maintain", createdAt: "2026-10-07T00:00:00.000Z" },
    measurement: { date: "2026-10-07", weightKg: 63.6 },
  },
  bmi: 22, category: { label: "Normal", note: "Within the healthy range." },
  targetCalories: 2200, macros: { proteinG: 138, carbsG: 275, fatG: 61 },
  recommendations: buildRecommendations({ bmi: 22, category: "normal", goal: "maintain" }),
};
async function signIn(page: Page) {
  const octets = randomBytes(3);
  const headers = { "x-forwarded-for": `10.${octets[0]}.${octets[1]}.${octets[2]}` };
  await page.setExtraHTTPHeaders(headers);
  const email = `e2e-guidance-${randomUUID()}@example.com`;
  const password = "NutriCareE2E!2026";
  const response = await page.request.post("/api/auth/register", { headers, data: { email, password, name: "Guidance test" } });
  expect(response.status()).toBe(201);
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await submitCredentialsAndWait(page);
}

for (const width of [375, 1280]) {
  test(`recommendations keep details on demand and fit ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 800 });
    await signIn(page);
    await page.route((url) => url.pathname === "/api/recommendations", (route) => route.fulfill({ json: fixture }));
    await page.goto("/tools/recommendations");
    await expect(page.getByRole("heading", { name: "Next steps", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Top priorities", exact: true })).not.toBeVisible();
    await expect(page.getByText(fixture.recommendations.mealIdeas[0], { exact: true })).not.toBeVisible();
    const mealToggle = page.locator("summary").filter({ hasText: "Meal examples" });
    await mealToggle.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText(fixture.recommendations.mealIdeas[0], { exact: true })).toBeVisible();
    await page.getByText("More about your guidance", { exact: true }).click();
    await expect(page.getByRole("link", { name: "WHO: Healthy diet", exact: true })).toHaveAttribute("href", fixture.recommendations.sources[0].url);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await testInfo.attach(`recommendations-${width}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });
}



for (const code of ["RECOMMENDATIONS_AGE_REQUIRED", "RECOMMENDATIONS_AGE_UNSUPPORTED", "RECOMMENDATIONS_SETUP_REQUIRED"]) {
  test(`recommendations show the appropriate ${code} state`, async ({ page }) => {
    await signIn(page);
    await page.route((url) => url.pathname === "/api/recommendations", (route) => route.fulfill({ status: 422, json: { code, error: "private detail" } }));
    await page.goto("/tools/recommendations");
    const main = page.getByRole("main");
    await expect(main.getByRole("status")).not.toHaveText("Loading your recommendations...");
    await expect(main.getByRole("link", { name: "Review profile", exact: true })).toBeVisible();
    await expect(main.getByText("private detail", { exact: true })).toHaveCount(0);
    await expect(main.getByRole("region", { name: "Your current estimates", exact: true })).toHaveCount(0);
    if (code === "RECOMMENDATIONS_AGE_REQUIRED") await expect(main.getByRole("status")).toContainText("Add a valid age");
    if (code === "RECOMMENDATIONS_AGE_UNSUPPORTED") await expect(main.getByRole("status")).toContainText("aged 20 and over");
    if (code === "RECOMMENDATIONS_SETUP_REQUIRED") await expect(main.getByRole("link", { name: "Record weight", exact: true })).toBeVisible();
  });
}

test("recommendations recover from a service failure without a page reload", async ({ page }) => {
  await signIn(page);
  let available = false;
  await page.route((url) => url.pathname === "/api/recommendations", (route) => available
    ? route.fulfill({ json: fixture }) : route.fulfill({ status: 503, json: { error: "private detail" } }));
  await page.goto("/tools/recommendations");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("temporarily unavailable");
  let navigations = 0;
  page.on("request", (request) => { if (request.isNavigationRequest()) navigations++; });
  available = true;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Next steps", exact: true })).toBeVisible();
  expect(navigations).toBe(0);
});

test("recommendations prioritise goal review without promoting numeric targets", async ({ page }) => {
  await signIn(page);
  const review = { ...fixture, bmi: 17, category: { label: "Underweight", note: "Below the healthy range." },
    recommendations: buildRecommendations({ bmi: 17, category: "underweight", goal: "lose" }),
  };
  await page.route((url) => url.pathname === "/api/recommendations", (route) => route.fulfill({ json: review }));
  await page.goto("/tools/recommendations");
  await expect(page.getByRole("link", { name: "Review your goal", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Your current estimates", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Review your targets", exact: true })).toHaveCount(0);
});

test("recommendations contain malformed successful responses", async ({ page }) => {
  await signIn(page);
  await page.route((url) => url.pathname === "/api/recommendations", (route) => route.fulfill({ json: {} }));
  await page.goto("/tools/recommendations");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("temporarily unavailable");
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
});

const progressFixture = {
  planVersionId: "plan-1",
  evaluation: { id: "evaluation-1", state: "PLATEAU", evaluatedAt: "2026-10-07T00:00:00.000Z", headline: "Your weight has changed very little so far", summary: "Your logged weight stayed the same over 14 days." },
  recommendation: { recommendedAction: "CONSIDER_ADJUSTMENT", adjustmentDecision: "PENDING", message: "Your recent results suggest it may be time to review and adjust your current plan." },
};

test("recommendations show the measurement, plan version and matching progress", async ({ page }) => {
  await signIn(page);
  await page.route((url) => url.pathname === "/api/recommendations", (route) => route.fulfill({ json: fixture }));
  await page.route((url) => url.pathname === "/api/progress", (route) => route.fulfill({ json: { progress: progressFixture } }));
  await page.goto("/tools/recommendations");
  await expect(page.getByText("Plan version 1 · Weight recorded 2026-10-07", { exact: true })).toBeVisible();
  const region = page.getByRole("region", { name: "Progress guidance", exact: true });
  await expect(region.getByText(progressFixture.recommendation.message, { exact: true })).toBeVisible();
  await expect(region.getByRole("link", { name: "Review progress on your dashboard", exact: true })).toHaveAttribute("href", "/dashboard");
  await expect(region.getByRole("button")).toHaveCount(0);
});

test("recommendations never combine another plan's progress with current guidance", async ({ page }) => {
  await signIn(page);
  await page.route((url) => url.pathname === "/api/recommendations", (route) => route.fulfill({ json: fixture }));
  await page.route((url) => url.pathname === "/api/progress", (route) => route.fulfill({ json: { progress: { ...progressFixture, planVersionId: "plan-2" } } }));
  await page.goto("/tools/recommendations");
  const region = page.getByRole("region", { name: "Progress guidance", exact: true });
  await expect(region).toContainText("Your plan changed while guidance was loading.");
  await expect(region.getByText(progressFixture.recommendation.message, { exact: true })).toHaveCount(0);
});

test("recommendations remain usable while optional progress is unavailable", async ({ page }) => {
  await signIn(page);
  await page.route((url) => url.pathname === "/api/recommendations", (route) => route.fulfill({ json: fixture }));
  let available = false;
  await page.route((url) => url.pathname === "/api/progress", (route) => available
    ? route.fulfill({ json: { progress: progressFixture } }) : route.fulfill({ status: 503, json: { error: "private detail" } }));
  await page.goto("/tools/recommendations");
  await expect(page.getByRole("heading", { name: "Next steps", exact: true })).toBeVisible();
  const region = page.getByRole("region", { name: "Progress guidance", exact: true });
  await expect(region).toContainText("Progress is temporarily unavailable.");
  available = true;
  await region.getByRole("button", { name: "Retry progress", exact: true }).click();
  await expect(region.getByText(progressFixture.evaluation.headline, { exact: true })).toBeVisible();
});

test("recommendations offer plan review for inconsistent profile and plan goals", async ({ page }) => {
  await signIn(page);
  await page.route((url) => url.pathname === "/api/recommendations", (route) => route.fulfill({ status: 409, json: { code: "RECOMMENDATIONS_PLAN_REVIEW_REQUIRED", error: "private detail" } }));
  await page.goto("/tools/recommendations");
  await expect(page.getByRole("link", { name: "Review nutrition plan", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Your current estimates", exact: true })).toHaveCount(0);
});
