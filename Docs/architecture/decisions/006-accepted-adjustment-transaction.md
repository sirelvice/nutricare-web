# ADR 006: Accepted Adjustment Is a Transactional Plan-Version Workflow

## Status

Accepted

## Context

An adjustment recommendation represents a decision point after repeated problem evaluations within a nutrition-plan period.

Accepting the recommendation must do more than record a decision. It must create the next nutrition-plan version and make that version the user's current plan. These operations must remain consistent: an accepted adjustment must not leave the system with an accepted decision but no new plan, or a new plan without the corresponding accepted decision.

The workflow must also protect against stale recommendations and cross-user access.

## Decision

The accepted-adjustment workflow is implemented as a dedicated application service plus a transactional workflow repository.

The flow is:

1. Authenticate the user at the API boundary.
2. Load the specified evaluation for that authenticated user.
3. Require the evaluation to be a `CONSIDER_ADJUSTMENT` recommendation with a `PENDING` adjustment decision.
4. Verify that the evaluation still belongs to the user's current nutrition-plan version.
5. Recalculate the nutrition plan using the existing authoritative nutrition calculation rules and the latest persisted weight.
6. Execute the persistence workflow in one database transaction:
   - confirm the recommendation is still applicable;
   - confirm the expected plan version is still current;
   - create the next nutrition-plan version;
   - mark the evaluation `ACCEPTED`;
   - record `respondedAt`.
7. Return the newly created plan to the caller so the UI can immediately reflect the active version.

Declining an adjustment remains a decision-only workflow. It does not create a new plan version.

The transactional persistence is isolated in `AdjustmentWorkflowRepository` rather than added to the individual evaluation or nutrition-plan repositories.

Stale-plan protection is enforced both before orchestration and again inside the transaction.

## Consequences

### Positive

- Accepted adjustments are atomic at the persistence boundary.
- Nutrition-plan history remains versioned rather than overwritten.
- A recommendation cannot be applied to an outdated plan version.
- Repository queries remain user-scoped.
- The UI can immediately display the newly active plan.
- Decision-only decline behavior remains simple and separate from plan creation.

### Trade-offs

- The accepted-adjustment workflow spans multiple aggregates and therefore requires a dedicated workflow repository.
- The application service performs prerequisite reads before entering the transaction, while the transaction repeats critical applicability checks for consistency.
- More integration testing is required because the workflow depends on real PostgreSQL transaction behavior.

## Testing Implications

The integration tests cover:

- successful creation of the next plan version and acceptance of the evaluation;
- stale-plan rejection;
- cross-user rejection;
- atomic persistence behavior.

PostgreSQL-backed integration tests that share the remote test database run sequentially in the Vitest `database` project. Unit and mocked API/service tests remain in the parallel `unit` project.

The progress repository test cleanup is ownership-scoped and must not delete shared tables globally.
