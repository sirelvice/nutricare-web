# NutriCare — Product Blueprint v1

**Status:** Draft for review
**Owner:** [Your name]
**Context:** NutriCare started as a Year 4 academic project — a set of BMI/calorie calculators wired to a dashboard. This document reframes it as a real product before any further code is written.

---

## 1. Vision

> NutriCare helps people understand their current health and nutrition position, choose a realistic goal, receive actionable guidance, track their progress, and continuously adjust their approach.

NutriCare is **not** a medical diagnosis tool and **not** a standalone calculator. It's a personal nutrition and wellness companion — the kind of app someone could see, use for two minutes, and say "oh, this is a real product."

---

## 2. The core problem

People who want to improve their health typically know a handful of numbers (weight, maybe BMI) but not what to *do* with them. Generic calculators give a number and stop. NutriCare's job is to close the gap between **data** and **decision**.

**Important framing correction:** most nutrition apps default to weight-loss as the assumed goal. NutriCare should not. Someone trying to gain weight and struggling despite consistent effort (e.g. a naturally high metabolism, or years of a stable weight despite adequate intake) has exactly the same underlying problem as someone trying to lose weight — a gap between effort and result, and no clear feedback loop telling them what to adjust. The product must treat **gain, maintain, and lose** as three equally supported paths, not "lose" plus two afterthoughts.

---

## 3. Primary user

**Individual seeking practical, personalized nutrition guidance and lightweight progress tracking, without needing to understand nutrition science themselves.**

Secondary/future users (not built now, but the reason `USER` / `CLINICIAN` / `ADMIN` roles already exist in the schema):
- Nutritionists / clinicians managing multiple clients
- Clinics or employer wellness programs

We do **not** design for these secondary users yet — we only avoid closing the door on them.

---

## 4. The core product loop

This loop is the backbone every feature must plug into. If a feature doesn't sit somewhere on this loop, it's a candidate for cutting.

```
"Where am I?"        →  ASSESS
"Where do I want      →  GOAL
 to go?"
"How do I get there?" →  PLAN
"Am I progressing?"   →  TRACK
"What should I        →  INSIGHTS
 change?"
        ↺  (back to ASSESS/PLAN, repeat weekly)
```

---

## 5. Product pillars

| Pillar | Purpose | MVP? |
|---|---|---|
| **Profile** | Establish the user's baseline (age, sex, height, weight, activity, goal) | Yes |
| **Assessment** | BMI + relevant health metrics — one input among several, not the product | Yes |
| **Nutrition Plan** | Calories, macros, and practical guidance tied to the user's goal | Yes |
| **Tracking** | Weight logging, and later other measures, to create a feedback loop | Yes |
| **Progress** | Visual, honest answer to "am I getting closer to my goal?" | Yes |
| **Insights** | Plain-language weekly interpretation of the data ("what changed, what to do next") | Yes (basic) |
| **Reports** | Exportable/shareable summaries | Later |
| **Education** | Just-in-time explanations ("what does BMI actually mean?") | Later |
| **Meal Assistance** | "What should I eat today?" suggestions based on targets/preferences | Later (differentiator) |
| **Account** | Auth, subscription, preferences | Yes (already exists, needs cleanup) |

---

## 6. First 10 minutes — target experience

Today: user lands, calculates BMI, sees a number, leaves.

**Target:** user lands → creates a profile → gets an assessment (BMI + calorie estimate) → is immediately shown a **goal-oriented nutrition plan** (not just a number) → is prompted to log their first weight entry. They leave having received a *plan*, not a calculation.

---

## 7. What brings them back weekly

- A **weekly insight** ("You lost 0.6kg this week. You logged 4 of 7 days — consistency is your biggest opportunity.")
- Visible **progress toward goal** (progress bar / trend, not raw table rows)
- A reason to log something small and low-friction (weight, and later adherence/meals)

Tracking + Insights together are what turn this from a calculator into a habit.

---

## 8. MVP scope (v2)

**In scope:**
1. Profile creation/edit (baseline attributes)
2. Assessment: BMI + estimated energy needs, computed from a single centralized domain service (not scattered calculators)
3. Goal setting (lose / maintain / gain weight, with target)
4. Nutrition plan: daily calorie target + macro breakdown + 2–3 practical focus/limit suggestions
5. Weight tracking: log entries, see history
6. Progress view: starting weight, current, goal, % progress, trend
7. Basic weekly insight (rule-based to start — no ML required for v1)
8. Auth (cleaned up, not rebuilt from scratch)

**Explicitly out of scope for v2 MVP:**
- Meal planning / "what should I eat today" AI assistant
- Clinician-facing surface
- Payments/subscriptions (build the free/paid *boundary* in the data model, but don't wire up billing yet)
- Chat feature
- Advanced analytics/reports/export
- Education content library (can stub the section, not populate it)

---

## 9. Monetization hypothesis (not final — for direction only)

**Free tier**
- Profile, basic assessment, basic calorie estimate, basic tracking, basic progress

**NutriCare Plus (future)**
- Personalized nutrition plans with macro-level detail
- Meal planning
- Advanced analytics / weekly insights
- Exportable reports
- Goal programs, extended history

**Professional (future, separate surface)**
- Clinician → patient list → patient profile/progress → plan → reports → follow-up

We are not committing to pricing now. We're only making sure the data model doesn't block this later (e.g., a `plan_tier` concept on the user, feature flags rather than hardcoded access).

---

## 10. Goal diversity & real-world scenarios

This section exists because it's easy to design a nutrition app around "lose weight" and quietly make everything else a second-class path. We're deliberately brainstorming the messier, real scenarios so the product logic and insights hold up against them.

### 10.1 The three goal types must be symmetric
- **Lose weight** — calorie deficit, protein-forward guidance
- **Gain weight** — calorie surplus, strength/consistency-forward guidance
- **Maintain** — stability tracking, no deficit/surplus framing at all

Every plan, insight, and progress screen must render correctly for all three — not "loss" with "gain" as a copy-paste with the sign flipped. A hard-gainer's plan should feel as considered as a weight-loss plan (calorie-dense meal patterns, frequency of eating, resistance-training pairing suggestions), not just "eat more" restated.

### 10.2 The "doing everything right, nothing's changing" scenario
This is the most important edge case to design for, because it's common and it's where most apps fail people. Example pattern: a user logs consistently, appears to be in a calorie surplus (or deficit) on paper, and their weight doesn't move for weeks or months.

NutriCare should not:
- Silently keep showing the same static plan as if it's working
- Guess at a medical cause or diagnose anything (metabolic conditions, malabsorption, hormonal factors, etc. are outside scope and outside our competence)

NutriCare should:
- **Detect the plateau** from tracked data (no meaningful weight change over a defined window despite logged adherence)
- **Surface it honestly** in the weekly insight rather than hiding it behind an unchanged "on track" message
- **Suggest a concrete next step within the app's scope** — e.g. re-check portion/logging accuracy, consider a calorie adjustment, review consistency
- **Recommend professional consultation** when the pattern persists beyond a reasonable window (e.g. 4–6 weeks of consistent logging with no change) — this is a UX/insight-copy decision, not a diagnostic feature. The app's job is to say "this is outside what tracking alone can explain — worth talking to a doctor or dietitian," not to speculate why.

This is a **product differentiator**, not just an edge case: most calculator apps have no concept of "the plan isn't working, here's what to do about it." Insights that only ever say "great job, keep going" will feel dishonest to someone in exactly your described situation — four years of no movement despite consistent effort.

### 10.3 Other scenarios worth designing against (non-exhaustive)
- User has a goal but irregular/inconsistent logging — insight should address *consistency* as the blocker, not just the numbers
- User's goal is unrealistic for the timeframe they set — plan generation should gently flag this at goal-setting time, not just fail silently
- User reaches their goal — the loop needs a "goal achieved, what next" state (new goal, switch to maintain), not a dead end
- User's weight moves in the *opposite* direction of their stated goal — insight should call this out clearly and non-judgmentally, not just log it as a neutral data point

### 10.4 Implication for MVP scope
Plateau/stuck-progress detection in the weekly insight (10.2) is worth pulling into MVP — it's cheap to implement (a data-pattern check, not a model) and it's the single feature most likely to make the product feel genuinely useful rather than decorative.

## 11. Non-functional principles

- **Every feature must answer:** *What user problem does this solve, and does it make the core loop better?* If not, it doesn't ship.
- Prefer **fewer, well-built features** over feature breadth — the current app's mistake was breadth without a spine.
- Data model changes are driven by product decisions, not the other way around.

---

## 12. Open questions to resolve before build

1. Do we log weight only, or also measurements (waist, etc.) in v2?
2. Is the weekly insight rule-based (if/else on trend data) or do we want an LLM-generated summary from day one? (Recommendation: rule-based first — cheaper, deterministic, testable.)
3. Do we keep the existing `CLINICIAN`/`ADMIN` roles in the schema for v2, or strip them out until the Professional surface is actually scoped? (Recommendation: keep the columns, build zero UI for them.)
4. What window defines a "plateau" for the purposes of 10.2 (e.g. 4 weeks? 6 weeks?), and does it differ by goal type (gain plateaus may need a longer window than loss, since gain tends to be slower)?
5. What thresholds define the progress states (on track, behind, plateau, opposite direction), and how much tracking is required before an insight is considered reliable?
6. Which plan adjustments are safe and transparent enough for MVP to recommend automatically, versus requiring the user to review/confirm?
