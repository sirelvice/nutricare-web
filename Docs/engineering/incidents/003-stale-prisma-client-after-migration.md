# Incident 003 — Stale Prisma Client After Migration

## Summary

NutriCare encountered application and test failures after introducing database schema changes for persisted progress evaluations and recommendation data.

The database migration itself was applied successfully, but the generated Prisma client did not yet reflect the updated schema. This created a mismatch between the database schema and the application's generated types/client.

## Symptom

Code referencing newly added Prisma fields and enums failed even though the corresponding database migration had already been created and applied.

The failure was initially confusing because database state and migration state appeared correct while the application still behaved as though the new schema did not exist.

## Investigation

The investigation compared three separate states:

1. The Prisma schema in `prisma/schema.prisma`.
2. The applied PostgreSQL migration state.
3. The generated Prisma client used by the application and TypeScript compiler.

The migration confirmed that PostgreSQL had the new structures.

The Prisma schema also contained the expected fields and enums.

The remaining mismatch was the generated client: it had been generated from an older schema and therefore did not expose the newly added model fields, enum values, or relation information to application code.

## Root Cause

The Prisma client was stale.

Applying a database migration changes PostgreSQL, but it does not by itself guarantee that the generated Prisma client in the local dependency tree has been regenerated from the current Prisma schema.

This produced a schema-generation mismatch:

**Prisma schema → migration → PostgreSQL**

was current, while:

**Prisma schema → generated Prisma client**

was stale.

## Resolution

The Prisma client was regenerated after the schema changes.

Subsequent TypeScript compilation and tests then used the current generated client and recognized the newly introduced database structures.

The migration state and generated client were subsequently treated as separate verification points rather than assuming one implied the other.

## Lesson

Prisma database work has multiple artifacts that must remain synchronized:

**schema → generated client → migration → database**

A successful migration does not prove that the generated client is current.

When new Prisma fields or enums appear to be missing despite a successful migration, check client generation before changing application logic.

## Prevention

- Regenerate the Prisma client after Prisma schema changes.
- Treat schema generation and migration application as separate steps.
- Run TypeScript checks after schema/client changes.
- Run repository integration tests that exercise newly introduced fields.
- Keep migration history and generated Prisma artifacts consistent with the schema used by the application.
- Document unusual migration/client mismatches rather than working around generated-type failures in application code.

## Related Work

The persisted progress-evaluation implementation introduced additional fields and enums to the Prisma schema and required the generated client to remain synchronized with those migrations.
