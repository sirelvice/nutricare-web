# V3 security review: initial source assessment

Baseline: e7abd45bd86f9a1ab6b6d7f763b9c81c6edd51e6, supplied on 9 October 2026.

Status: source assessment in progress. The initial cache-protection patch and API isolation tests passed locally; further corrections remain under review. This is not a penetration-test sign-off or production release approval.

## Personal endpoint inventory

| Endpoint | Methods | Ownership source / enforcement |
| --- | --- | --- |
| /api/profile | GET, PUT | Session user ID; profile lookup/upsert and goal-change workflow use userId |
| /api/weight-entries | GET, POST | Session user ID; repository reads and inserts use userId |
| /api/weight-entries/[id] | DELETE | deleteMany matches both entry ID and session userId |
| /api/nutrition-plan | GET, POST | Profile, weight and plan services receive session user ID |
| /api/nutrition-plan/history | GET | Plan lookup filters by session userId |
| /api/progress | GET | Current plan and evaluation lookup filter by userId |
| /api/progress/adjustment | POST | Evaluation lookup and transactional writes check userId and applicable plan/state |
| /api/recommendations | GET | Session-scoped profile, weight and nutrition-plan services |
| /api/report | GET | Session-scoped report service and repositories |
| /api/report/pdf | GET | Same session-scoped report service; authenticated server export |

All listed personal routes check authentication independently of the page proxy. Client-supplied query identities do not select the owner. No cross-account bypass was identified in these reviewed query paths; runtime confirmation is still required.

Public routes include registration, password-reset requests/completion, contact and partner submissions, and the static impact snapshot. The Auth.js catch-all separately handles authentication/session actions. Contact and partner endpoints expose submission acknowledgments, not an API for listing submitted messages.

## Confirmed controls in source

- Personal mutations use same-origin checks. Auth.js validates credentials CSRF separately.
- Profile, weight, plan and report responses map domain fields rather than returning password hashes or reset-token rows.
- Reset tokens use 32 random bytes, are stored as SHA-256 hashes, expire and are claimed transactionally with a usedAt check. Reset increments authVersion; JWT/session callbacks consult it for invalidation.
- Prisma queries use structured parameters; the rate-limit SQL uses a parameterized tagged template.
- Public inquiries enforce JSON, streamed request-size limits, same-origin checks and database-backed rate limits. Inquiry HTML email content is escaped.

## First correction and new coverage

Profile, weight-list and progress success responses lacked explicit private/no-store headers. Add these headers without changing response bodies. Shared API error helpers also prevent caching while preserving rate-limit headers. This is a defense-in-depth correction, not evidence that a shared-cache leak occurred.

New real HTTP tests cover anonymous reads/writes, two isolated browser sessions, ignored client-supplied user IDs, foreign weight deletion and evaluation decisions, report/PDF setup isolation, foreign-origin mutation rejection and selected cache headers. They use test accounts and real APIs without data mocks. Test accounts remain in the local test database, as with existing browser journeys; do not run against production data.

Initial local verification reported on 9 October 2026: 40 focused unit tests passed across API error, profile, weight and progress suites; 2 real API isolation tests passed in 29.4 seconds. TypeScript, lint and whitespace checks passed. Tested working tree was based on the baseline above with the API isolation patch applied; these changes were not yet committed.

New password correction: registration and reset use a 72-byte UTF-8 bound before hashing, with clear rejection feedback. Login retains the established input contract for compatibility with existing hashes. ASCII, accented-character and emoji boundary cases are covered by new tests. Password patch verification reported on 9 October 2026: 32 focused unit tests and 16 authentication browser tests passed, with TypeScript, lint and whitespace checks clean. Existing hashes that previously truncated remain a migration consideration; this patch does not retroactively change them.

## Remaining findings and review work

1. New-password byte bounds are corrected and verified by the reported focused tests. Existing bcrypt hashes may have been created from truncated inputs. Assess migration and user communication; existing login behavior is preserved.
2. Proposed bounded JSON reader caps register, forgot-password, reset-password, profile, weight and adjustment request bodies at 16 KiB, including chunked bodies and misleading Content-Length. JSON-bound verification reported on 9 October 2026: 77 unit tests and 18 browser tests passed, with TypeScript, lint and whitespace checks clean. Existing public inquiries retain their 32 KiB bound. The next proposed patch caps Auth.js credentials callbacks at 16 KiB before cloning/parsing and preserves body bytes and cookies for Auth.js validation. Credentials-bound verification: 14 route unit tests passed; after correcting the test assertion to allow a null unauthenticated session, all 6 isolation/login browser tests passed in 21.8 seconds, followed by 6 repeated CSRF diagnostic runs in 14.6 seconds. TypeScript, lint and whitespace checks passed. Plan generation and DELETE accept no JSON payload.
3. getClientIp trusts x-forwarded-for's first value or x-real-ip. Vercel documents that it overwrites x-forwarded-for to prevent spoofing (https://vercel.com/docs/headers/request-headers). The current deployment is Vercel; no arbitrary header-selection override was added. Verify this behavior in the deployed environment using controlled requests. Self-hosting or adding another proxy requires a separately assessed trust configuration. Current account login/reset buckets combine email and IP; they are not a global per-account limit against distributed attempts.
4. Authenticated generation/PDF operations and unbounded histories need resource-abuse assessment, suitable limits and eventual server pagination.
5. Login and registration follow different work paths for existing/absent accounts. Generic messages reduce direct enumeration, but timing resistance has not been established.
6. Invalid/expired/used reset-token coverage exists, but real email delivery and old-session invalidation after reset still need deployed verification. Concurrent reset expiry boundaries and operational cleanup need review.
7. Production dependency audit findings from Slice 9 remain unresolved; determine deployed reachability and remediation. Node 22 alignment is not an audit fix.
8. Production cookie flags, secret handling, HTTPS/database permissions, reset-link logging/referrer exposure, proxy behavior, deployment caches and browser-side injection/CSP have not been verified by this server-source bundle.

## Release evidence requirements

Keep source findings, automated runtime results and manual/deployment results separate. The existing manual-regression.md and end-to-end.md from PR #18 are extended for V3; old scenarios are a baseline, not current execution evidence. Record final outcomes in v3-release-evidence.md. A release decision must account for unresolved findings and the PRD's manual accessibility/mobile gates.
