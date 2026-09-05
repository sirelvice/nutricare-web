# ADR 004 — Progress Evaluation Cadence

## Status

Accepted

## Context

NutriCare records individual weight entries, but progress evaluation should not run on every write.

Running the full evaluation after every weight entry would create unnecessary evaluation records and could make recommendations overly reactive to short-term fluctuations.

At the same time, evaluation needs to happen automatically without requiring the user to visit a dashboard page.

## Decision

Progress evaluation uses a seven-day application cadence.

The cadence is triggered when a new weight entry is recorded.

After the entry is persisted:

1. The application resolves the current nutrition-plan version.
2. If no current plan exists, the weight entry remains saved and no evaluation is triggered.
3. The application checks the most recent evaluation for the current plan.
4. If fewer than seven days have elapsed since that evaluation, no new evaluation is created.
5. Otherwise, the application evaluates the current plan period and persists the resulting evaluation and recommendation.

The cadence rule belongs to the application service layer rather than the pure progress domain.

## Rationale

Weight tracking is continuous, but decision-making should be slower than individual measurements.

A seven-day cadence provides a practical boundary between collecting new observations and repeatedly recalculating the same recommendation.

The system therefore separates:

**tracking frequency**

from:

**evaluation frequency**

A user can record weight more often than the product evaluates progress.

## Consequences

The approach reduces unnecessary evaluation writes and limits recommendation churn.

It also gives the product a predictable evaluation rhythm without requiring a background scheduler or additional infrastructure for the current scope.

The evaluation remains tied to actual user activity: a new weight entry is the trigger that checks whether the cadence has elapsed.

## Edge Cases

### No nutrition plan

The weight entry must still be saved. Evaluation is simply skipped until a plan exists.

### No previous evaluation

The first eligible weight entry can trigger evaluation, subject to the progress domain's own minimum-data requirements.

### Multiple entries within seven days

They are preserved as tracking data but do not independently trigger new progress evaluations once the cadence window has not elapsed.

### New plan version

A new plan version creates a new evaluation boundary. The application evaluates the new plan period independently of the previous plan's evaluation cadence.

### Evaluation failure after weight persistence

The weight entry and evaluation are distinct operations. The system must not silently discard a successfully recorded weight because an evaluation failed.

Failure handling for this boundary should remain explicit so that persisted tracking data is not lost.

## Alternatives Rejected

### Evaluate on every weight entry

Rejected because it makes the recommendation layer too sensitive to individual measurements and increases unnecessary persistence.

### Scheduled background job

Deferred because the current product does not require additional infrastructure solely to calculate progress.

### Dashboard-only evaluation

Rejected because progress evaluation should not depend on a user opening a particular page.

## Related Documentation

- `Docs/product/02-rfc-architecture.md`
- `Docs/architecture/decisions/002-progress-evaluation-model.md`
- `Docs/architecture/decisions/003-adjustment-recommendation-and-escalation.md`
