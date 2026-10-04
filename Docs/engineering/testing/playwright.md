# Playwright End-to-End Testing

## Purpose

NutriCare uses Playwright for browser-level end-to-end testing of critical
user journeys.

Playwright verifies the product from the user's perspective by exercising the
real Next.js application in a real browser rather than testing individual
functions or API handlers in isolation.

## Testing Boundary

NutriCare uses different testing layers for different responsibilities:

- **Vitest** — domain logic, services, API handlers, repository behavior, and
  database integration tests.
- **Playwright** — real browser journeys that cross the UI, authentication,
  API, application services, repositories, and PostgreSQL.

Playwright should validate observable product behavior rather than internal
implementation details.

## Initial Scope

E2E coverage is being introduced incrementally around the core product
journey.

### Phase 1

**Register → authenticate → complete profile/goal**

This establishes the browser, authentication, session, navigation, and profile
persistence path.

### Phase 2

**Generate nutrition plan → log weight → observe progress**

This extends the authenticated journey into the core nutrition and tracking
workflow.

### Phase 3

**Receive adjustment recommendation → accept or decline → verify plan
version/history behavior**

This covers the plan-adjustment lifecycle and versioned history.

The E2E suite should grow around critical business journeys rather than trying
to reproduce every unit or integration test through the browser.

## Test Data

E2E tests should create their own test data and avoid depending on manually
prepared user accounts.

Tests must not use real user data or credentials.

Test accounts should use unique identifiers so repeated local and CI runs do
not collide with previous executions.

## Locator Strategy

Prefer stable, user-facing selectors:

- accessible roles
- accessible labels
- visible text where appropriate
- explicit test IDs only when a stable semantic locator is not practical

Avoid selectors coupled to Tailwind classes, DOM nesting, generated class names,
or other implementation details.

## Environment

Playwright runs the local Next.js application through the project's configured
web server.

The initial browser target is Chromium.

Cross-browser coverage can be added later once the core journey is stable and
reliable.

## Failure Diagnostics

The Playwright configuration retains useful diagnostics for failures:

- screenshots on failure
- video when a test fails
- traces on retry

Generated Playwright reports and other local test artifacts are not committed
to Git.

## Reliability

E2E tests should be deterministic and independent.

Avoid arbitrary sleeps. Prefer Playwright's locator and assertion waiting
behavior and explicit application-state conditions.

A failing E2E test should first be treated as evidence of one of three things:

1. a product defect,
2. a test defect, or
3. an environment/infrastructure failure.

The failure should be classified before changing the test or application.

## CI

The E2E suite is intended to run as a distinct test stage from the Vitest
suite.

CI runs should use a clean test environment and should not depend on an
individual developer's running application or browser profile.

## Engineering Principle

The E2E suite exists to protect NutriCare's most important user journeys.

It should therefore remain small, meaningful, and business-oriented rather
than becoming a second implementation-level test suite.
