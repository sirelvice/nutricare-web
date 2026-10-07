import { test, expect, type Page } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import { submitCredentialsAndWait } from "./helpers/sign-in";

const profile = { heightCm: 175, age: 30, gender: "male", activity: "moderate", goal: "maintain" };

async function signIn(page: Page) {
  const octets = randomBytes(3);
  const headers = { "x-forwarded-for": `10.${octets[0]}.${octets[1]}.${octets[2]}` };
  await page.setExtraHTTPHeaders(headers);
  const email = `e2e-profile-${randomUUID()}@example.com`;
  const password = "NutriCareE2E!2026";
  const response = await page.request.post("/api/auth/register", {
    headers, data: { email, password, name: "Profile experience test" },
  });
  expect(response.status()).toBe(201);
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await submitCredentialsAndWait(page);
}

for (const width of [375, 1280]) {
  test(`profile has a focused keyboard-accessible form at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    await page.route((url) => url.pathname === "/api/profile", (route) => route.fulfill({ json: null }));
    await page.goto("/profile");
    await expect(page.getByLabel("Height (cm)")).toBeEnabled();
    await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("form", { name: "Profile details" })).toBeVisible();
    await page.getByLabel("Height (cm)").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Age (years)")).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    const path = testInfo.outputPath(`profile-${width}.png`);
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(`profile-${width}`, { path, contentType: "image/png" });
  });
}

test("profile cannot overwrite saved data while its initial read is pending", async ({ page }) => {
  await signIn(page);
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  let writes = 0;
  await page.route((url) => url.pathname === "/api/profile", async (route) => {
    if (route.request().method() === "PUT") {
      writes += 1;
      await route.fulfill({ json: profile });
      return;
    }
    await held;
    await route.fulfill({ json: profile });
  });
  await page.goto("/profile");
  await expect(page.getByText("Loading your profile...", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Height (cm)")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save profile", exact: true })).toBeDisabled();
  expect(writes).toBe(0);
  release();
  await expect(page.getByLabel("Height (cm)")).toBeEnabled();
  await expect(page.getByLabel("Height (cm)")).toHaveValue("175");
  await expect(page.getByLabel("Your goal")).toHaveValue("maintain");
});

for (const failure of ["http", "malformed"] as const) {
  test(`profile blocks editing after a ${failure} read failure and retries in place`, async ({ page }) => {
    await signIn(page);
    let reads = 0;
    let available = false;
    await page.route((url) => url.pathname === "/api/profile", (route) => {
      reads += 1;
      if (!available) {
        return failure === "http"
          ? route.fulfill({ status: 500, json: { error: "Unavailable" } })
          : route.fulfill({ json: { heightCm: "invalid" } });
      }
      return route.fulfill({ json: profile });
    });
    await page.goto("/profile");
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Unable to load your profile. Try again before making changes.");
    await expect(page.getByLabel("Height (cm)")).toBeDisabled();
    await expect(page.getByRole("button", { name: "Save profile", exact: true })).toBeDisabled();
    await page.evaluate(() => { (window as Window & { profileDocument?: string }).profileDocument = "unchanged"; });
    const readsBeforeRetry = reads;
    available = true;
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(page.getByLabel("Height (cm)")).toHaveValue("175");
    await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    expect(reads).toBeGreaterThan(readsBeforeRetry);
    expect(await page.evaluate(() => (window as Window & { profileDocument?: string }).profileDocument)).toBe("unchanged");
  });
}

test("profile keeps invalid text editable and focuses the first field without sending a write", async ({ page }) => {
  await signIn(page);
  let writes = 0;
  await page.route((url) => url.pathname === "/api/profile", (route) => {
    if (route.request().method() === "PUT") writes += 1;
    return route.fulfill({ json: profile });
  });
  await page.goto("/profile");
  await page.getByLabel("Height (cm)").fill("abc");
  await page.getByLabel("Age (years)").fill("30.5");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByLabel("Height (cm)")).toBeFocused();
  await expect(page.getByLabel("Height (cm)")).toHaveValue("abc");
  await expect(page.getByLabel("Height (cm)")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Age (years)")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#height-error")).toBeVisible();
  await expect(page.locator("#age-error")).toBeVisible();
  expect(writes).toBe(0);
});

test("profile retains a failed draft and confirms a successful retry without a transient button label", async ({ page }) => {
  await signIn(page);
  let writes = 0;
  await page.route((url) => url.pathname === "/api/profile", (route) => {
    if (route.request().method() !== "PUT") return route.fulfill({ json: profile });
    writes += 1;
    return writes === 1
      ? route.fulfill({ status: 500, json: { error: "Internal implementation detail" } })
      : route.fulfill({ json: { ...profile, heightCm: 180 } });
  });
  await page.goto("/profile");
  await page.getByLabel("Height (cm)").fill("180");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("We could not save your profile. Your changes are still here. Please try again.");
  await expect(page.getByLabel("Height (cm)")).toHaveValue("180");
  await expect(page.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved." })).toBeVisible();
  await page.waitForTimeout(1700); // Regression: the old success feedback disappeared after 1500 ms.
  await expect(page.getByRole("status").filter({ hasText: "Profile saved." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to dashboard" })).toHaveAttribute("href", "/dashboard");
  await page.getByLabel("Height (cm)").fill("181");
  await expect(page.getByRole("status").filter({ hasText: "Profile saved." })).toHaveCount(0);
  await expect(page.getByText("Unsaved changes", { exact: true })).toBeVisible();
});

test("profile prevents duplicate submissions and edits during a pending save", async ({ page }) => {
  await signIn(page);
  let writes = 0;
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route((url) => url.pathname === "/api/profile", async (route) => {
    if (route.request().method() !== "PUT") return route.fulfill({ json: profile });
    writes += 1;
    await held;
    await route.fulfill({ json: { ...profile, heightCm: 180 } });
  });
  await page.goto("/profile");
  await page.getByLabel("Height (cm)").fill("180");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByLabel("Height (cm)")).toBeDisabled();
  await page.getByRole("form", { name: "Profile details" }).evaluate((element) => {
    const form = element as HTMLFormElement;
    form.requestSubmit();
    form.requestSubmit();
  });
  expect(writes).toBe(1);
  release();
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Height (cm)")).toHaveValue("180");
});

for (const [code, message] of [
  ["GOAL_CHANGE_WEIGHT_REQUIRED", "Record your weight before changing your saved goal. Your profile has not been changed."],
  ["GOAL_CHANGE_PLAN_UNAVAILABLE", "A new plan could not be calculated. Add valid height, age and a recorded weight before changing your saved goal."],
]) {
  test(`profile explains the goal-change prerequisite ${code} and retains the draft`, async ({ page }) => {
    await signIn(page);
    await page.route((url) => url.pathname === "/api/profile", (route) => route.fulfill(
      route.request().method() === "PUT"
        ? { status: 422, json: { code, error: "Private implementation detail" } }
        : { json: profile },
    ));
    await page.goto("/profile");
    await page.getByLabel("Your goal").selectOption("gain");
    await expect(page.getByText("Changing your saved goal creates a new nutrition plan.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Save profile", exact: true }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText(message);
    await expect(page.getByLabel("Your goal")).toHaveValue("gain");
    await expect(page.getByRole("complementary", { name: "About your profile" }))
      .toContainText("Saved goal: Maintain weight.");
    if (code === "GOAL_CHANGE_WEIGHT_REQUIRED") {
      await expect(page.getByRole("link", { name: "Record your weight", exact: true }))
        .toHaveAttribute("href", "/tools/tracking/weight");
    }
  });
}

test("profile requires an explicit reload after a detected goal conflict", async ({ page }) => {
  await signIn(page);
  let reads = 0;
  let writes = 0;
  await page.route((url) => url.pathname === "/api/profile", (route) => {
    if (route.request().method() === "PUT") {
      writes += 1;
      return route.fulfill({ status: 409, json: { code: "GOAL_CHANGE_CONFLICT", error: "Private stale plan detail" } });
    }
    reads += 1;
    return route.fulfill({ json: reads === 1 ? profile : { ...profile, goal: "lose", heightCm: 182 } });
  });
  await page.goto("/profile");
  await page.getByLabel("Your goal").selectOption("gain");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Your goal or nutrition plan changed while this request was being processed. Reload your saved profile before trying again.",
  );
  await expect(page.getByLabel("Your goal")).toHaveValue("gain");
  await expect(page.getByLabel("Your goal")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save profile", exact: true })).toBeDisabled();
  expect(writes).toBe(1);
  await page.getByRole("button", { name: "Reload saved profile", exact: true }).click();
  await expect(page.getByLabel("Your goal")).toBeEnabled();
  await expect(page.getByLabel("Your goal")).toHaveValue("lose");
  await expect(page.getByLabel("Height (cm)")).toHaveValue("182");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});

test("profile returns a real weight prerequisite without changing the persisted goal", async ({ page }) => {
  await signIn(page);
  const initial = await page.request.put("/api/profile", {
    headers: { Origin: "http://localhost:3000" }, data: profile,
  });
  expect(initial.status()).toBe(200);
  await page.goto("/profile");
  await page.getByLabel("Your goal").selectOption("gain");
  const responsePromise = page.waitForResponse((response) =>
    new URL(response.url()).pathname === "/api/profile" && response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(422);
  expect((await response.json()).code).toBe("GOAL_CHANGE_WEIGHT_REQUIRED");
  await expect(page.getByRole("link", { name: "Record your weight", exact: true })).toBeVisible();
  const stored = await page.request.get("/api/profile");
  expect(stored.status()).toBe(200);
  expect((await stored.json()).goal).toBe("maintain");
});

test("profile goal change creates the next persisted plan version", async ({ page }) => {
  await signIn(page);
  const headers = { Origin: "http://localhost:3000" };
  const saved = await page.request.put("/api/profile", { headers, data: profile });
  expect(saved.status()).toBe(200);
  const weight = await page.request.post("/api/weight-entries", {
    headers, data: { date: "2026-10-07", weightKg: 70 },
  });
  expect(weight.status()).toBe(201);
  const generated = await page.request.post("/api/nutrition-plan", { headers });
  expect(generated.status()).toBe(201);
  const oldPlan = (await generated.json()).plan;
  expect(oldPlan.goal).toBe("maintain");
  await page.goto("/profile");
  await page.getByLabel("Your goal").selectOption("gain");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Profile saved." })).toBeVisible();
  const latest = await page.request.get("/api/nutrition-plan");
  expect(latest.status()).toBe(200);
  const newPlan = (await latest.json()).plan;
  expect(newPlan.goal).toBe("gain");
  expect(newPlan.version).toBe(oldPlan.version + 1);
  expect(newPlan.id).not.toBe(oldPlan.id);
  await page.reload();
  await expect(page.getByLabel("Your goal")).toHaveValue("gain");
});


test("profile keeps supporting information behind a keyboard-accessible disclosure", async ({ page }) => {
  await signIn(page);
  await page.route((url) => url.pathname === "/api/profile", (route) => route.fulfill({ json: null }));
  await page.goto("/profile");
  const aside = page.getByRole("complementary", { name: "About your profile" });
  const summary = aside.getByText("How your profile shapes your plan", { exact: true });
  const explanation = aside.getByText("Your details inform your energy estimate. Your goal guides the plan.", { exact: true });
  await expect(explanation).not.toBeVisible();
  await summary.locator("..").focus();
  await page.keyboard.press("Enter");
  await expect(explanation).toBeVisible();
  await page.keyboard.press("Space");
  await expect(explanation).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Save profile", exact: true })).toBeEnabled();
});
