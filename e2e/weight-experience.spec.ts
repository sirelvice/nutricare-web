import { test, expect, type Page } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import { submitCredentialsAndWait } from "./helpers/sign-in";

async function signIn(page: Page) {
  const octets = randomBytes(3);
  const headers = { "x-forwarded-for": `10.${octets[0]}.${octets[1]}.${octets[2]}` };
  await page.setExtraHTTPHeaders(headers);
  const email = `e2e-weight-${randomUUID()}@example.com`;
  const password = "NutriCareE2E!2026";
  const response = await page.request.post("/api/auth/register", { headers, data: { email, password, name: "Weight test" } });
  expect(response.status()).toBe(201);
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await submitCredentialsAndWait(page);
}

const entry = { id: "weight-1", date: "2026-10-07", weightKg: 72.5, note: "Morning measurement" };
const history = (page: Page) => page.getByRole("list", { name: "Weight entries", exact: true });
async function fillEntry(page: Page) {
  await page.getByLabel("Date", { exact: true }).fill(entry.date);
  await page.getByLabel("Weight (kg)", { exact: true }).fill(String(entry.weightKg));
  await page.getByLabel("Note (optional)").fill(entry.note);
}

for (const width of [375, 1280]) {
  test(`weight tracking is readable and supports keyboard entry at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 800 });
    await signIn(page);
    let posts = 0;
    await page.route((url) => url.pathname === "/api/weight-entries", (route) => {
      if (route.request().method() === "POST") { posts++; return route.fulfill({ status: 201, json: entry }); }
      return route.fulfill({ json: [] });
    });
    await page.goto("/tools/tracking/weight");
    await expect(page.getByRole("button", { name: "Add entry", exact: true })).toBeEnabled();
    await fillEntry(page);
    await page.getByLabel("Weight (kg)", { exact: true }).press("Enter");
    await expect(page.getByRole("status")).toHaveText("Weight saved.");
    await expect(history(page).getByText("72.5 kg", { exact: false })).toBeVisible();
    expect(posts).toBe(1);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await testInfo.attach(`weight-${width}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });
}

test("weight tracking retries a failed history load without claiming it is empty", async ({ page }) => {
  await signIn(page);
  let available = false;
  await page.route((url) => url.pathname === "/api/weight-entries", (route) => available
    ? route.fulfill({ json: [entry] }) : route.fulfill({ status: 503, json: { error: "private storage detail" } }));
  await page.goto("/tools/tracking/weight");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Unable to load your weight history.");
  await expect(page.getByText("No weight entries yet", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add entry", exact: true })).toBeDisabled();
  available = true;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(history(page).getByText(entry.note, { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add entry", exact: true })).toBeEnabled();
});

test("weight tracking shows a saved measurement when progress is unavailable", async ({ page }) => {
  await signIn(page);
  let posts = 0;
  await page.route((url) => url.pathname === "/api/weight-entries", (route) => {
    if (route.request().method() === "POST") {
      posts++;
      return route.fulfill({ status: 201, json: entry, headers: { "X-NutriCare-Progress-Status": "unavailable" } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/tools/tracking/weight");
  await expect(page.getByRole("button", { name: "Add entry", exact: true })).toBeEnabled();
  await fillEntry(page);
  await page.getByRole("button", { name: "Add entry", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Weight saved. Progress is temporarily unavailable. You do not need to save this entry again.");
  await expect(history(page).getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  expect(posts).toBe(1);
});

test("weight tracking requires a history check after a lost save response", async ({ page }) => {
  await signIn(page);
  let posts = 0;
  await page.route((url) => url.pathname === "/api/weight-entries", (route) => {
    if (route.request().method() === "POST") { posts++; return route.abort("failed"); }
    return route.fulfill({ json: posts ? [entry] : [] });
  });
  await page.goto("/tools/tracking/weight");
  await expect(page.getByRole("button", { name: "Add entry", exact: true })).toBeEnabled();
  await fillEntry(page);
  await page.getByRole("button", { name: "Add entry", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("We could not confirm the save.");
  await expect(page.getByRole("button", { name: "Add entry", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Start another entry", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Check history", exact: true }).click();
  await expect(history(page).getByRole("listitem")).toHaveCount(1);
  await page.getByRole("button", { name: "Start another entry", exact: true }).click();
  await expect(page.getByLabel("Weight (kg)", { exact: true })).toHaveValue("");
  expect(posts).toBe(1);
});

test("weight tracking contains malformed history responses", async ({ page }) => {
  await signIn(page);
  await page.route((url) => url.pathname === "/api/weight-entries", (route) => route.fulfill({ json: [{}] }));
  await page.goto("/tools/tracking/weight");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Unable to load your weight history.");
  await expect(page.getByRole("button", { name: "Add entry", exact: true })).toBeDisabled();
});

test("weight tracking retains an entry when deletion cannot be confirmed", async ({ page }) => {
  await signIn(page);
  await page.route((url) => url.pathname === "/api/weight-entries", (route) => route.fulfill({ json: [entry] }));
  await page.route((url) => url.pathname === "/api/weight-entries/weight-1", (route) => route.fulfill({ status: 500, json: { error: "private delete detail" } }));
  await page.goto("/tools/tracking/weight");
  await history(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("We could not confirm the deletion. Refresh your history to check the entry.");
  await expect(history(page).getByRole("listitem")).toHaveCount(1);
});

test("weight tracking rejects ambiguous numeric input without sending a write", async ({ page }) => {
  await signIn(page);
  let posts = 0;
  await page.route((url) => url.pathname === "/api/weight-entries", (route) => {
    if (route.request().method() === "POST") posts++;
    return route.fulfill({ json: [] });
  });
  await page.goto("/tools/tracking/weight");
  await expect(page.getByRole("button", { name: "Add entry", exact: true })).toBeEnabled();
  await page.getByLabel("Weight (kg)", { exact: true }).fill("7e1");
  await page.getByRole("button", { name: "Add entry", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Enter a valid date");
  await expect(page.getByLabel("Weight (kg)", { exact: true })).toBeFocused();
  expect(posts).toBe(0);
});


test("weight tracking sends one write for repeated submissions while saving", async ({ page }) => {
  await signIn(page);
  let posts = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route((url) => url.pathname === "/api/weight-entries", async (route) => {
    if (route.request().method() === "POST") {
      posts++;
      await gate;
      await route.fulfill({ status: 201, json: entry });
    } else await route.fulfill({ json: [] });
  });
  try {
    await page.goto("/tools/tracking/weight");
    await expect(page.getByRole("button", { name: "Add entry", exact: true })).toBeEnabled();
    await fillEntry(page);
    await page.locator("form").evaluate((form: HTMLFormElement) => {
      form.requestSubmit();
      form.requestSubmit();
    });
    await expect(page.getByRole("button", { name: "Adding entry...", exact: true })).toBeDisabled();
    await expect.poll(() => posts).toBe(1);
    release();
    await expect(page.getByRole("status")).toHaveText("Weight saved.");
    expect(posts).toBe(1);
  } finally { release(); }
});
