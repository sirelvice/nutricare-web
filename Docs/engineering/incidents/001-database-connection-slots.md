# Incident 001 — Database Connection-Slot Exhaustion

## Summary

NutriCare encountered PostgreSQL connection failures while working against the Supabase database. The failure initially appeared to be a general database connectivity problem, but the underlying issue was connection-slot pressure rather than application authentication or query correctness.

## Symptom

Database operations intermittently failed with PostgreSQL connection errors. The application could not reliably establish database sessions even though the database itself was reachable.

The important distinction was that the failure occurred at connection establishment rather than during normal query execution.

## Investigation

The investigation separated the problem into three layers:

1. **Application configuration** — verify the configured database URLs and Prisma setup.
2. **Network reachability** — verify that the configured PostgreSQL endpoint and port were reachable.
3. **Database connection behavior** — determine whether the database was rejecting new sessions because available connection capacity had been exhausted.

This ruled out treating every `P1001`-style failure as proof that PostgreSQL was unreachable.

The investigation also reinforced that the Supabase pooler should be used deliberately for application traffic rather than unnecessarily creating large numbers of direct database connections.

## Root Cause

The immediate failure was caused by PostgreSQL connection-slot exhaustion.

The application/database configuration allowed connection pressure to accumulate until PostgreSQL could no longer accept another connection reliably.

This was a connection-management problem, not evidence that the database server had disappeared or that application queries were inherently invalid.

## Resolution

The database connection strategy was tightened around the existing Prisma setup and Supabase pooler.

The application uses the pooled Supabase connection for normal runtime traffic, while the direct/session connection is reserved for operations that specifically require it.

Prisma client reuse was also treated as important so that application execution does not unnecessarily create additional database clients and connection pools.

## Lesson

A successful TCP connection to PostgreSQL does not guarantee that the application can obtain a usable database session.

Database troubleshooting must distinguish:

**network reachability → TLS/authentication → connection capacity → query/application behavior**

Connection exhaustion can therefore present as a generic connectivity failure and must be investigated at the database connection layer.

## Prevention

- Reuse a single Prisma client rather than creating clients per request.
- Use the Supabase pooler for normal application traffic.
- Keep direct database connections limited to operations that require them.
- Treat connection count and pool configuration as production concerns.
- Preserve ownership and repository boundaries so database access remains centralized.
- Include database connectivity and failure-mode checks in engineering troubleshooting.

## Related Work

The later PostgreSQL/TLS investigation is documented separately in:

`Docs/engineering/incidents/002-postgresql-tls-and-supabase-connectivity.md`
