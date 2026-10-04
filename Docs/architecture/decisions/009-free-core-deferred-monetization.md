# ADR 009: Free Core and Deferred Monetization

- Status: Accepted
- Date: 2026-09-06

## Context

NutriCare is being moved from a prototype into a coherent product. The core personal nutrition journey is the product's primary value loop:

Assess → Goal → Plan → Track → Evaluate → Adjust → Track

The existing subscription and Stripe implementation was prototype-era infrastructure rather than a validated product requirement. The application had a subscription tier field, Stripe customer field, checkout route, Stripe webhook, and pricing UI oriented around payment, but there was no established product need requiring payment for the core personal experience.

## Decision

NutriCare's core personal nutrition experience is free at this stage.

The product will not require a subscription or payment to:

- complete the nutrition assessment;
- select a nutrition goal;
- receive a nutrition plan;
- track weight;
- evaluate progress;
- receive plan adjustment recommendations;
- apply accepted plan adjustments;
- view personal history and reports.

The prototype subscription fields and Stripe checkout/webhook implementation are retired from the live application.

Future monetization may be introduced around validated additional capabilities, such as clinician workflows, programme tooling, organization capabilities, advanced reporting/coaching, or integrations. Such monetization is deferred until those capabilities have a validated product case.

## Consequences

### Positive

- Removes payment complexity from the core product.
- Keeps the primary user journey accessible while the product model is being validated.
- Eliminates unused Stripe and subscription infrastructure.
- Reduces security, operational, and maintenance surface area.

### Negative

- NutriCare has no direct subscription revenue model at this stage.
- Future paid capabilities will require a new product and technical design rather than extending the retired prototype billing implementation.

## Implementation

On 2026-09-06:

- Removed `subscriptionTier` and `stripeCustomerId` from `User`.
- Removed the `SubscriptionTier` enum.
- Removed subscription fields from authentication/session types.
- Deleted `/api/checkout`.
- Deleted `/api/webhook/stripe`.
- Replaced the pricing page with a free-core product/capabilities page.
- Applied migration `20260906133433_remove_subscription_billing`.
- Regenerated Prisma Client 7.7.0.
- Verified the live application contains no remaining subscription/Stripe references outside historical legacy migration artifacts.
- Regression verification passed: 43 test files and 224 tests.
- TypeScript verification passed.
- Production build passed.

Historical migration files are retained unchanged as migration history.
