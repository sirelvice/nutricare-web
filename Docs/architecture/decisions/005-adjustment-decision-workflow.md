# ADR 005 — Adjustment Decision Workflow

## Status

Accepted

## Context

NutriCare may recommend reviewing or adjusting a nutrition plan after repeated progress problems.

A recommendation should not silently mutate the user's plan. The user must remain the decision-maker, and the system needs to preserve the history of what was recommended and how the user responded.

## Decision

The adjustment workflow is explicit and user-controlled.

When the current progress recommendation is `CONSIDER_ADJUSTMENT`, the user is presented with a decision point:

**Review my plan**

The user can:

- `ACCEPTED`
- `DECLINED`

The decision is persisted against the specific progress evaluation.

Only a pending recommendation can be answered.

The response endpoint is authenticated and does not accept a client-supplied user ID. Ownership is derived from the authenticated session and enforced through the persistence layer.

## Acceptance Semantics

Accepting the recommendation does not directly modify the existing nutrition-plan record.

An accepted adjustment must create a new nutrition-plan version.

The existing plan remains immutable as historical context, while the new version becomes the current plan and establishes a new progress-evaluation boundary.

The actual plan-generation/change operation is a separate application service from recording the user's decision.

This separation prevents a recommendation-response endpoint from becoming responsible for the full nutrition-plan mutation workflow.

## Decline Semantics

Declining the recommendation persists the decision but leaves the current nutrition plan unchanged.

The product can therefore distinguish:

- recommendation still awaiting a decision,
- recommendation explicitly accepted,
- recommendation explicitly declined.

## Idempotency and Concurrency

A pending recommendation may be answered only once.

The persistence operation is ownership-scoped and conditional on the recommendation still being in the `PENDING` state.

A second attempt to answer the same evaluation must fail rather than overwrite the first decision.

This protects the workflow against duplicate submissions and concurrent requests.

## Security

The client provides only:

- evaluation ID,
- decision.

The client does not provide a user ID or permission to modify another user's evaluation.

The server obtains the authenticated user identity from the session and applies ownership checks when updating the evaluation.

Input is validated at the API boundary.

Errors returned to the client should be safe and should not expose database internals.

## Consequences

The workflow creates a clear audit trail around plan-adjustment decisions.

It also gives the application a clean boundary between:

**recommendation → user decision → plan version creation**

That boundary will make future adjustment types easier to add without coupling recommendation logic to persistence or UI behavior.

## Alternatives Rejected

### Automatically apply recommendations

Rejected because a plan adjustment is a user-affecting decision and should not happen without explicit authorization.

### Mutate the current plan in place

Rejected because historical plan versions are needed to establish evaluation boundaries and preserve explainable progress history.

### Accept a user ID from the browser

Rejected because authorization must come from the authenticated server-side session rather than client input.

### Combine decision recording and plan generation in one route

Rejected because it couples two distinct application responsibilities and makes the workflow harder to test and evolve.

## Related Documentation

- `Docs/product/02-rfc-architecture.md`
- `Docs/product/03-design.md`
- `Docs/architecture/decisions/003-adjustment-recommendation-and-escalation.md`
- `Docs/architecture/decisions/004-evaluation-cadence.md`
