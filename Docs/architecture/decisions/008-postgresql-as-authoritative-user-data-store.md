# ADR 008 — PostgreSQL Is the Authoritative User Data Store

## Status

Accepted

## Context

NutriCare originally contained browser `localStorage` persistence for profile data,
weight entries, BMI history, calorie history, and miscellaneous metrics.

During the v2 rebuild, equivalent PostgreSQL-backed domain models and repositories
were introduced for authenticated product data.

Leaving both persistence models active for product functionality would create a
split-brain system in which browser state and server state could disagree.

The audit found that the remaining direct consumers of the legacy profile, weight,
BMI-history, calorie-history, and metrics storage modules were obsolete dedicated
history pages.

The active product already had an authoritative `/history` page that reads:

- persisted weight entries;
- persisted profile data;
- persisted nutrition-plan versions.

BMI is derived from persisted weight and profile height rather than stored as a
second independent history.

Calories are represented by persisted nutrition-plan versions rather than by
browser-only calculation snapshots.

## Decision

PostgreSQL is the authoritative source of persisted authenticated user data.

### Retired browser persistence

The following legacy modules are removed from the active product:

- `src/lib/profile/storage.ts`
- `src/lib/tracking/weight.ts`
- `src/lib/history/bmi.ts`
- `src/lib/history/calories.ts`
- `src/lib/history/metrics.ts`

### Compatibility routes

The legacy routes:

- `/history/bmi`
- `/history/calories`

remain available as compatibility routes but redirect to `/history`.

This preserves existing navigation/bookmarks without preserving the obsolete storage
model.

### Current source-of-truth model

User profile data comes from PostgreSQL `Profile`.

Weight history comes from PostgreSQL `WeightEntry`.

Nutrition history comes from PostgreSQL `NutritionPlan`.

BMI is calculated from the persisted profile height and persisted weight entries.

Progress and recommendations remain persisted through `ProgressEvaluation`.

## Consequences

### Positive

- One authoritative source of truth for authenticated product data.
- Browser storage cannot silently diverge from server state.
- Reports, progress evaluation, and history operate on the same persisted data.
- The product architecture now matches the documented application/repository model.

### Trade-offs

- Legacy browser-only history data is no longer part of the authenticated product
  source of truth.
- Any future migration of pre-v2 local data would need an explicit migration/import
  strategy rather than implicit continued usage.

## Testing

The migration was verified by:

- removing all identified legacy storage consumers;
- preserving compatibility routes;
- full regression: 43 test files and 224 tests;
- successful TypeScript check;
- successful production build.

## Related Documentation

- `Docs/architecture/decisions/001-layered-application-architecture.md`
- `Docs/architecture/decisions/007-public-impact-and-private-personal-reports.md`
- `Docs/product/02-rfc-architecture.md`
