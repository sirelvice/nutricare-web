# Incident 004 — Applied Security Migration Checksum Mismatch

## Summary

During PostgreSQL security hardening, NutriCare successfully applied the
`20260909141156_database_security_hardening` Prisma migration to the production
database.

The migration was subsequently edited locally during troubleshooting. The
database therefore retains the checksum of the original successfully applied
migration while the working tree contains a different version of the SQL.

The live database security state was independently verified as correct.

## Symptom

The local migration file and the checksum recorded by Prisma for the
successfully applied migration did not match.

Local migration checksum:

`258ca8d0ca9a007771753934468cc95d5e9f350571daade534743fa21affe027`

Database-recorded checksum for the successful application:

`5ab7c8f0519f7c552473383689abb9b99ab57164c78d4ef9f76dcec0e0c18c9e`

The database also contained three earlier rolled-back attempts for the same
migration name, each with a different checksum.

## Investigation

The investigation verified the migration history directly in PostgreSQL.

The successful migration record has a non-null `finished_at` timestamp:

`2026-09-09 14:28:11.931898+00`

The repository was then checked for another copy of the original migration:

- Git history contained no committed version of the migration.
- The Git object database contained no recoverable unreachable blob.
- Shell history contained only subsequent database-security inspection scripts,
  not the original migration creation command.
- No backup or alternate local copy of the migration was found.

The live database was also independently verified.

All nine NutriCare application tables have row-level security enabled, and the
Supabase API roles have no direct table grants.

`prisma migrate status` reports the database schema is up to date.

`prisma migrate deploy` also completed successfully with:

`No pending migrations to apply.`

## Root Cause

The migration SQL was edited after the successful database application.

Because Prisma records a checksum for the migration version that it applied,
the later local edits caused the repository file to differ from the historical
migration recorded by the database.

The original applied bytes could not be recovered from Git, the local
filesystem, or shell history.

## Resolution

The live database was left unchanged.

No attempt was made to modify the Prisma migration table or fabricate a SQL
file solely to reproduce the historical checksum.

The database security boundary was validated independently of the migration
file:

- RLS is enabled on all nine application tables.
- `anon`, `authenticated`, and `service_role` have no direct table grants.
- Future public-schema default privileges were hardened.
- The restricted application runtime role was verified separately.
- The complete automated test suite passes: 300 tests across 58 test files.

The checksum discrepancy remains documented as a migration-history integrity
issue rather than being silently overwritten.

## Lesson

Applied Prisma migration files must be treated as immutable historical records.

A migration should never be edited after successful application. Any further
database change must be represented by a new migration.

Database state and migration-history integrity are separate concerns: a secure
and correct live database does not eliminate the need for an accurate,
reproducible migration history.

## Prevention

- Never edit an applied migration.
- Create a new migration for every subsequent schema or privilege change.
- Commit migration files immediately after successful verification.
- Verify migration checksums before modifying migration files during incident
  investigation.
- Keep database-security verification independent from migration-file inspection.
- Treat migration history as part of the production audit trail.

## Related Work

The PostgreSQL/TLS and Supabase connectivity investigation is documented in:

`Docs/engineering/incidents/002-postgresql-tls-and-supabase-connectivity.md`

The stale Prisma-client investigation is documented in:

`Docs/engineering/incidents/003-stale-prisma-client-after-migration.md`
