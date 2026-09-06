# ADR 007 — Public Impact Content and Private Personal Reports

## Status

Accepted

## Context

NutriCare previously exposed an `/api/impact-snapshot` endpoint that combined public
programme-impact content with user-specific profile and tracking data from legacy
browser `localStorage` helpers.

That design was incompatible with the product architecture:

- server APIs must use authenticated, persisted user data;
- personal nutrition and tracking data must be user-scoped;
- public marketing pages must not depend on authenticated personal data;
- report exports must use the same authoritative data source as the personal report API.

The legacy impact endpoint could not provide reliable server-side user data because its
storage helpers are browser-only.

## Decision

Separate public programme information from private personal reporting.

### Public impact endpoint

`GET /api/impact-snapshot` is public and static.

It returns only:

- NutriCare product information;
- programme-impact narrative;
- public impact measures;
- configured programme metrics.

It must not return:

- user profile data;
- weight entries;
- BMI history;
- calorie history;
- other user-specific health information.

### Personal report API

`GET /api/report` remains authenticated and is the authoritative personal report
endpoint.

It derives data through PostgreSQL-backed repositories and the report application
service.

### Personal PDF export

`GET /api/report/pdf` is authenticated and uses the same `GetReportService` as the
personal report API.

The PDF therefore represents the authenticated user's persisted profile, current
health snapshot, nutrition plan, and weight history rather than programme-level demo
data.

The endpoint uses:

- session-derived user identity;
- `Cache-Control: no-store`;
- a private filename;
- generic error responses.

### Legacy browser storage

Legacy browser `localStorage` helpers are not removed in this milestone because other
client-side consumers may still depend on them.

They are no longer used by the server-side impact snapshot for personal data.

## Consequences

### Positive

- Public marketing content has no personal-data dependency.
- Personal report generation has a single authoritative data path.
- PDF exports inherit the same ownership boundary as the report API.
- The architecture is consistent with the PostgreSQL-backed product model.
- Tests explicitly protect the public/private boundary.

### Trade-offs

- The legacy browser storage layer remains temporarily while remaining consumers are
  migrated.
- Programme-level reporting and personal reporting are now deliberately separate
  concepts and will require separate evolution.

## Testing

The milestone includes:

- public impact endpoint test confirming no user-specific snapshot fields;
- authenticated PDF export test;
- unauthenticated PDF rejection test;
- authenticated PDF user-ownership test;
- PDF missing-profile and failure-path tests.

The full regression checkpoint passed with 43 test files and 224 tests.

## Related Documentation

- `Docs/product/02-rfc-architecture.md`
- `Docs/architecture/decisions/001-layered-application-architecture.md`
- `Docs/architecture/decisions/005-adjustment-decision-workflow.md`
- `Docs/architecture/decisions/006-accepted-adjustment-transaction.md`
