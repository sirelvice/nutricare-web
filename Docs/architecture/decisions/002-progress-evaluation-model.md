# ADR 002 — Progress Evaluation Model

## Status

Accepted

## Context

NutriCare needs to determine whether a user's weight trajectory is consistent with the selected goal without turning the product into a diagnostic system.

The evaluation must work for all three goals:

- `LOSE`
- `GAIN`
- `MAINTAIN`

It must also distinguish insufficient evidence from genuine lack of progress.

## Decision

Progress evaluation is implemented as a pure domain function.

The domain receives normalized weight history and the user's goal context and returns a typed progress evaluation.

The current states are:

- `ON_TRACK`
- `BEHIND_OPPOSITE`
- `PLATEAU`
- `INSUFFICIENT_DATA`

`GOAL_ACHIEVED` is deferred until a richer goal model defines an explicit target or target range and lifecycle semantics.

## Evaluation Requirements

The current evaluation requires:

- at least 3 weight entries,
- at least 14 days of evaluation span,
- 0.5 kg as the meaningful-movement threshold,
- approximately ±0.5 kg tolerance for `MAINTAIN`.

Sparse data must produce `INSUFFICIENT_DATA` rather than a false conclusion that the user has plateaued.

## Goal Symmetry

The domain evaluates movement relative to the selected goal rather than assuming weight loss is the default.

For `LOSE`, downward movement supports `ON_TRACK`.

For `GAIN`, upward movement supports `ON_TRACK`.

For `MAINTAIN`, movement within the maintenance tolerance supports `ON_TRACK`.

The same evaluation machinery therefore supports opposite directional goals without reversing or duplicating the domain model.

## Evaluation Boundary

An evaluation belongs to the active nutrition-plan version.

The application service resolves the current plan and filters the user's weight entries from that plan's creation time.

The pure domain function does not know about nutrition plans, persistence, or database state.

This keeps the domain deterministic while allowing plan changes to establish new evaluation boundaries.

## Recommendation Separation

Progress state and recommended action are separate concepts.

The evaluation answers:

**What does the available weight history indicate?**

The recommendation answers:

**What should the product suggest the user consider doing next?**

This separation allows recommendation rules to incorporate history, plan boundaries, and prior decisions without making the progress domain aware of application workflow.

## Consequences

The model is small, deterministic, and independently testable.

It also avoids false precision by requiring enough data before classifying a trend.

Because the domain is symmetric across goals, future goal-related behavior can build on one evaluation model rather than creating separate loss and gain implementations.

## Alternatives Rejected

### Weight change alone

Rejected because raw change is insufficient without considering the user's selected goal and available observation window.

### Plateau as the default for sparse data

Rejected because missing evidence is not evidence of no progress.

### Business rules inside the domain

Rejected for plan-history and recommendation behavior because those concerns require application state and persistence context.

## Related Documentation

- `Docs/product/01-product-blueprint.md`
- `Docs/product/02-rfc-architecture.md`
- `Docs/architecture/decisions/003-adjustment-recommendation-and-escalation.md`
