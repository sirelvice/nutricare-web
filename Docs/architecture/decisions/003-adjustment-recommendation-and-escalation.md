# ADR 003 — Adjustment Recommendation and Escalation

## Status

Accepted

## Context

Progress evaluation tells NutriCare what the available data indicates, but the product also needs to decide what guidance to present next.

A single problematic evaluation should not immediately trigger a plan change or professional-consultation recommendation. At the same time, repeated problems should not be ignored.

The recommendation model therefore needs to distinguish an initial problem from a repeated problem and recurrence after an actual plan adjustment.

## Decision

Recommendation logic is separate from progress-state evaluation.

The recommendation domain produces one of:

- `CONTINUE`
- `REVIEW_ADHERENCE`
- `CONSIDER_ADJUSTMENT`
- `SUGGEST_PROFESSIONAL_CONSULT`

It also records a reason:

- `insufficient_data`
- `on_track`
- `first_problem`
- `consecutive_problem`
- `recurrence_after_adjustment`

## Recommendation Rules

### Insufficient data

`INSUFFICIENT_DATA` produces:

`CONTINUE` with reason `insufficient_data`.

The product should encourage continued tracking rather than infer a trend from inadequate evidence.

### On track

`ON_TRACK` produces:

`CONTINUE` with reason `on_track`.

The user should not be pushed toward unnecessary changes when the current plan appears to be working.

### First problem

A first `PLATEAU` or `BEHIND_OPPOSITE` problem produces:

`REVIEW_ADHERENCE` with reason `first_problem`.

This creates an opportunity to review consistency before recommending a plan adjustment.

### Consecutive problem

Two consecutive `PLATEAU` or `BEHIND_OPPOSITE` evaluations within the same nutrition-plan version produce:

`CONSIDER_ADJUSTMENT` with reason `consecutive_problem`.

The two problem states are treated as part of the same problem class for streak purposes. They do not need to be identical.

The streak is bounded by the plan version. A new plan version establishes a new evaluation boundary.

### Recurrence after adjustment

When a plan has already been adjusted in response to a problem and the same problem recurs in the next plan period, the recommendation becomes:

`SUGGEST_PROFESSIONAL_CONSULT` with reason `recurrence_after_adjustment`.

This escalation does not wait for another two-evaluation streak.

The recommendation is non-diagnostic. It should encourage appropriate professional consultation without asserting a medical cause.

## Decision Workflow

`CONSIDER_ADJUSTMENT` is a recommendation, not an automatic mutation.

The product presents the user with a human decision point:

**Review my plan**

The user may accept or decline the recommendation.

An accepted adjustment must create a new nutrition-plan version rather than overwrite the current plan.

A declined recommendation leaves the current plan unchanged.

The decision itself is persisted so the system can distinguish a recommendation that was never answered from one the user explicitly accepted or declined.

## History Requirements

Progress evaluations are linked to the nutrition-plan version that governed their evaluation period.

This allows recommendation logic to reason about:

- consecutive problems within one plan period,
- the boundary created by a new plan version,
- whether an actual adjustment occurred,
- whether a problem recurred after that adjustment.

Recommendation history therefore depends on application context and persistence history; it is not embedded inside the pure progress-state domain.

## Consequences

The model avoids jumping directly from one abnormal-looking reading to a plan change.

It also avoids repeatedly recommending the same adjustment forever when a previous adjustment has already failed to resolve a recurring problem.

The recommendation layer remains deterministic when its required history is supplied explicitly.

## Alternatives Rejected

### Immediate adjustment after one problem

Rejected because one evaluation is insufficient evidence for a plan change.

### Require identical states for consecutive problems

Rejected because `PLATEAU` and `BEHIND_OPPOSITE` are both problem states and the important signal is persistence of the problem, not exact label repetition.

### Automatically mutate the active plan

Rejected because plan changes are user-affecting decisions and must pass through an explicit workflow.

### Diagnose the cause of recurrence

Rejected because NutriCare is not a diagnostic product.

## Related Documentation

- `Docs/product/01-product-blueprint.md`
- `Docs/product/02-rfc-architecture.md`
- `Docs/architecture/decisions/002-progress-evaluation-model.md`
- `Docs/architecture/decisions/004-evaluation-cadence.md`
- `Docs/architecture/decisions/005-adjustment-decision-workflow.md`
