# Incident 002 — PostgreSQL TLS and Supabase Connectivity

## Summary

NutriCare experienced intermittent PostgreSQL connectivity failures while using Supabase. The failures initially resembled a general database outage, but investigation showed that network reachability, TLS certificate verification, and connection endpoints were separate concerns.

## Symptom

Prisma reported PostgreSQL connection failures, including `P1001`-style errors.

At first glance, this suggested that the database endpoint was unavailable. However, the same environment could reach the Supabase pooler over TCP, so the failure required deeper inspection.

## Investigation

The investigation compared the configured database endpoints and their actual network behavior.

The Supabase direct database hostname resolved to IPv6 addresses that were not reachable from the development environment. The Supabase pooler hostname resolved to reachable IPv4 addresses.

Raw TCP connectivity to the pooler on PostgreSQL port `5432` succeeded consistently.

A direct Node PostgreSQL client was then used with the configured `DIRECT_URL`, the Supabase CA certificate, and certificate verification enabled. PostgreSQL queries succeeded, demonstrating that the database itself was reachable and that the credentials and certificate chain could work correctly.

Prisma CLI behavior was more sensitive to the Node/OpenSSL certificate environment, which exposed a second layer of the problem.

## Root Cause

There were two distinct connectivity factors:

1. The direct Supabase database endpoint resolved to IPv6 addresses that were unreachable from the development network.
2. Node/Prisma certificate handling required the Supabase CA certificate to be supplied explicitly and the OpenSSL CA behavior configured consistently.

The failure therefore could not be attributed simply to PostgreSQL being down.

## Resolution

NutriCare was configured to use the Supabase pooler for normal application database traffic.

PostgreSQL TLS verification was made explicit. The application loads the Supabase CA certificate when `PGSSLROOTCERT` is configured and uses:

`rejectUnauthorized: true`

The Prisma CLI environment was also configured to use the CA certificate and OpenSSL certificate handling consistently.

The CA certificate is stored under:

`certs/prod-ca-2021.crt`

and certificate files under `certs/` are excluded from Git.

## Lesson

A database connection failure must be decomposed into:

**DNS resolution → network reachability → TLS negotiation → authentication → connection capacity → query execution**

Changing database URLs or disabling certificate verification without isolating those layers can conceal the actual problem.

TLS verification should remain enabled in production-oriented configuration.

## Prevention

- Keep TLS certificate verification enabled.
- Pin the trusted CA certificate explicitly where required.
- Use the Supabase pooler deliberately for application traffic.
- Keep direct/session connection usage limited to operations that require it.
- Test DNS and TCP connectivity separately from application-level database access.
- Avoid treating a Prisma `P1001` error as proof of a database outage without checking the lower layers.

## Related Work

The connection-slot exhaustion investigation is documented in:

`Docs/engineering/incidents/001-database-connection-slots.md`
