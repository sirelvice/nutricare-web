# V3 Slice 2 checkpoint

Date: 2026-10-07 (Africa/Nairobi)
Branch: `refactor/v3-auth`
Integration target: `refactor/premium-ux`
Status: local code review and automated verification complete; commit, push, and integration PR are the next delivery steps.

## Implemented security changes

- Login destination validation rejects external URLs, protocol-relative paths, backslashes, and control characters. A shared validator checks URL origin while preserving internal paths, queries, and fragments.

- Existing and newly created registration accounts receive identical HTTP 201 acceptance bodies.
- A confirmed concurrent email uniqueness conflict receives the same acceptance response. Other database failures retain a generic error.
- Forgot-password provider delivery failures receive the same HTTP 200 acceptance response as unknown accounts.
- Delivery failure logging and exact-token cleanup are preserved. Cleanup failures are logged without exposing account existence through the response.
- Application URL validation occurs before account lookup or token creation. Unconfigured email service handling remains account-independent.

These fixes narrow specific disclosure paths. They do not establish immunity from attacks or eliminate all timing and database-failure disclosure paths.

## Shared auth experience

Login, registration, forgot-password, and reset-password use shared branding, shell, feedback, and password-field components. Focused E2E coverage checks responsive layout, logo loading, keyboard visibility toggling, recovery states, reset validation, and failed login request recovery.

## Evidence-based Slice 1 correction

AppShell previously mounted page children twice behind desktop/mobile visibility classes. It now mounts one content tree. Regression coverage verifies unique form controls and retained values across resizing. Workspace labels are paragraphs so they do not duplicate page headings.

## Verification observed in terminal output

- After the final redirect fix, `npm test -- src/lib/security/login-redirect.test.ts`: 14 tests passed.
- After that fix, the 15-test auth-experience E2E suite, typecheck, lint, and diff check passed again.
- The earlier full-suite totals below precede the redirect fix; no additional full-suite run is claimed.

- `npm test`: 61 files, 339 tests passed.
- `npm test -- src/app/api/auth/register/route.test.ts src/app/api/auth/forgot-password/route.test.ts`: 18 tests passed.
- `npm run test:e2e -- e2e/auth-experience.spec.ts --reporter=line`: 15 tests passed.
- Final `npm run test:e2e -- --reporter=line`: 35 tests passed.
- Final `npx tsc --noEmit`, `npm run lint`, and `git diff --check`: passed.
- `npm run build`: succeeded after the single-content-tree change, with the tracing warning described below. The subsequent shell heading correction passed typecheck, lint, and full E2E.
- No Prisma schema change, migration, or backfill is required.
- Manual screen-reader and contrast review is not claimed complete.

## Preserved existing guarantees

Prior review confirmed tested authVersion session invalidation and hashed, expiring, single-use reset tokens with transactional claims. Existing rate limiting remains. These protections were preserved rather than redesigned.

## Outstanding investigations

- Registration has account-dependent timing because existing accounts bypass password hashing and insertion. Measure before selecting a mitigation; consider CPU and denial-of-service costs.
- Forgot-password timing and account-dependent database failure responses need further investigation.
- Measure per-JWT authVersion database lookup load and database-backed rate-limiter contention. Do not remove invalidation casually.
- Verify trusted proxy and `x-forwarded-for` behavior in deployment.
- Email provider timeout and partial-delivery behavior need resilience review. Failed cleanup can leave a hashed token until expiration.
- Production build tracing warns about a broad filesystem trace through `src/lib/db.ts`. The dynamic PGSSLROOTCERT read is a candidate cause, not a confirmed complete diagnosis. Verify certificate inclusion in deployed output before changing tracing. Preserve TLS certificate verification.
- The existing Vite config-loading warning and Recharts sizing warning remain tracked follow-ups.
- Offline-first and sync architecture remain a later design investigation.

## Delivery boundaries

Commit and push only the slice branch. Open the PR against `refactor/premium-ux`. No direct commits or pushes to `develop` or `main`. Local verification does not mean these changes are deployed.

## Registration feedback and navigation control follow-up

The original Slice 2 implementation merged through PR #21 into
`refactor/premium-ux` at `1a224d2`.

Local review then identified two bounded corrections:
- Replace the misleading account-created banner with generic registration
  guidance, explaining that existing accounts retain their original password.
  Account-existence disclosure remains intentionally suppressed.
- Raise the desktop sidebar above the workspace header so the expand control
  remains unobstructed where it extends across the sidebar boundary.

Verification: five focused registration/workspace E2E tests passed, including
a hit-test check on both halves of the expand control. Typecheck, lint, and
diff checks passed. Sidebar scrollbar styling was already present and later
appeared correctly; no scrollbar CSS change was made, and the earlier rendering
cause remains unconfirmed.

### Integration PR verification

PR #22 exposed a CI trigger gap: `fix/*` pushes were excluded, and pull-request
verification targeted only `main`. The workflow now also verifies PRs targeting
`refactor/premium-ux`, regardless of their source branch. Existing verification
steps and permissions are preserved.
