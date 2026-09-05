# NutriCare Documentation

This directory is the documentation source of truth for NutriCare.

## Structure

- `product/` — product blueprint, architecture RFC, and UX/design specification.
- `architecture/decisions/` — durable architecture decision records.
- `engineering/incidents/` — important engineering incidents and postmortems.
- `engineering/testing/` — testing strategy and significant testing notes.
- `timeline.md` — major product and engineering milestones.

## Documentation principles

NutriCare is being developed as a real software product rather than a prototype. Documentation should therefore capture the product intent, architectural decisions, important engineering failures, and the reasoning behind durable implementation choices.

Incident records should focus on the useful engineering history:

**symptom → investigation → root cause → resolution → lesson → prevention**

They are not intended to record every command or routine debugging session.

Product documents are the source of truth for product behavior. Architecture decision records capture decisions that should remain understandable after implementation details change.
