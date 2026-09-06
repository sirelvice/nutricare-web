# ADR 010 — Secure Password Reset Flow

## Status

Accepted

## Date

2026-09-06

## Context

NutriCare's original forgot-password experience was prototype behavior: it simulated an API request and displayed a success message without creating a real reset credential or sending an email.

A real product needs a server-side password-reset flow that does not expose whether an email address belongs to an account and does not persist usable reset credentials.

## Decision

NutriCare uses a server-side, single-use password-reset flow backed by PostgreSQL and email delivery through Resend.

The flow is:

1. Validate the submitted email address with Zod.
2. Return the same successful response for unknown accounts to prevent account enumeration.
3. Generate a cryptographically random reset token.
4. Persist only a SHA-256 hash of the token.
5. Expire reset tokens after one hour and invalidate prior unused tokens for the user.
6. Send the raw token only through the password-reset email link.
7. On reset, validate the token hash, expiry, and unused state.
8. Atomically claim the token before changing the password, preventing concurrent reuse.
9. Hash the replacement password with bcrypt.
10. Invalidate other outstanding reset tokens after a successful password change.
11. If email delivery fails after token creation, remove the newly created token so an unusable reset credential is not left behind.

The email service must be explicitly configured. Missing mail configuration returns a service-unavailable response rather than pretending that an email was sent.

Password-reset operations are exposed through:

- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

The UI uses these APIs and does not perform password-reset persistence itself.

## Consequences

- Reset credentials are never stored in plaintext.
- Reset links are time-limited and single-use.
- Email existence is not disclosed by the forgot-password endpoint.
- Password changes and token consumption are protected by an atomic database workflow.
- Email delivery is now a real runtime dependency for password recovery.
- The core authentication flow remains server-authoritative and PostgreSQL-backed.

## Validation

The implementation is covered by dedicated route tests for:

- invalid input;
- account-enumeration protection;
- missing email-service configuration;
- reset-token creation and email delivery;
- email-delivery failure cleanup;
- missing, expired, and already-used tokens;
- successful password replacement;
- concurrent token-claim failure.

The full regression checkpoint on 2026-09-06 passed with 46 test files and 238 tests, TypeScript compilation, and a production build.
