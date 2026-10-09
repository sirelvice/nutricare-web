# V3 Slice 5 checkpoint: tracking, guidance and dashboard history

Date: 2026-10-07
Status: local verification complete; integration PR and merge pending.

## Git and issue boundaries

- Repository: `sirelvice/nutricare-web`.
- Working branch: `refactor/v3-tracking-guidance`, from integration merge `53c2153` (PR #24).
- Target: `refactor/premium-ux`; use `Refs #19`, leaving the overall V3 issue open.
- Conventional commits and the repository PR template apply. No direct commits or pushes to `main` or `develop`.

## Delivered behavior

- Weight persistence is distinct from optional progress evaluation. A saved entry returns 201 even if the secondary evaluation fails; the UI confirms the save and explains that another insert is unnecessary.
- Weight APIs contain authentication, request setup and repository failures within generic JSON error boundaries. Session ownership and same-origin mutation checks remain in place.
- Weight tracking uses semantic cards, keyboard submission, strict draft and response validation, failed-read recovery and synchronous mutation guards. Unconfirmed saves require checking history before starting another entry. An unconfirmed deletion retains the local entry and directs the user to refresh history.
- Recommendations provide practical next actions, reasons, curated meal examples, visible limitations and versioned source information. Separate calorie-surplus/deficit advice was removed to avoid double adjustment of saved targets. Conflicting BMI/goal combinations direct users to individual goal review.
- Guidance identifies the saved plan version and latest measurement date. Profile/plan goal mismatches get a dedicated review state. Optional progress must match the plan ID; failed or outdated progress does not silently blend into current guidance.
- Shared age eligibility limits personalised planning and recommendations to people aged 20 and over. Missing/invalid ages require profile review. Younger users can retain weight measurements without receiving adult personalised targets. This is the implemented product scope, not clinical certification of eligible users.
- Dashboard plan generation and adjustment decisions use validated response contracts. Conflicting or unconfirmed outcomes block another activation until explicit reload. Previously completed decisions are not presented as pending actions.
- Dashboard history retains measurements rather than truncating to seven. Repeated dates become daily averages, and a seven-calendar-day trend uses recorded daily means without invented zero observations. Period controls end on the latest measurement. Individual records remain available in the table.
- Compact card information uses an Info/Close toggle, hidden inactive content and Escape focus restoration. Chart periods survive switching. Critical warnings and actions stay visible.
- Login removes its intentional delay, guards duplicate submission and replaces the document at a validated internal destination. Shell controls wait for initialization; unavailable local storage retains the default layout.
- Shared E2E login setup verifies callback success and waits for workspace/core readiness. Profile and planning failure mocks remain failed until explicit Retry recovery.

## Verification evidence

Commands and results below were observed in the developer's local repository. Runtime tests were not run in the separate patch-generation workspace.

- Full `npm test`: 75 files, 623 unit/database tests passed before the final login/readiness follow-ups. No later full unit-suite run is claimed.
- Final `npx tsc --noEmit`, `npm run lint`, `git diff --check`: passed after the last profile retry patch.
- Profile failed-read tests repeated three times: 6 passed (28.3s).
- Final `npm run test:e2e -- --reporter=line`: 111 passed with two workers (7.0m).
- Final `npm run build`: passed, including TypeScript compilation and 43 generated pages. The existing Turbopack filesystem tracing warning remained.
- Focused evidence includes 9 chart-data tests covering 100 distinct dates, 100 same-day measurements, missing dates, duplicate IDs, flat histories and period filtering; 104 final-hardening unit tests; 16 login-transition/auth-experience E2E tests; and 40 shell/planning/dashboard E2E tests.

Earlier full runs exposed login transition and test setup races. They are recorded as failures followed by specific fixes and a final green run, not erased by the final result. No claim is made that CI runs the Playwright suite; the local full E2E result is separate evidence.

## Security, data and product limits

- No Prisma schema change, migration or new dependency is introduced.
- Session ownership, same-origin mutation protections and existing rate limits remain in place. Trusted fixed messages replace arbitrary server error bodies in the changed client flows.
- Client guards are not distributed idempotency. Aborting a request does not guarantee server rollback; unconfirmed writes require reconciliation. Broader concurrent snapshot races remain a platform follow-up.
- Guidance remains deterministic, curated and source-linked. It is not an individualised clinical meal plan; meal portions and nutrient totals are not calculated. No external provider receives user health data through this slice.
- The chart handles 100-record fixtures and keeps all valid supplied records. No unlimited-history performance or load-test claim is made; pagination/downsampling can be assessed with real usage evidence.
- Manual screen-reader and contrast review, clinical suitability assessment, broader security audit and load measurements remain outstanding. Automated keyboard and viewport checks do not establish those outcomes.
- The known Vitest configuration warning and Turbopack certificate-path filesystem tracing warning remain unresolved. They did not prevent the reported tests or production build.

## Integration handoff

- Slice 4 is merged through PR #24 at `53c2153`; its checkpoint preserves the evidence recorded before that merge.
- This checkpoint will be supplemented with the Slice 5 PR and merge result after integration. Issue #19 remains open for later V3 slices.
