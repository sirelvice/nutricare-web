# V3 Slice 4 checkpoint: profile, goals and planning tools

Date: 2026-10-07
Status: local verification complete; integration PR and merge pending.

## Git and issue boundaries

- Repository: `sirelvice/nutricare-web`.
- Working branch: `refactor/v3-profile-planning`, from integration merge `68101e5` (PR #23).
- PR target: `refactor/premium-ux`; reference #19 without closing the overall V3 issue.
- Use conventional commit and PR titles, the repository PR template and successful checks before merging. No direct commits or pushes to `develop` or `main`.

## Delivered behavior

- Shared profile validation at API and domain boundaries: finite measurements, supported enums and whole-year ages. Nullable partial setup remains supported. The authenticated session owns profile writes; submitted user identifiers do not change ownership.
- Profile keeps editable text separate from the saved snapshot. Loading and malformed-response failures block editing and support in-place retry. Save failures retain edits; successful saves have persistent feedback.
- Known goal-change failures have typed internal errors and fixed public 422/409 responses. Missing measurements have appropriate next actions. Detected stale goal/plan conflicts require an explicit saved-profile reload. Goal history and transactional plan creation remain intact.
- Nutrition-plan version collisions become a typed conflict and public 409 instead of a generic 500. A database regression forces both requests to read the same version, proves only one insert succeeds, and verifies a fresh request can proceed. Unexpected failures retain generic 500 responses and internal logging.
- Calories/macros share semantic layouts and validated response parsing. Failed reads do not masquerade as an empty plan. Requests have cancellation and explicit read freshness. Synchronous guards prevent duplicate activation. Conflicting or unconfirmed writes require an explicit read before another write.
- BMI has keyboard form submission, editable invalid text, associated errors, focus on the first invalid field and accessible result announcements. Editing clears the result. Nonpositive/nonfinite calculator inputs are rejected; supported calculations and category thresholds are preserved.
- A bounded dashboard wording follow-up removes repetitive target captions. Native explanatory disclosures reduce visible text on profile, planning and dashboard screens while retaining key results, actions and essential guidance.

## Verification evidence

Commands were run by the developer in the local repository on Node 20.20.2. These are observed results, not tests run against a separate reconstructed workspace.

Before the final wording/disclosure pass:

- `npm test`: 68 files, 482 tests passed (unit and database projects).
- `npm run test:e2e -- --reporter=line`: 79 tests passed.
- `npm run build`: passed; the existing Turbopack broad filesystem tracing warning remained.
- Focused plan concurrency verification: 22 tests passed, including the database race test. Its expected Prisma unique-constraint log is evidence of the losing competing insert.
- Focused plan client contract: 25 tests passed.
- BMI form/calculator verification: 34 tests passed.

After the final wording/disclosure pass:

- `npx tsc --noEmit`, `npm run lint`, `git diff --check`: passed.
- `npm run test:e2e -- e2e/profile-experience.spec.ts e2e/planning-experience.spec.ts e2e/dashboard-loading.spec.ts --reporter=line`: 43 tests passed, including keyboard disclosure coverage.
- Four affected existing registration/profile/calories/macros journeys passed.
- Final `npm run test:e2e -- --reporter=line`: 82 tests passed after the wording/disclosure pass.
- Final `npm run build`: passed, including TypeScript compilation; the existing Turbopack filesystem tracing warning remained.
- Final `git diff --check`: passed.

## Screen review

| Screen | States and keyboard evidence | Visual evidence |
| --- | --- | --- |
| Profile | Pending/error reads, editable invalid drafts, save recovery, 422/409 handling, persisted goal changes and keyboard disclosure | New-profile screenshots at 375px and 1280px reviewed before and after wording pass |
| Calories | Ready/empty/error reads, duplicate activation, prerequisite feedback, conflict/unconfirmed-write recovery and keyboard disclosure | Ready-plan screenshots at 375px and 1280px reviewed before and after wording pass |
| Macros | Ready/empty/error reads, in-place retry and keyboard disclosure | Ready-plan screenshots at 375px and 1280px reviewed before and after wording pass |
| BMI | Keyboard submission, invalid-field focus, result announcement, stale-result clearing and existing calculate/recalculate journey | Calculated-result screenshots at 375px and 1280px reviewed |
| Dashboard follow-up | Existing loading/progress behavior, viewport resizing and keyboard target explanation | Returning-user fixture screenshots at 375px and 1280px reviewed |

Screenshots use test fixtures; screenshot labels such as service-provided placeholder headlines are not new production copy. Visual inspection found no clipping in the reviewed states. Keyboard automation does not establish full manual screen-reader or contrast compliance.

## Data, security and remaining work

- No Prisma schema change or migration is required. No new dependency is introduced.
- Authentication, session ownership, same-origin mutation checks, rate limits and TLS verification are preserved.
- Public messages do not expose arbitrary database/provider exception text.
- The database uniqueness constraint remains the final protection against duplicate plan versions. Conflict handling does not serialize all writers or solve every profile/weight/plan snapshot race. Broader concurrency and idempotency work remains a measured platform follow-up.
- Aborting a client mutation cannot guarantee server rollback; the plan UI treats an unconfirmed write as requiring a read.
- The existing Vitest native-config warning and Turbopack certificate-file tracing warning remain tracked. No performance benchmark or load-test result is claimed.
- Manual assistive-technology/contrast review, broader security/load measurements and offline-first/sync architecture remain future work. No claim of absolute security is made.
