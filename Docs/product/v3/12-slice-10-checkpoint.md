# Slice 10 checkpoint: Release review in progress

Status: local automated verification complete for the security corrections; draft review PR and deployed/manual acceptance pending. This checkpoint does not approve production release or close #19.

## Baseline

- Branch: `refactor/v3-release-review`.
- Integration baseline: PR #29, `e7abd45bd86f9a1ab6b6d7f763b9c81c6edd51e6`.
- Retains the existing QA documents from PR #18 (`f48f5d51f7144ea63b96657463fc8da649162698`) and extends them for V3.

## Corrections

- Added explicit private/no-store caching to profile, weight-list and progress responses, and shared API errors.
- Added real anonymous-access and two-account API isolation tests, including foreign record mutations and report ownership/setup isolation.
- New registration/reset passwords are bounded to 72 UTF-8 bytes before bcrypt hashing. Existing login input remains compatible; existing truncated hashes are not migrated by this change.
- JSON writes and the credentials callback use 16 KiB streamed bounds. The credentials adapter preserves body bytes, headers and cookies for Auth.js CSRF validation. Existing inquiry limits remain 32 KiB.
- Added release evidence and source-security assessment, while extending manual-regression.md and end-to-end.md rather than replacing the earlier QA baseline.

## Verification reported locally on 9 October 2026

- Node 22.23.3; 720 Vitest tests passed across 80 files in 49.33 seconds.
- 183 Chromium Playwright tests passed using two workers in 7.2 minutes.
- Next.js 16.3.8 production build succeeded, including TypeScript and 43 static pages, without a reported build warning.
- Focused TypeScript, ESLint and whitespace checks passed throughout the changes; final whitespace check passed.
- Credentials callback: 14 unit tests passed; six repeated CSRF login diagnostics passed after bounds were introduced.
- The missing-CSRF browser test initially assumed a non-null session. Its assertion was corrected to allow Auth.js's null unauthenticated response; authentication behavior was not changed by that correction.
- The Vite config-loader warning remains. Failure-path test logs are expected in the passing unit suite.

## Outstanding release gates

Use [release evidence](../../engineering/testing/v3-release-evidence.md) to record exact candidate, environment, tester and outcomes. Manual keyboard, screen-reader, measured contrast, mobile and zoom/reflow acceptance are not established by automated tests.

Use [security review](../../engineering/testing/v3-security-review.md) for unresolved findings, including dependency reachability, distributed account abuse, resource limits, existing hash migration, timing resistance, reset/email operations and deployment configuration. Vercel's documented IP-header behavior still needs deployed verification. Do not claim all endpoints or security risks are proven safe.

No schema migration, dependency change or product-data migration is introduced by this slice. Browser tests use isolated local accounts and leave test records in the test database. Real production data must not be used for destructive or stress testing.
