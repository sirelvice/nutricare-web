# ADR 001 — Layered Application Architecture

## Status

Accepted

## Context

NutriCare is being evolved from a prototype into a production-oriented software product.

The product now contains persistent domain state, progress evaluation, recommendations, plan versioning, authenticated APIs, and database-backed workflows. Keeping business logic directly inside pages, route handlers, or database calls would make the system harder to test and change safely.

## Decision

NutriCare uses the following application architecture:

**UI → API / Route Handlers → Application Services → Domain Logic → Repositories → PostgreSQL**

Each layer has a clear responsibility.

### UI

The UI is responsible for presentation, user interaction, and displaying application state.

It should not contain authoritative business rules or perform direct database access.

### API / Route Handlers

Route handlers authenticate requests, validate input, invoke application services, and translate service results into HTTP responses.

Routes remain thin.

### Application Services

Application services orchestrate use cases.

They coordinate repositories and pure domain functions while enforcing workflow sequencing and application-level rules.

Examples include recording a weight entry, evaluating progress, and responding to an adjustment recommendation.

### Domain Logic

Domain logic is expressed as pure functions wherever practical.

Domain functions receive explicit inputs and return deterministic results without database access, HTTP concerns, or UI dependencies.

This makes core product behavior independently testable.

### Repositories

Repositories own persistence access.

They expose application-level persistence operations while keeping Prisma and PostgreSQL details out of domain logic and most application services.

Ownership constraints are enforced in repository queries rather than trusting a client-supplied user identifier.

### PostgreSQL

PostgreSQL is the persistent system of record for product state.

Prisma remains the ORM/database access layer.

## Consequences

This architecture adds some indirection compared with keeping logic in a page or route, but it gives NutriCare clearer boundaries, stronger testing seams, and safer evolution as the product grows.

Changes to persistence should not require rewriting pure domain rules.

Changes to presentation should not alter business semantics.

Security-sensitive ownership checks remain close to persistence instead of depending on client behavior.

## Alternatives Rejected

### Direct database access from UI

Rejected because it couples presentation to persistence and weakens authorization boundaries.

### Large route-handler implementations

Rejected because routes become difficult to test and accumulate unrelated responsibilities.

### Domain logic inside repositories

Rejected because business rules would become coupled to database implementation details.

## Related Documentation

- `Docs/product/02-rfc-architecture.md`
- `Docs/product/03-design.md`
- `Docs/architecture/decisions/002-progress-evaluation-model.md`
