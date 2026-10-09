import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";
import { submitCredentialsAndWait } from "./helpers/sign-in";

const privateReads = [
  "/api/profile", "/api/weight-entries", "/api/nutrition-plan",
  "/api/nutrition-plan/history", "/api/progress", "/api/recommendations",
  "/api/report", "/api/report/pdf",
];

async function account(browser: Browser, baseURL: string): Promise<{ context: BrowserContext; page: Page }> {
  const octets = randomBytes(3);
  const context = await browser.newContext({
    baseURL,
    extraHTTPHeaders: { "x-forwarded-for": `10.${octets[0]}.${octets[1]}.${octets[2]}` },
  });
  try {
    const email = `e2e-isolation-${randomUUID()}@example.com`;
    const password = "NutriCareE2E!2026";
    const registered = await context.request.post("/api/auth/register", {
      data: { email, password, name: "Isolation test" },
    });
    expect(registered.status()).toBe(201);
    const page = await context.newPage();
    await page.goto("/login");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await submitCredentialsAndWait(page);
    return { context, page };
  } catch (error) {
    await context.close();
    throw error;
  }
}

test("personal APIs reject anonymous reads and writes", async ({ request, baseURL }) => {
  const headers = { origin: new URL(baseURL!).origin };
  for (const path of privateReads) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required." });
  }
  const writes = [
    () => request.put("/api/profile", { headers, data: {} }),
    () => request.post("/api/weight-entries", { headers, data: {} }),
    () => request.delete("/api/weight-entries/not-owned", { headers }),
    () => request.post("/api/nutrition-plan", { headers }),
    () => request.post("/api/progress/adjustment", { headers, data: {} }),
  ];
  for (const write of writes) expect((await write()).status()).toBe(401);
});

test("two real accounts cannot read or change each other's personal records", async ({ browser, baseURL }) => {
  const contexts: BrowserContext[] = [];
  try {
    const owner = await account(browser, baseURL!);
    contexts.push(owner.context);
    const other = await account(browser, baseURL!);
    contexts.push(other.context);
    const headers = { origin: new URL(baseURL!).origin };
    const ownerApi = owner.context.request;
    const otherApi = other.context.request;
    const profile = { heightCm: 175, age: 30, gender: "male", activity: "moderate", goal: "maintain" };
    expect((await ownerApi.put("/api/profile", { headers, data: profile })).status()).toBe(200);
    const marker = `private-note-${randomUUID()}`;
    const saved = await ownerApi.post("/api/weight-entries", {
      headers, data: { date: "2026-10-01", weightKg: 74, note: marker },
    });
    expect(saved.status()).toBe(201);
    const entry = await saved.json();
    const generated = await ownerApi.post("/api/nutrition-plan", { headers });
    expect(generated.status()).toBe(201);
    const { plan } = await generated.json();
    expect((await ownerApi.post("/api/weight-entries", {
      headers, data: { date: "2026-10-02", weightKg: 74.1 },
    })).status()).toBe(201);
    const ownerProgress = await ownerApi.get("/api/progress");
    expect(ownerProgress.status()).toBe(200);
    expect(ownerProgress.headers()["cache-control"]).toContain("no-store");
    const { progress } = await ownerProgress.json();

    // Client-supplied identities must not override the authenticated owner.
    const ownerSession = await (await ownerApi.get("/api/auth/session")).json();
    const ownerId = ownerSession.user.id;
    for (const path of privateReads.filter((path) => !path.endsWith("/pdf"))) {
      const response = await otherApi.get(`${path}?userId=${encodeURIComponent(ownerId)}`);
      const body = await response.json();
      expect(JSON.stringify(body), path).not.toContain(marker);
      expect(JSON.stringify(body), path).not.toContain(plan.id);
      if (path === "/api/profile") { expect(response.status()).toBe(200); expect(body).toBeNull(); }
      if (path === "/api/weight-entries") { expect(response.status()).toBe(200); expect(body).toEqual([]); }
      if (path === "/api/nutrition-plan/history") expect(body).toEqual({ plans: [] });
      if (path === "/api/report") expect(response.status()).toBe(404);
    }
    expect((await otherApi.get(`/api/report/pdf?userId=${encodeURIComponent(ownerId)}`)).status()).toBe(404);

    // DELETE intentionally returns 204 for absent/non-owned IDs without revealing ownership.
    expect((await otherApi.delete(`/api/weight-entries/${entry.id}`, { headers })).status()).toBe(204);
    for (const decision of ["ACCEPTED", "DECLINED"]) {
      const response = await otherApi.post("/api/progress/adjustment", {
        headers, data: { evaluationId: progress.evaluation.id, decision },
      });
      expect(response.status()).toBe(409);
    }
    const entries = await ownerApi.get("/api/weight-entries");
    expect(entries.headers()["cache-control"]).toContain("private");
    expect(entries.headers()["cache-control"]).toContain("no-store");
    expect(await entries.json()).toEqual(expect.arrayContaining([expect.objectContaining({ id: entry.id, note: marker })]));
    expect(await (await ownerApi.get("/api/progress")).json()).toEqual({ progress });
    const ownerProfile = await ownerApi.get("/api/profile");
    expect(ownerProfile.headers()["cache-control"]).toContain("no-store");
    expect(await ownerProfile.json()).toEqual(profile);

    for (const path of ["/api/profile", "/api/weight-entries", "/api/progress/adjustment"]) {
      const response = await ownerApi.fetch(path, {
        method: path === "/api/profile" ? "PUT" : "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        data: JSON.stringify({ padding: "x".repeat(17 * 1024) }),
      });
      expect(response.status(), path).toBe(413);
    }

    const rejected = await ownerApi.post("/api/weight-entries", {
      headers: { origin: "https://foreign.invalid" },
      data: { date: "2026-10-03", weightKg: 73 },
    });
    expect(rejected.status()).toBe(403);
    expect(await (await ownerApi.get("/api/weight-entries")).json()).toHaveLength(2);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
  }
});

test("public auth JSON endpoints reject oversized requests", async ({ request }) => {
  for (const path of ["/api/auth/register", "/api/auth/forgot-password", "/api/auth/reset-password"]) {
    const response = await request.post(path, {
      headers: { "Content-Type": "application/json", "x-forwarded-for": `10.250.${randomBytes(1)[0]}.1` },
      data: JSON.stringify({ padding: "x".repeat(17 * 1024) }),
    });
    expect(response.status(), path).toBe(413);
  }
});

test("credentials callback rejects oversized form data", async ({ request }) => {
  const response = await request.post("/api/auth/callback/credentials", {
    form: { email: "oversized@example.com", password: "x".repeat(17 * 1024), csrfToken: "invalid" },
  });
  expect(response.status()).toBe(413);
  expect(await response.json()).toEqual({ error: "Request body is too large." });
});

test("credentials callback still rejects a missing CSRF token", async ({ request }) => {
  const email = `e2e-csrf-rejection-${randomUUID()}@example.com`;
  const password = "NutriCareE2E!2026";
  const headers = { "x-forwarded-for": `10.249.${randomBytes(1)[0]}.1` };
  expect((await request.post("/api/auth/register", { headers, data: { email, password } })).status()).toBe(201);
  const response = await request.post("/api/auth/callback/credentials", {
    headers: { ...headers, "X-Auth-Return-Redirect": "1" },
    form: { email, password },
    maxRedirects: 0,
  });
  // Auth.js may report the rejection in a JSON redirect or HTTP Location.
  const destination = response.headers()["location"] ?? (await response.json()).url;
  expect(new URL(destination, "http://localhost:3000").searchParams.get("error")).toBeTruthy();
  const session = await (await request.get("/api/auth/session")).json();
  expect(session?.user).toBeUndefined();
});
