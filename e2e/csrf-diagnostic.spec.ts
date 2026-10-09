import { expect, test } from "@playwright/test";
import { randomBytes, randomUUID } from "node:crypto";

test("credentials login retains matching CSRF cookie and body", async ({ page }, testInfo) => {
  const octets = randomBytes(3);
  const headers = { "x-forwarded-for": `10.${octets[0]}.${octets[1]}.${octets[2]}` };
  await page.setExtraHTTPHeaders(headers);
  const email = `e2e-csrf-${randomUUID()}@example.com`;
  const password = "NutriCareE2E!2026";
  const registration = await page.request.post("/api/auth/register", {
    headers, data: { email, password, name: "CSRF diagnostic" },
  });
  expect(registration.status()).toBe(201);

  const events: Record<string, unknown>[] = [];
  const started = Date.now();
  const pending: Promise<void>[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (!path.startsWith("/api/auth/")) return;
    const event: Record<string, unknown> = { ms: Date.now() - started, kind: "request", path, method: request.method() };
    if (path.endsWith("/callback/credentials")) {
      const body = new URLSearchParams(request.postData() ?? "");
      const token = body.get("csrfToken");
      // Only booleans are recorded. Never include cookies, tokens or credentials.
      const work = request.allHeaders().then((all) => {
        const cookie = (all.cookie ?? "").split(";").map((part) => part.trim())
          .find((part) => /^(?:__Host-)?authjs\.csrf-token=/.test(part));
        const value = cookie ? decodeURIComponent(cookie.slice(cookie.indexOf("=") + 1)).split("|")[0] : null;
        Object.assign(event, { bodyTokenPresent: Boolean(token), cookiePresent: Boolean(value), tokenMatchesCookie: Boolean(token && value && token === value) });
      });
      pending.push(work);
    }
    events.push(event);
  });
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (!path.startsWith("/api/auth/")) return;
    const event: Record<string, unknown> = { ms: Date.now() - started, kind: "response", path, status: response.status() };
    events.push(event);
    pending.push(response.headersArray().then((all) => {
      event.setsCsrfCookie = all.some((header) => header.name.toLowerCase() === "set-cookie" && /^(?:__Host-)?authjs\.csrf-token=/.test(header.value));
    }));
  });

  try {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    // Wait for the destination, not the callback body: a document navigation can
    // discard Chrome's response-body handle after authentication succeeds.
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/, { timeout: 15_000 });
  } finally {
    await Promise.allSettled(pending);
    await testInfo.attach("auth-request-flags", {
      body: JSON.stringify(events, null, 2), contentType: "application/json",
    });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(testInfo.outputPath("auth-request-flags.json"), JSON.stringify(events, null, 2));
  }
});
