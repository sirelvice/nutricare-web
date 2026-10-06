# NutriCare Manual Regression Checklist

This document defines the manual regression baseline for NutriCare.

It complements automated unit, integration, API, and Playwright coverage. It is intended for substantial releases, production validation, and changes that affect critical user journeys. It is not necessary to run the entire checklist for every small pull request.

## Test environment

Record before testing:

- Environment:
- Deployment / commit:
- Browser:
- Viewport / device:
- Tester:
- Date:

Use a fresh test account where the workflow requires first-time-user behaviour. Do not use production user data for destructive testing.

## 1. Public experience

- [ ] Landing page loads without visible errors.
- [ ] Primary navigation links work.
- [ ] Primary calls to action lead to the expected destination.
- [ ] About page loads correctly.
- [ ] Impact page loads correctly.
- [ ] Learn index loads correctly.
- [ ] Learn article pages load correctly.
- [ ] Partners page loads correctly.
- [ ] Pricing page loads correctly.
- [ ] Privacy, terms, and site-map pages load correctly.
- [ ] Public pages remain usable on mobile-sized viewports.
- [ ] Unknown routes display the intended not-found experience.

## 2. Authentication

### Registration

- [ ] A new user can register with valid details.
- [ ] Invalid registration input produces clear feedback.
- [ ] Duplicate-account registration is handled safely.
- [ ] Successful registration leads into the expected authenticated experience.

### Sign in / session

- [ ] A registered user can sign in with valid credentials.
- [ ] Invalid credentials produce clear feedback without exposing sensitive account information.
- [ ] Authenticated pages are accessible after sign-in.
- [ ] Refreshing an authenticated page preserves the session.
- [ ] Signing out ends the session.
- [ ] Protected pages cannot be accessed after sign-out.

### Password reset

- [ ] Forgot-password accepts a valid email without exposing whether an account exists.
- [ ] Reset-password rejects invalid or expired reset links appropriately.
- [ ] A valid reset flow allows the password to be changed when email delivery is configured.
- [ ] A consumed reset link cannot be reused.
- [ ] The user can sign in with the new password after a successful reset.

## 3. Profile and goal

- [ ] A new user can complete the required profile information.
- [ ] Height, weight, age, activity, and other required inputs validate correctly.
- [ ] The user can select a `LOSE`, `GAIN`, or `MAINTAIN` goal where applicable.
- [ ] Goal-specific inputs validate correctly.
- [ ] Saving the profile persists the data after refresh.
- [ ] Editing the profile updates the displayed values.
- [ ] Changing the goal produces the expected plan/workflow behaviour.
- [ ] Profile and goal copy explains what the user is setting and why it matters.

## 4. Nutrition plan

- [ ] A completed profile produces or exposes the expected nutrition plan.
- [ ] The current calorie target is visible.
- [ ] Macro targets are visible and understandable.
- [ ] Plan guidance is consistent with the selected goal.
- [ ] `LOSE`, `GAIN`, and `MAINTAIN` users receive directionally appropriate guidance.
- [ ] Plan values are accompanied by useful interpretation rather than unexplained numbers.
- [ ] Refreshing the page does not lose the active plan.
- [ ] Previous plan information remains consistent where plan history is exposed.

## 5. Dashboard

- [ ] Dashboard loads for an authenticated user without a fatal error.
- [ ] The current goal and plan are represented correctly.
- [ ] The user can understand their current status and next useful action.
- [ ] Calorie and macro targets agree with the active nutrition plan.
- [ ] Weight/progress information agrees with persisted tracking data.
- [ ] Dashboard handles a brand-new user with little or no tracking data gracefully.
- [ ] Loading states do not appear as broken content.
- [ ] Empty states explain what the user should do next.
- [ ] Recoverable API failures produce understandable feedback rather than a broken page.

## 6. Weight tracking

- [ ] A valid weight entry can be recorded.
- [ ] Invalid weight input is rejected with useful feedback.
- [ ] A newly recorded entry appears once in the tracking history.
- [ ] Weight history is ordered correctly.
- [ ] Refreshing preserves recorded entries.
- [ ] An existing entry can be deleted where supported.
- [ ] Deleting an entry updates the visible history correctly.
- [ ] Tracking remains usable on a mobile-sized viewport.

## 7. Progress evaluation

The progress experience must communicate uncertainty rather than manufacture certainty when there is not enough data.

### Insufficient data

- [ ] A user without enough recent entries sees an explicit not-enough-data state.
- [ ] The state explains what additional tracking is needed.
- [ ] The UI does not imply that insufficient data is an application failure.
- [ ] No unsupported progress conclusion is presented.

### Evaluated progress

Where suitable test data exists:

- [ ] On-track progress is interpreted correctly.
- [ ] Progress moving away from the goal is communicated correctly.
- [ ] Plateau behaviour is communicated correctly.
- [ ] Progress messaging remains appropriate for both weight-loss and weight-gain goals.
- [ ] Progress status is presented as guidance rather than a pass/fail judgement.
- [ ] Trend/progress visualisations agree with the underlying weight history.

## 8. Recommendations and adjustments

- [ ] Recommendations are consistent with the current progress state.
- [ ] Insufficient data does not produce a misleading recommendation.
- [ ] Continue/review/adjustment/professional-consult guidance is presented clearly when applicable.
- [ ] An adjustment recommendation clearly explains the proposed next step.
- [ ] Declining an adjustment preserves the correct plan state.
- [ ] Accepting an adjustment creates/activates the expected next plan.
- [ ] The dashboard reflects the newly active plan after an accepted adjustment.
- [ ] Stale or already-resolved adjustment actions are handled safely.

## 9. Assessment and tools

### BMI

- [ ] BMI tool accepts valid inputs.
- [ ] Invalid inputs are rejected clearly.
- [ ] The result includes interpretation and is not presented as a diagnosis.

### Calories

- [ ] Calorie tool accepts valid inputs.
- [ ] The calculated result is displayed clearly.
- [ ] The result includes useful context rather than an isolated number.

### Macros

- [ ] Macro tool accepts the required inputs.
- [ ] Macro results are internally coherent and clearly labelled.
- [ ] Results remain understandable on mobile.

## 10. History

- [ ] History page loads successfully.
- [ ] Persisted user information shown in history is consistent with current stored data.
- [ ] Legacy BMI history route behaves as intended.
- [ ] Legacy calorie history route behaves as intended.
- [ ] Navigation from history does not lead to dead or obsolete workflows.

## 11. Reports

- [ ] Report page requires authentication.
- [ ] Personal report data belongs to the authenticated user.
- [ ] Report values agree with the user's persisted profile, plan, and tracking data.
- [ ] PDF/export action works where available.
- [ ] Report generation failure produces understandable feedback.

## 12. Responsive and accessibility smoke check

Check at least one desktop and one mobile-sized viewport.

- [ ] Navigation remains usable.
- [ ] Important content is not clipped or hidden.
- [ ] Forms can be completed without horizontal scrolling.
- [ ] Buttons and links have usable touch/click targets.
- [ ] Keyboard focus is visible on interactive controls.
- [ ] Forms have understandable labels and validation feedback.
- [ ] Text and important UI states have sufficient visual contrast.
- [ ] Information is not communicated by colour alone.
- [ ] Charts or visual indicators have understandable surrounding text.

## 13. Error and state handling

- [ ] Loading states are visually intentional.
- [ ] Empty states explain why content is absent.
- [ ] Validation errors tell the user what needs correction.
- [ ] Authentication failures do not expose sensitive details.
- [ ] Network/API failures do not destroy already valid user input unnecessarily.
- [ ] Retry or recovery paths are available where appropriate.
- [ ] Expected domain states such as insufficient progress data do not look like system failures.

## 14. Core journey sign-off

Complete this sequence for a release-level regression:

- [ ] Register a new account.
- [ ] Complete the profile and choose a goal.
- [ ] Confirm the initial nutrition plan.
- [ ] Reach the authenticated dashboard.
- [ ] Record weight.
- [ ] Confirm tracking/history persistence.
- [ ] Confirm the initial insufficient-data experience where applicable.
- [ ] With suitable test data, confirm progress evaluation.
- [ ] Confirm the recommendation/next-action experience.
- [ ] Confirm any applicable plan-adjustment workflow.
- [ ] Confirm report access.
- [ ] Sign out and confirm protected routes remain protected.

The complete product loop should remain understandable:

**Assess → Goal → Plan → Track → Evaluate → Adjust → Track**

## Regression result

- Result: PASS / PASS WITH ISSUES / FAIL
- Blocking issues:
- Non-blocking issues:
- Follow-up issue links:
- Notes:
