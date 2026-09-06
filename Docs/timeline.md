# NutriCare Timeline

This timeline records major product and engineering milestones. It is intentionally high-level; detailed implementation history belongs in incident reports and architecture decision records.

## 2026

### Product direction
- Reframed NutriCare from an academic/prototype application into a real nutrition and wellness product.
- Established the product loop: **Assess → Goal → Plan → Track → Evaluate → Adjust → Track**.
- Established symmetric goals: `LOSE`, `GAIN`, and `MAINTAIN`.
- Established non-diagnostic progress states and recommendation semantics.
- Defined plan versioning and evaluation boundaries around nutrition-plan versions.

### Architecture
- Adopted layered architecture:
  **UI → API / Route Handlers → Application Services → Domain Logic → Repositories → PostgreSQL**.
- Established pure domain functions, orchestration services, repository-only database access, thin API routes, and presentation-focused UI.
- Kept Next.js route handlers as the application API layer for the current scope.

### Progress evaluation
- Added the progress evaluation domain.
- Added persisted progress evaluations linked to nutrition-plan versions.
- Added typed recommendations:
  `CONTINUE`, `REVIEW_ADHERENCE`, `CONSIDER_ADJUSTMENT`, and `SUGGEST_PROFESSIONAL_CONSULT`.
- Established the seven-day evaluation cadence triggered by weight logging.
- Established within-plan escalation after two consecutive problem evaluations.
- Established immediate professional-consult escalation when the same problem recurs in the next plan period after an adjustment.

### Adjustment workflow
- Added persisted adjustment decision state.
- Added the API workflow for accepting or declining an adjustment recommendation.
- Added the dashboard decision point for the user.
- Implemented accepted adjustments as a transactional workflow that creates the next nutrition-plan version and marks the recommendation accepted atomically.
- Added stale-plan protection and cross-user authorization checks at the workflow persistence boundary.
- Updated the dashboard to reflect the newly active nutrition-plan version immediately after acceptance.
- Completed the plan-period lifecycle: new plan versions start fresh evaluation windows, and recurrence after an accepted adjustment now escalates to professional consultation.

### Engineering hardening
- Resolved PostgreSQL/Supabase TLS certificate verification and connectivity issues.
- Added test coverage across progress evaluation, recommendation, persistence, services, and API contracts.
- Reached a clean TypeScript check and successful production build.
