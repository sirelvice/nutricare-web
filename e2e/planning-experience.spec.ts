import { test, expect, type Page } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";

const plan = {
  id: "plan-1", version: 1, goal: "maintain", targetCalories: 2200,
  proteinG: 138, carbsG: 275, fatG: 61, createdAt: "2026-10-07T00:00:00.000Z",
};

async function signIn(page: Page) {
  const octets = randomBytes(3);
  const headers = { "x-forwarded-for": `10.${octets[0]}.${octets[1]}.${octets[2]}` };
  await page.setExtraHTTPHeaders(headers);
  const email = `e2e-planning-${randomUUID()}@example.com`;
  const password = "NutriCareE2E!2026";
  const response = await page.request.post("/api/auth/register", {
    headers, data: { email, password, name: "Planning experience test" },
  });
  expect(response.status()).toBe(201);
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const callbackPromise = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/auth/callback/credentials",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const callback = await callbackPromise;
  const result = await callback.json().catch(() => null) as { url?: string } | null;
  const destination = result?.url ? new URL(result.url) : null;
  expect(callback.status(), "Credentials callback HTTP status").toBeLessThan(400);
  expect(destination?.searchParams.get("error"),
    `Credentials callback error; code=${destination?.searchParams.get("code") ?? "none"}`,
  ).toBeNull();
  await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/);
}

const screens = [
  { path: "/tools/calories", heading: "Calories" },
  { path: "/tools/macros", heading: "Macros" },
];

for (const screen of screens) {
  for (const width of [375, 1280]) {
    test(`${screen.heading} shows readable targets and fits ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await signIn(page);
      await page.route((url) => url.pathname === "/api/nutrition-plan", (route) => route.fulfill({ json: { plan } }));
      await page.goto(screen.path);
      const main = page.getByRole("main");
      await expect(main.getByRole("heading", { level: 1, name: screen.heading, exact: true })).toBeVisible();
      await expect(main.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(main.getByText("Goal: Maintain weight", { exact: true })).toBeVisible();
      await expect(main.getByText("Protein", { exact: true })).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const path = testInfo.outputPath(`planning-${screen.heading.toLowerCase()}-${width}.png`);
      await page.screenshot({ path, fullPage: true });
      await testInfo.attach(`planning-${screen.heading.toLowerCase()}-${width}`, { path, contentType: "image/png" });
    });
  }

  for (const failure of ["http", "malformed"] as const) {
    test(`${screen.heading} retries a ${failure} read failure in place without showing an empty plan`, async ({ page }) => {
      await signIn(page);
      let reads = 0;
      await page.route((url) => url.pathname === "/api/nutrition-plan", (route) => {
        reads += 1;
        if (reads === 1) return failure === "http"
          ? route.fulfill({ status: 500, json: { error: "private server detail" } })
          : route.fulfill({ json: { plan: { ...plan, targetCalories: "invalid" } } });
        return route.fulfill({ json: { plan } });
      });
      await page.goto(screen.path);
      const main = page.getByRole("main");
      await expect(main.getByRole("alert")).toHaveText("Unable to load your nutrition plan. Try again before making changes.");
      await expect(main.getByText("No nutrition plan yet", { exact: true })).toHaveCount(0);
      await expect(main.getByRole("button", { name: /Generate nutrition plan|Recalculate plan/ })).toHaveCount(0);
      await page.evaluate(() => { (window as Window & { planningDocument?: string }).planningDocument = "unchanged"; });
      await main.getByRole("button", { name: "Try again", exact: true }).click();
      await expect(main.getByText("Goal: Maintain weight", { exact: true })).toBeVisible();
      await expect(main.getByRole("alert")).toHaveCount(0);
      expect(await page.evaluate(() => (window as Window & { planningDocument?: string }).planningDocument)).toBe("unchanged");
    });
  }

  test(`${screen.heading} shows setup guidance only for an explicit empty plan`, async ({ page }) => {
    await signIn(page);
    await page.route((url) => url.pathname === "/api/nutrition-plan", (route) => route.fulfill({ json: { plan: null } }));
    await page.goto(screen.path);
    await expect(page.getByRole("main").getByText("No nutrition plan yet", { exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Plan options" }).getByRole("link", { name: "Edit profile", exact: true })).toHaveAttribute("href", "/profile");
  });
}

test("calories blocks repeated activation while a plan write is pending", async ({ page }) => {
  await signIn(page);
  let writes = 0;
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route((url) => url.pathname === "/api/nutrition-plan", async (route) => {
    if (route.request().method() === "POST") {
      writes += 1;
      await held;
      await route.fulfill({ status: 201, json: { plan: { ...plan, version: 2 } } });
    } else await route.fulfill({ json: { plan } });
  });
  await page.goto("/tools/calories");
  const button = page.getByRole("button", { name: "Recalculate plan", exact: true });
  await expect(button).toBeEnabled();
  await button.evaluate((node) => {
    const control = node as HTMLButtonElement;
    control.click();
    control.click();
  });
  try {
    await expect.poll(() => writes).toBe(1);
    await expect(page.getByRole("button", { name: "Updating plan...", exact: true })).toBeDisabled();
  } finally { release(); }
  await expect(page.getByRole("main").getByRole("status")).toHaveText("Nutrition plan saved.");
  await expect(page.getByText("Version 2", { exact: true })).toBeVisible();
  expect(writes).toBe(1);
});

test("calories keeps its saved targets and offers setup actions after a prerequisite failure", async ({ page }) => {
  await signIn(page);
  await page.route((url) => url.pathname === "/api/nutrition-plan", (route) => route.request().method() === "POST"
    ? route.fulfill({ status: 422, json: { error: "private server detail" } })
    : route.fulfill({ json: { plan } }));
  await page.goto("/tools/calories");
  await page.getByRole("button", { name: "Recalculate plan", exact: true }).click();
  const main = page.getByRole("main");
  const alert = main.getByRole("alert");
  await expect(alert).toHaveText("Add your height and age to your profile and record your current weight before generating a plan.");
  await expect(alert.locator("..").getByRole("link", { name: "Record weight", exact: true })).toHaveAttribute("href", "/tools/tracking/weight");
  await expect(main.getByText("2200", { exact: true })).toBeVisible();
  await expect(main.getByRole("button", { name: "Recalculate plan", exact: true })).toBeEnabled();
});

for (const failure of ["conflict", "malformed", "network"] as const) {
  test(`calories requires a current-plan read after a ${failure} write`, async ({ page }) => {
    await signIn(page);
    let writes = 0;
    let reads = 0;
    await page.route((url) => url.pathname === "/api/nutrition-plan", (route) => {
      if (route.request().method() === "POST") {
        writes += 1;
        if (failure === "network") return route.abort("failed");
        return failure === "conflict"
          ? route.fulfill({ status: 409, json: { code: "NUTRITION_PLAN_CONFLICT", error: "private server detail" } })
          : route.fulfill({ status: 201, json: { plan: null } });
      }
      reads += 1;
      return route.fulfill({ json: { plan: { ...plan, version: reads === 1 ? 1 : 2 } } });
    });
    await page.goto("/tools/calories");
    await page.getByRole("button", { name: "Recalculate plan", exact: true }).click();
    const main = page.getByRole("main");
    await expect(main.getByRole("alert")).toHaveText(failure === "conflict"
      ? "Your nutrition plan changed while this request was being processed. Reload your current plan before trying again."
      : "We could not confirm whether your plan was saved. Reload your current plan before trying again.");
    await expect(main.getByRole("button", { name: "Recalculate plan", exact: true })).toBeDisabled();
    expect(writes).toBe(1);
    await main.getByRole("button", { name: "Reload current plan", exact: true }).click();
    await expect(main.getByText("Version 2", { exact: true })).toBeVisible();
    await expect(main.getByRole("button", { name: "Recalculate plan", exact: true })).toBeEnabled();
    await expect(main.getByRole("alert")).toHaveCount(0);
    expect(writes).toBe(1);
  });
}


for (const screen of screens) {
  test(`${screen.heading} reveals supporting detail with the keyboard while targets stay visible`, async ({ page }) => {
    await signIn(page);
    await page.route((url) => url.pathname === "/api/nutrition-plan", (route) => route.fulfill({ json: { plan } }));
    await page.goto(screen.path);
    const main = page.getByRole("main");
    const summary = main.getByText("About these targets", { exact: true }).locator("..");
    const explanation = main.getByText("These targets are estimates based on your current profile and weight.", { exact: true });
    await expect(main.getByText("Protein", { exact: true })).toBeVisible();
    await expect(explanation).not.toBeVisible();
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(explanation).toBeVisible();
    await expect(main.getByText("Protein", { exact: true })).toBeVisible();
    await page.keyboard.press("Space");
    await expect(explanation).not.toBeVisible();
    await expect(summary).toBeFocused();
  });
}
