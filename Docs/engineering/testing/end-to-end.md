# NutriCare Manual End-to-End Testing

This document defines manual end-to-end user journeys for NutriCare.

Unlike the broader `manual-regression.md` checklist, these scenarios should be performed as complete user journeys through the application UI.

The purpose is to answer:

> Can a real user successfully move through NutriCare's core product experience from beginning to end?

The primary product loop is:

**Assess → Goal → Plan → Track → Evaluate → Adjust → Track**

## V3 release context

Retain the journeys introduced in PR #18 as the core baseline. V3 adds compact disclosures, profile/age eligibility states, independent loading and recovery, saved-plan comparison and branded server PDF output. Visible controls may differ from the earlier prototype; verify the user outcome through the current UI.

Record execution against the exact deployment/commit in [V3 release evidence](v3-release-evidence.md). Existing scenario descriptions and prior test runs are not a V3 manual sign-off. Use the companion [manual regression checklist](manual-regression.md) and [security review](v3-security-review.md).

## How to use this document

For each journey:

1. Start from the stated preconditions.
2. Perform the steps through the UI unless explicitly stated otherwise.
3. Verify the expected results as you go.
4. Record failures with the step where they occurred.
5. Do not use real production user data for destructive testing.

Record the test context:

- Environment:
- Deployment / commit:
- Browser:
- Device / viewport:
- Tester:
- Date:

---

# E2E 01 — New user → first nutrition plan

## Preconditions

- Use an email address that does not already have a NutriCare account.
- Start signed out.

## Journey

### 1. Visit NutriCare

- Open the landing page.
- Confirm the page loads correctly.
- Follow the primary registration call to action.

**Expected:** Registration is easy to discover and there are no broken navigation paths.

### 2. Register

- Enter a valid name.
- Enter a new email address.
- Enter a valid password.
- Create the account.

**Expected:**

- Account creation succeeds.
- A clear success message is displayed.
- The user can proceed to sign in.

### 3. Sign in

- Enter the newly created credentials.
- Sign in.

**Expected:**

- Authentication succeeds.
- The user reaches the authenticated application.
- The application recognizes that setup is incomplete.

### 4. Complete profile

Open the profile/setup experience and enter valid:

- height,
- age,
- gender,
- activity level,
- goal.

Save the profile.

**Expected:**

- Validation succeeds.
- A clear saved state is shown.
- The selected goal is displayed correctly.
- Refreshing does not lose the profile.

### 5. Record starting weight

Open weight tracking.

- Enter a valid date.
- Enter the starting weight.
- Save the entry.

**Expected:**

- The entry is created once.
- The latest weight is updated.
- Refreshing preserves the entry.

### 6. Generate nutrition plan

Return to the dashboard and generate the nutrition plan.

**Expected:**

- Plan generation succeeds.
- Daily calorie target is shown.
- Macro targets are shown.
- Guidance matches the user's goal.
- The numbers have useful interpretation rather than appearing without context.

### 7. Verify persistence

Refresh the application and navigate between dashboard, profile, tracking, and history.

**Expected:**

- Profile remains saved.
- Starting weight remains saved.
- Active nutrition plan remains available.
- The application remains authenticated.
- Data is consistent across screens.

## Final outcome

The user has successfully completed:

**Assess → Goal → Plan**

Result: PASS / FAIL / BLOCKED / NOT RUN

Notes:

---

# E2E 02 — Returning user → track progress

## Preconditions

- Existing authenticated user.
- Completed profile.
- Active nutrition plan.
- At least one existing weight entry.

## Journey

### 1. Sign in

Sign in with the existing account.

**Expected:** Dashboard loads with the user's existing plan and data.

### 2. Open weight tracking

Navigate to weight tracking.

**Expected:** Existing/latest weight information is visible.

### 3. Add another weight entry

Enter a valid new weight for an appropriate date.

**Expected:**

- Entry saves successfully.
- Latest weight updates.
- No duplicate entry appears unexpectedly.

### 4. Check history

Open History.

**Expected:**

- The new entry appears.
- Previous entries remain present.
- Dates and weights are correct.
- Nutrition-plan history remains available.

### 5. Return to dashboard

**Expected:**

- Dashboard reflects the latest persisted information.
- Progress messaging is consistent with available data.

## Final outcome

The user has successfully completed:

**Track → review history → return to current state**

Result: PASS / FAIL / BLOCKED / NOT RUN

Notes:

---

# E2E 03 — New tracking data → insufficient progress data

## Preconditions

- Completed profile.
- Active nutrition plan.
- Too little post-plan tracking history for a meaningful evaluation.

## Journey

Add the available recent weight data and return to the dashboard/progress experience.

**Expected:**

- NutriCare explicitly communicates that there is not enough history yet.
- The state does not appear to be an application error.
- The UI does not manufacture a progress conclusion.
- The user understands that continued tracking is the next action.
- Recommendations do not contradict the insufficient-data state.

## Final outcome

The product correctly represents uncertainty.

Result: PASS / FAIL / BLOCKED / NOT RUN

Notes:

---

# E2E 04 — Sufficient tracking → progress evaluation

## Preconditions

Use a test account with enough appropriately dated weight history to trigger a meaningful evaluation.

The data should represent the progress state being tested.

## Journey

### 1. Sign in

Open the account after sufficient tracking history exists.

### 2. Review progress

Open the dashboard/progress experience.

**Expected:**

- Progress is evaluated using the available history.
- Current weight and goal are correct.
- The displayed trend agrees with the weight history.
- The progress state is explained in plain language.
- The user receives an understandable next action.

### 3. Verify goal direction

Confirm that the interpretation makes sense for the user's goal.

Examples include:

- on track,
- moving away from goal,
- plateau,
- other supported evaluated states.

**Expected:** The same weight movement is not incorrectly interpreted identically for opposing goals.

## Final outcome

The user has completed:

**Track → Evaluate**

Result: PASS / FAIL / BLOCKED / NOT RUN

Progress state tested:

Notes:

---

# E2E 05 — Progress problem → recommendation

## Preconditions

Use a test account whose tracking history legitimately produces a problem progress state and recommendation.

## Journey

### 1. Review dashboard/progress

**Expected:**

- Problem state is visible.
- Wording is calm and non-diagnostic.
- The UI explains what the state means.

### 2. Review recommendation

Open the recommendation experience where applicable.

**Expected:**

- Recommendation corresponds to the progress state.
- The user understands what NutriCare recommends doing next.
- Guidance does not claim to diagnose the reason for the user's progress.
- Professional consultation guidance appears when the domain state requires it.

## Final outcome

The user has completed:

**Evaluate → receive next action**

Result: PASS / FAIL / BLOCKED / NOT RUN

Notes:

---

# E2E 06 — Adjustment recommendation → decline

## Preconditions

- Active nutrition plan.
- Progress evaluation with a pending adjustment recommendation.

## Journey

### 1. Review recommendation

Open the dashboard.

**Expected:**

- The user can see that an adjustment is available.
- Both keeping the current plan and using the adjusted plan are understandable choices.

### 2. Keep current plan

Choose the option to keep the current plan.

**Expected:**

- Decision succeeds.
- Confirmation is shown.
- Adjustment actions are no longer presented as pending.
- Current plan remains active.

### 3. Verify history/state

Navigate away, refresh, and inspect plan/history information.

**Expected:**

- Current plan has not been replaced.
- The recorded decision remains consistent.
- The same pending adjustment cannot be acted on again.

## Final outcome

The user has completed:

**Evaluate → Adjust decision → keep current plan**

Result: PASS / FAIL / BLOCKED / NOT RUN

Notes:

---

# E2E 07 — Adjustment recommendation → accept

## Preconditions

- Active nutrition plan.
- Progress evaluation with a pending adjustment recommendation.

## Journey

### 1. Review adjustment

Open the dashboard and review the recommendation.

### 2. Accept adjusted plan

Choose the option to use the adjusted plan.

**Expected:**

- Adjustment succeeds.
- A clear confirmation is displayed.
- The newly adjusted nutrition plan becomes active.

### 3. Review active plan

Verify calorie/macronutrient information after adjustment.

**Expected:** Displayed targets correspond to the newly active plan.

### 4. Review history

Open nutrition-plan history.

**Expected:**

- Previous plan remains in history.
- New plan version appears.
- The new version is distinguishable from the previous version.
- Current application state uses the new plan.

### 5. Refresh

Refresh and navigate back to the dashboard.

**Expected:** The new plan remains authoritative after refresh.

## Final outcome

The user has completed:

**Evaluate → Adjust → new Plan → Track**

Result: PASS / FAIL / BLOCKED / NOT RUN

Notes:

---

# E2E 08 — Weight lifecycle

## Preconditions

- Authenticated user.

## Journey

### 1. Add weight

Create a valid weight entry.

**Expected:** Entry appears exactly once.

### 2. Refresh

**Expected:** Entry persists.

### 3. Review history

**Expected:** Entry appears with the correct date and value.

### 4. Delete the entry

Use the supported delete action.

**Expected:**

- Deletion succeeds.
- Entry disappears from the current view/history.
- Refreshing does not restore the deleted entry.
- Latest/progress information updates appropriately.

## Final outcome

Result: PASS / FAIL / BLOCKED / NOT RUN

Notes:

---

# E2E 09 — Recommendations

## Preconditions

- Authenticated user.
- Complete profile and the data required to produce recommendations.

## Journey

Open the recommendations experience.

**Expected:**

- BMI information is available where applicable.
- Calorie target is available.
- Macro targets are available.
- Priorities are understandable.
- Foods to focus on are displayed.
- Foods to limit are displayed.
- Next steps are displayed.
- Guidance is clearly informational and non-diagnostic.

Navigate away and return.

**Expected:** Recommendations remain consistent with the underlying profile/plan.

## Final outcome

Result: PASS / FAIL / BLOCKED / NOT RUN

Notes:

---

# E2E 10 — Authentication/session lifecycle

## Preconditions

- Existing test account.

## Journey

### 1. Sign in

**Expected:** User reaches authenticated content.

### 2. Refresh protected page

**Expected:** Session remains valid.

### 3. Navigate between protected pages

Visit dashboard, profile, tracking, history, recommendations, and report.

**Expected:** Authentication remains valid throughout navigation.

### 4. Sign out

**Expected:** Session ends.

### 5. Attempt to revisit protected content

**Expected:** Protected user information is no longer accessible without authentication.

## Final outcome

Result: PASS / FAIL / BLOCKED / NOT RUN

Notes:

---

# E2E 11 — Password reset

## Preconditions

- Existing test account.
- Password-reset email delivery configured for the environment.

## Journey

### 1. Request reset

Open Forgot Password and submit the account email.

**Expected:**

- Request completes without exposing whether an account exists.
- User receives appropriate next-step messaging.

### 2. Follow reset link

Open the received reset link.

**Expected:** Reset-password experience loads.

### 3. Set new password

Submit a valid new password.

**Expected:** Password changes successfully.

### 4. Reuse reset link

Attempt to use the same reset link again.

**Expected:** Previously consumed token cannot be reused.

### 5. Sign in

Sign in with the new password.

**Expected:** Authentication succeeds with the new password.

## Final outcome

Result: PASS / FAIL / BLOCKED / NOT RUN

Notes:

---

# E2E 12 — Personal report

## Preconditions

- Authenticated user with sufficient profile/plan/tracking data.

## Journey

Open the report experience.

**Expected:**

- Report belongs to the authenticated user.
- Profile information is correct.
- Plan information is correct.
- Tracking/progress information is consistent with the rest of NutriCare.

Use PDF/export functionality where available.

**Expected:**

- Export succeeds.
- Exported information belongs to the current user.
- No other user's private data is exposed.

## Final outcome

Result: PASS / FAIL / BLOCKED / NOT RUN

Notes:

---

# E2E 13 — Failure and recovery

## Journey

During suitable journeys, observe application behavior when an operation cannot complete.

Verify:

- validation failures preserve useful user input where appropriate,
- loading states are understandable,
- empty states explain what is missing,
- recoverable failures provide a next step,
- unavailable recommendations do not make the entire dashboard unusable,
- insufficient progress data is treated as a domain state rather than a system failure,
- authentication errors do not expose sensitive account information.

## Final outcome

Result: PASS / FAIL / BLOCKED / NOT RUN

Notes:

---

# E2E 14 — Mobile core journey

Repeat the critical new-user journey using a mobile-sized viewport:

**Register → Sign in → Profile → Goal → Weight → Plan → Dashboard → Tracking**

Verify:

- navigation remains usable,
- forms fit the viewport,
- controls remain reachable,
- important information is not clipped,
- no unintended horizontal scrolling blocks use,
- primary actions remain obvious,
- feedback and errors remain visible.

## Final outcome

Result: PASS / FAIL / BLOCKED / NOT RUN

Viewport/device:

Notes:

---

# Release E2E Sign-off

## Critical journey

Confirm the complete NutriCare loop where test data permits:

**Assess → Goal → Plan → Track → Evaluate → Adjust → Track**

- [ ] New-user journey passes
- [ ] Profile/goal persistence passes
- [ ] Nutrition-plan journey passes
- [ ] Weight tracking passes
- [ ] History passes
- [ ] Insufficient-data experience passes
- [ ] Progress evaluation passes
- [ ] Recommendations pass
- [ ] Adjustment decline passes
- [ ] Adjustment acceptance/versioning passes
- [ ] Authentication/session lifecycle passes
- [ ] Reports pass
- [ ] Mobile core journey passes
- [ ] No blocking recovery/error-state issue found

Overall result: PASS / PASS WITH ISSUES / FAIL

Blocking issues:

Non-blocking issues:

GitHub issue links:

Tester:

Date:

# V3 journey extensions

## E2E 15 — Keyboard and assistive-technology journey

Start signed out. Use keyboard navigation to reach the main content through the skip link, register/sign in, complete onboarding and reach the dashboard. Repeat shell, onboarding and dashboard checks with a screen reader.

Expected: labels, errors, state changes and next actions are understandable without relying on colour or pointing-device use. On mobile, the navigation dialog contains focus, closes with Escape and restores focus. Check sign-out and protected access afterwards.

Result: PASS / FAIL / BLOCKED / NOT RUN

Browser / assistive technology / viewport:

Evidence / issues:

## E2E 16 — Saved history and compact information

Use a test account with prepared weight and plan histories. Switch history sections, traverse pagination, open a long note and macro details, compare two plan versions and reverse the selector order. Review the dashboard weight chart with a long/repeated-date fixture and change the visible period.

Expected: all saved records remain accessible; disclosed content is keyboard/touch accessible; comparison direction is consistent; missing days do not become zero weights; charts and tables fit the viewport. Historical records do not imply present suitability or reconstructed historical BMI from today's profile.

Result: PASS / FAIL / BLOCKED / NOT RUN

Fixture / viewport:

Evidence / issues:

## E2E 17 — Recovery and uncertain writes

Use an isolated test environment with controlled failures. Exercise failed profile reads, optional dashboard-section failures and a saved weight whose secondary evaluation is unavailable. Exercise an uncertain plan or adjustment response and subsequent reconciliation.

Expected: failed reads never look like empty history; input is preserved where appropriate; known successful writes remain successful; uncertain outcomes do not cause automatic resubmission; recovery restores authoritative server state.

If failure injection is unavailable, mark the manual scenario BLOCKED or NOT RUN and link automated coverage rather than claiming a manual pass.

Result: PASS / FAIL / BLOCKED / NOT RUN

Failure mechanism / evidence / issues:

## E2E 18 — Public brand and motion journey

At mobile and desktop widths, navigate Home, About, Learn, Pricing, Impact, Partners and Contact. Use the journey-card controls, pause the marquee, enable reduced motion and follow FAQs/primary calls to action. Complete a test inquiry in the permitted staging environment.

Expected: approved brand visuals and responsive crops remain coherent, navigation works, keyboard controls remain usable and submission feedback distinguishes confirmed/rejected/uncertain outcomes without losing content.

Result: PASS / FAIL / BLOCKED / NOT RUN

Viewport / motion setting:

Evidence / issues:

## Additional V3 sign-off gates

- [ ] Manual keyboard, screen-reader and contrast review is recorded for authenticated shell, dashboard and onboarding.
- [ ] Manual mobile core journey and zoom/reflow review are recorded.
- [ ] Long-history, disclosure, chart and branded PDF results are recorded.
- [ ] API security and deployment findings have a documented disposition; passing product journeys alone does not close them.
- [ ] Release evidence names the tested commit and lists unresolved blockers and unrun checks.
