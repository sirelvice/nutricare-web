# RFC: NutriCare v2 — From Prototype to Product

**Status:** Draft
**Depends on:** `01-nutricare-product-blueprint.md`
**Scope:** How we take the existing NutriCare codebase (a Year 4 project) and rebuild it against the product blueprint, without a rewrite-from-scratch.

---

## 1. Summary

The current app was built feature-first: "I need another page → write some React → localStorage/API → another calculation." This RFC proposes inverting that flow so every piece of code traces back to a product requirement, and lays out the concrete engineering steps, branching model, and migration order to get there.

```
Product requirements
        ↓
    Features
        ↓
Application services
        ↓
   Domain logic
        ↓
    Database
        ↓
       UI
        ↓
     Tests
```

---

## 2. Current state (what we inspected)

- Existing flow: `User → Profile → Weight → BMI → Calories → Macros → Recommendations → History → Reports`
- Auth, marketing pages, and contact functionality exist and are broadly fine
- Placeholders exist for payments and chat (not implemented — leave as placeholders)
- `USER` / `CLINICIAN` / `ADMIN` roles already exist in the schema
- Calculation logic (BMI, calories, macros) appears to be duplicated/scattered rather than centralized
- No test coverage identified yet

**Verdict:** the prototype is real evidence of a working product concept — it is not being discarded, it's being restructured.

---

## 3. Target architecture

### 3.1 Layering

| Layer | Responsibility | Example |
|---|---|---|
| **Domain logic** | Pure calculation/business rules, no I/O | `calculateBMI()`, `calculateEnergyNeeds()`, `calculateMacros()`, `generateWeeklyInsight()`, `detectPlateau()` |
| **Application services** | Orchestrate domain logic + repositories to fulfill a use case | `AssessUserService`, `GenerateNutritionPlanService`, `RecordWeightEntryService`, `GenerateWeeklyInsightService` |
| **Repositories** | Persistence boundary — the only layer that talks to the database | `UserProfileRepository`, `WeightEntryRepository`, `NutritionPlanRepository` |
| **API / routes** | Thin HTTP layer, validates input, calls a service, returns a response | `POST /api/assessments`, `POST /api/weight-entries` |
| **UI** | Consumes the API, renders state, no business logic | React components/pages |

**Rule:** domain logic must be pure functions with no dependency on the framework, database, or HTTP layer. This is what makes it testable in isolation and what stops calculations from being copy-pasted across pages.

### 3.1.1 Goal-symmetric calculation logic (new requirement)

Per the blueprint (§10), `calculateMacros()` and plan generation must not be a "loss" formula with a sign flip bolted on for gain. Concretely:

- `calculateEnergyNeeds(profile, goal)` returns a target that branches on `goal.type` (`LOSE` / `GAIN` / `MAINTAIN`), each with its own surplus/deficit logic and reasonable bounds (e.g. don't recommend an unsafe deficit or an unrealistic surplus) — implemented as three explicit, independently testable code paths, not one path with a multiplier flag.
- `generateNutritionPlan()` output copy (focus/limit guidance) must differ meaningfully by goal type — a gain plan should surface calorie-dense meal patterns and eating frequency, not the loss plan's language with numbers swapped.

**New domain function: `detectPlateau(weightHistory, goal, windowDays)`**
- Pure function, takes a user's weight entry history + their active goal + a configurable window
- Returns whether the trend over that window is flat relative to the expected trajectory implied by the goal
- Threshold (window length, minimum flatness) should be a named constant, not a magic number, and may differ by goal type (see blueprint open question §12.4)
- This function feeds `GenerateWeeklyInsightService` — when it returns true, the insight generator selects plateau-specific copy instead of default progress copy (see design doc §4 for the actual message)
- Out of scope for this function: any diagnosis or causal explanation. It only detects the pattern; insight copy is responsible for recommending logging-accuracy review or professional consultation, per blueprint §10.2.

### 3.1.2 Progress state evaluation

Weekly insight generation should operate on a normalized progress state rather than directly composing copy from raw weight change. The domain layer should expose a pure function such as `evaluateProgress(weightHistory, goal, window)` that returns a typed evaluation:

- `ON_TRACK`
- `BEHIND_OPPOSITE`
- `PLATEAU`
- `INSUFFICIENT_DATA`

`GOAL_ACHIEVED` is intentionally deferred until the richer goal model defines an explicit target/range and lifecycle semantics.

The evaluator must be goal-aware: the same weight movement can have different meanings for LOSE, GAIN, and MAINTAIN. It must also distinguish missing/sparse data from a genuine plateau.

Current MVP evaluation rules are explicit rather than implied:

- Minimum 3 weight entries
- Minimum 14 days between the earliest and latest entries used for evaluation
- Meaningful movement threshold: 0.5 kg
- MAINTAIN is `ON_TRACK` within ±0.5 kg; movement outside that tolerance is treated as moving away from the maintenance goal

These thresholds are named/configurable inputs to the pure domain function and are unit tested.

**Plan-version boundary:** the pure domain evaluator remains completely unaware of nutrition plans and plan versions. The application service is responsible for resolving the active nutrition plan version, taking its `created_at` as the start of the evaluation period, fetching only weight entries recorded from that boundary onward, and passing that pre-filtered history to the domain function. This prevents a new plan from being evaluated against measurements collected under a previous plan.

A newly created plan therefore naturally produces `INSUFFICIENT_DATA` until enough post-plan-change history exists; no separate cooldown state is required.

The service-level output is then available to the adjustment recommendation layer. Human-facing copy does not belong in the domain evaluator or recommendation decision function; wording belongs in the insights/UI layer.

### 3.1.3 Plan adjustment boundary

Tracking and insights should be architected as a feedback loop, not a one-time calculation. MVP should support recommending a review or controlled target adjustment when progress is persistently behind, plateaued, or moving in the opposite direction. It should not silently rewrite a user's plan from a single noisy measurement.

A future implementation may introduce an explicit `AdjustNutritionPlanService`, but the current architecture should keep the decision boundary in the application/domain layers so the UI never owns this logic.

### 3.1.4 Adjustment recommendation and escalation

Adjustment recommendations are a separate decision layer after progress evaluation. The recommendation domain returns a typed object rather than presentation text, for example:

```ts
{
  state,
  recommendedAction:
    | "CONTINUE"
    | "REVIEW_ADHERENCE"
    | "CONSIDER_ADJUSTMENT"
    | "SUGGEST_PROFESSIONAL_CONSULT",
  reason,
}
```

The recommendation domain must never silently mutate a nutrition plan. A recommendation may lead to a user-controlled or explicitly authorized plan change, which creates a new nutrition-plan version and therefore a new evaluation boundary.

Two escalation signals are intentionally distinct:

1. **Repeated same-state readings within one plan period.** Two consecutive `PLATEAU` or `BEHIND_OPPOSITE` evaluations within the same plan version produce `CONSIDER_ADJUSTMENT`.
2. **Recurrence after an adjustment.** If the same problem recurs in the next plan period after the plan was already adjusted in response to that problem, the recommendation escalates directly to `SUGGEST_PROFESSIONAL_CONSULT`; it does not wait for another two-reading streak.

`progress_evaluations` therefore records the nutrition-plan version associated with each evaluation. A streak must be evaluated within a plan period, while recurrence detection compares evaluation history across plan-version boundaries.

The public progress API should return the progress evaluation and its recommendation together in one response because they form one logical decision step. No second dashboard round trip is required merely to obtain the recommendation.

The recommendation layer remains non-diagnostic and health-conscious. It can recommend continued tracking, adherence review, a modest review/adjustment, or professional consultation, but it must not claim a medical cause for the observed trend.

### 3.1.5 Goal lifecycle

Goals are historical records, not a single mutable field. The active goal is the current decision context; completed or abandoned goals remain available for progress history. A future richer goal model may introduce a `GOAL_ACHIEVED` state and support a transition to maintenance or a new goal; that state is deferred for now.

### 3.2 Data model (v2 direction)

Centered on the product loop, not on pages:

- `users` (auth, role, plan_tier)
- `profiles` (age, sex, height, activity_level — baseline attributes)
- `goals` (goal_type, target_weight, target_range, start_weight, goal_date, status/active flag, created/completed timestamps)
- `weight_entries` (user_id, weight, recorded_at)
- `assessments` (computed snapshot: bmi, estimated_calories, computed_at — derived, cache-only, always re-derivable from profile+weight)
- `nutrition_plans` (calorie_target, macro breakdown, tied to an active goal, versioned)
- `progress_evaluations` (user_id, plan_version_id, goal context, evaluation window/metrics, normalized state, created_at)
- `insights` (generated weekly summary text + underlying metrics, for history/audit)

`assessments` and `insights` are **derived data** — they should be regenerable from source data at any time, not treated as the source of truth.

### 3.3 Database

Move persistence to Postgres (already implied by prior discussion — replacing localStorage-based state). Repositories abstract this so domain/service layers never see SQL directly.

---

## 4. Migration plan

We are **not** doing a big-bang rewrite. We branch, and move the existing prototype toward the target architecture in small, reversible steps.

### 4.1 Branching

```
main
 │
 └── refactor/nutricare-v2
       ├── commit
       ├── commit
       └── ...
```

- `main` stays deployable/stable throughout.
- All v2 work happens on `refactor/nutricare-v2` (or feature branches off it, if the team grows).
- Merge to `main` only at meaningful, tested checkpoints — not every commit.

### 4.2 Commit discipline

Small, single-purpose commits with conventional prefixes:

```
test: add BMI calculation coverage
refactor: centralize metabolism calculations
test: add recommendation engine coverage
refactor: introduce user profile repository
feat: persist user profiles in postgres
feat: persist weight entries
feat: compute weekly insight from weight history
```

This gives a history that's easy to review, bisect, and revert.

### 4.3 Sequenced milestones

1. **Baseline commit** — snapshot current app as-is on the new branch before any changes.
2. **Extract domain logic** — pull BMI/calorie/macro calculations out of components into pure, tested functions. No behavior change yet.
3. **Introduce repositories** — wrap existing persistence behind repository interfaces, even before moving off localStorage, so the swap to Postgres later touches one seam.
4. **Move to Postgres** — implement repositories against Postgres; migrate profile, then weight entries, then plans. One entity at a time, each its own commit/PR.
5. **Application services** — build `AssessUserService`, `GenerateNutritionPlanService`, `RecordWeightEntryService`, `GenerateWeeklyInsightService` on top of the domain + repository layers.
   - Progress evaluation is assembled inside the application service by resolving the active nutrition-plan version and filtering weight history to that plan boundary.
   - Adjustment recommendation is computed from the current evaluation plus persisted evaluation history, including same-period streaks and recurrence across plan versions.
6. **API layer** — thin routes calling services; remove any calculation logic left in route handlers. `GET /api/progress` returns the evaluation and adjustment recommendation together.
7. **UI rebuild per pillar** — Profile → Assessment → Plan → Tracking → Progress → Insights, in that order, matching the blueprint's MVP scope. Each pillar's UI is only built once its service/domain layer is tested.
8. **Cut scope not in MVP** — chat/payments stay as inert placeholders; clinician role stays in schema, unused in UI.

### 4.4 Testing strategy

- Domain logic: unit tests, high coverage (pure functions — cheap to test, highest ROI).
- Services: integration tests against a test database.
- API: contract tests for request/response shape.
- UI: light — smoke tests on critical flows (create profile → get plan → log weight → see progress), not exhaustive coverage.

Test framework: introduce **after** the blueprint is settled (not before) — write tests for the domain logic as it's extracted in milestone 2, rather than installing a test runner speculatively with nothing to test yet.

---

## 5. Explicit non-goals for this RFC

- No framework migration (assume current frontend stack stays unless a separate RFC argues otherwise)
- No payments implementation
- No AI/meal-planning implementation
- No clinician-facing UI

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| Scope creep back into "add another page" mode | Every PR must cite which product pillar (from the blueprint) it serves |
| Migration stalls mid-way, leaving two data paths (localStorage + Postgres) | Migrate one entity fully (read+write+delete) before starting the next |
| Domain logic re-duplicated inside UI components again | Lint/review rule: no arithmetic/business rules inside `.tsx`/`.jsx` files — must live in domain layer |

---

## 7. Open decisions

1. Use the existing Prisma + PostgreSQL stack for v2. No ORM migration is planned.
2. Where weekly insight generation runs — on-demand at request time vs. a scheduled job. Recommend on-demand for v1 (simpler, no infra needed).
3. **Resolved:** progress evaluation uses a minimum of 3 entries, a minimum 14-day evaluation span, a 0.5 kg meaningful-movement threshold, and ±0.5 kg maintenance tolerance.
4. **Resolved:** progress evaluation is bounded by the active nutrition-plan version. The application service filters weight history from the plan version's `created_at`; the pure domain function does not know about plans.
5. **Resolved:** two consecutive `PLATEAU` or `BEHIND_OPPOSITE` evaluations within one plan period recommend `CONSIDER_ADJUSTMENT`.
6. **Resolved:** recurrence of the same problem in the next plan period after an adjustment recommends `SUGGEST_PROFESSIONAL_CONSULT` immediately.
7. **Resolved:** `progress_evaluations.plan_version_id` links each evaluation to the plan version that governed that period, enabling both within-period streaks and cross-period recurrence detection.
8. **Resolved:** `GET /api/progress` returns both the normalized progress evaluation and its typed adjustment recommendation in one response.
9. The exact storage representation of `reason` and whether recommendation history is persisted separately from `progress_evaluations` remain to be finalized during implementation; presentation copy remains outside the recommendation domain.
10. The richer goal model will be additive and should include target weight/range, start weight, and optional goal date before `GOAL_ACHIEVED` is introduced.
