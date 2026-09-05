# NutriCare v2 — Design Document

**Status:** Draft
**Depends on:** `01-nutricare-product-blueprint.md`
**Scope:** Information architecture, key screens, and design principles — the "what it should look and feel like" companion to the RFC.

---

## 1. Design principle

> The user should never see a raw number without an interpretation next to it.

"Your BMI is 27.4" is a calculator. "You're in the overweight range — here's a realistic target and what to do about it" is a product. Every screen should answer **so what?**, not just **what**.

---

## 2. Information architecture

```
NutriCare
│
├── Landing (marketing)
│
├── Auth (sign up / log in)
│
├── Onboarding
│   ├── Profile setup (age, sex, height, activity)
│   ├── Weight + goal capture
│   └── First plan reveal
│
├── Dashboard (home once logged in)
│   ├── Progress snapshot
│   ├── This week's insight
│   ├── Today's targets (calories/macros)
│   └── Quick-log weight
│
├── Assessment
│   └── BMI + estimated energy needs (with interpretation)
│
├── Plan
│   ├── Calorie target
│   ├── Macro breakdown
│   └── Focus / limit guidance
│
├── Tracking
│   ├── Log weight entry
│   └── History list/chart
│
├── Progress
│   ├── Start → current → goal
│   └── Trend chart
│
├── Insights (weekly)
│   └── Plain-language summary + recommendation
│
├── Account
│   ├── Profile edit
│   ├── Goal edit
│   └── (Plus tier — future)
│
└── [Stubbed, not built] Education / Reports / Chat / Payments
```

Notice: **no standalone "BMI Calculator" nav item.** BMI lives inside Assessment, as one input among several — never the destination.

---

## 3. Key screens

### 3.1 Onboarding → First plan reveal
This is the moment that replaces "here's your BMI" with "here's your plan." After profile + goal capture, the user should immediately see:

```
Your goal: Lose 8 kg

Daily target: ~2,100 kcal

Macros
  Protein   140g
  Carbs     230g
  Fat        70g

Focus
  ✓ More protein
  ✓ More vegetables
  ✓ Consistent meals

Limit
  ↓ Sugary drinks
  ↓ Highly processed snacks

[ Start tracking → ]

The plan should communicate that it is a starting point and that NutriCare will use subsequent progress to determine whether it should be maintained or reviewed.
```

This screen is the single most important one to get right — it's the difference between "calculator" and "product" in the user's first two minutes.

### 3.2 Dashboard (returning user)
The home screen after login. Four zones, in priority order:

1. **This week's insight** (top — the reason to come back)

   The copy here must branch by goal type and by whether a plateau has been detected (see RFC §3.1.1). It is not one template with the sign flipped.

   *Weight-loss goal, on track:*
   > "You lost 0.6 kg this week. Your trend is moving toward your goal. You logged 4 of 7 days — consistency is your biggest opportunity."

   *Weight-gain goal, on track:*
   > "You gained 0.3 kg this week — right in line with a steady gain pace. Your protein intake was consistent 5 of 7 days, which is doing the heavy lifting here."

   *Plateau detected (either goal direction):*
   > "Your weight hasn't moved much over the past 5 weeks, even though you've been logging consistently. That's worth paying attention to — first, double-check portion sizes are being logged accurately. If it continues, this is a good point to talk to a doctor or dietitian, since tracking alone can't tell us why."

   The plateau message is deliberately honest rather than falsely encouraging — per blueprint §10.2, this is the case a generic calculator app never handles, and it's the one most likely to matter to someone who's been stuck for months or years.
2. **Progress snapshot** — start/current/goal + progress bar
3. **Today's targets** — calorie/macro numbers, at a glance
4. **Next action** — a single clear action based on the current progress state (for example, keep going, log more consistently, review the plan, or transition after reaching the goal)
5. **Quick-log** — one-tap weight entry, minimal friction

### 3.3 Progress
```
Starting weight     82 kg
Current weight      77.4 kg
Goal weight          74 kg

Progress   █████████░ 80%
Change     -4.6 kg
```
Plus a trend line chart (weight over time). This is where the charting work already done becomes genuinely useful — trend, not just table rows.

The progress screen should also show a clear **status**, not just a percentage:

- **On track:** your trend is moving toward your goal.
- **Behind:** progress is moving in the right direction, but slower than expected.
- **Plateau:** your weight has been stable for the defined observation window and there is enough data to say so.
- **Opposite direction:** your trend is moving away from your goal.
- **Not enough data:** there are not enough recent entries to judge the plan yet.
- **Goal achieved:** the target has been reached; offer maintenance or a new goal.

The status should be visually prominent but calm. It is a decision aid, not a pass/fail grade.

### 3.4 Assessment
BMI and estimated energy needs shown together, each with a one-line interpretation ("Your BMI is in the [range] range — this is one signal among several, not a diagnosis"). Never shown as an isolated number with no context.

---

### 3.5 Progress-state experience

The product should make the feedback loop visible without overwhelming the user. A typical returning-user experience is:

```
Current goal → Current trend → Progress state → What this means → Next action
```

For example, a gain user whose weight has not changed for several weeks should not see an unchanged dashboard that implies success. They should see that progress is stalled, understand that the app cannot determine the cause, and receive a bounded next step such as reviewing logging consistency or revisiting the plan.

If there is insufficient data, the UI should explicitly say that rather than manufacturing certainty.

## 4. Visual/UX direction

- **Tone:** calm, encouraging, non-clinical. Avoid alarming color coding on BMI ranges (no harsh red for "overweight") — use neutral, supportive framing per the wellbeing-conscious tone the product needs.
- **Data density:** low. One key number per card, with a short interpretive sentence beneath it — not dense tables as the default view.
- **Motion/feedback:** logging an entry should feel immediate and rewarding (a small progress animation, not just a table row appended).
- **Consistency:** the same "number + interpretation" card pattern should be reused across Assessment, Plan, and Progress so the product feels like one coherent system, not five different calculators bolted together.

---

## 5. What we are deliberately not designing yet

- Meal planning / "what should I eat today" UI
- Clinician-facing screens (patient list, patient progress, follow-up)
- Reports/export UI
- Payment/upgrade flow UI
- Education content pages (nav item can exist as "Coming soon," no content yet)

These are placeholders in the IA so the product doesn't need re-architecting later, but zero design/build effort goes into them for v2.

---

## 6. Success signal for this design

If someone unfamiliar with the project opens the app after v2 and, within the first two minutes, can say what their plan is and what to do next **without being told "this is a BMI calculator,"** the design has done its job.
