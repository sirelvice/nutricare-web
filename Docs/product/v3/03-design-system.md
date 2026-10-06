# NutriCare V3 — Design System

**Status:** Draft — the durable visual contract for V3. This document is the answer to "why did we design it this way" six weeks from now.
**Depends on:** `01-prd-premium-experience.md`, `02-rfc-ux-architecture.md` (this folder)

---

## 1. Purpose and rule

This document defines NutriCare's visual language once, so every screen draws from the same system instead of being styled independently. **No component or page should need to invent a new color, spacing value, or status treatment** — if something seems to need one, that's a signal to extend this document deliberately, not to reach for an arbitrary Tailwind class.

---

## 2. Brand foundation

- **Identity:** NutriCare green/gold, as established in the existing brand assets and logo.
- **Logo usage:** consistent across public site, authenticated shell, and the PDF report header. One logo file, one set of usage rules (minimum clear space, minimum size, light/dark background variants if needed) — to be confirmed against the actual asset during Slice 1.
- **Voice, inherited from V2 design doc §1 and reinforced here:** calm, direct, honest, never falsely cheerful. The product's visual tone must match this — restrained and trustworthy, not gamified or loud. This is a health product; premium here means *confidence*, not decoration.

---

## 3. Color system

### 3.1 Semantic token categories (values to be finalized during Slice 1, structure fixed now)

```
--color-surface              (page/card backgrounds)
--color-surface-raised       (elevated cards, modals)
--color-text-primary
--color-text-muted
--color-text-inverse         (on brand-colored surfaces)
--color-border

--color-brand-primary        (NutriCare green)
--color-brand-accent         (NutriCare gold)

--color-status-on-track
--color-status-plateau
--color-status-behind
--color-status-insufficient-data
--color-status-achieved      (reserved — GOAL_ACHIEVED not yet implemented per V2, but the token exists so the eventual state has a home)

--color-action-primary
--color-action-secondary
--color-action-destructive
```

### 3.2 Status color principle
Per V2 design doc §4: **avoid alarming color coding.** `BEHIND_OPPOSITE` should not use a harsh red the way a financial-loss indicator might — it should read as "worth attention," not "failure." `PLATEAU` should read as neutral/informational, not negative. `INSUFFICIENT_DATA` should look deliberately calm and informational, never like an error state. This directly resolves PRD problem #4 — the goal is for a user to glance at a status and immediately understand *what kind* of attention it needs, without the color itself causing alarm disproportionate to the situation.

### 3.3 Contrast
Every semantic text/surface pairing must meet WCAG AA contrast minimums at minimum (confirm per the RFC's accessibility section, §8) — verified before these tokens are finalized, not after components are built on top of them.

---

## 4. Typography

- One type scale, semantic (`--text-display`, `--text-heading`, `--text-body`, `--text-caption`, `--text-micro`), not ad hoc per-component font sizing.
- Numbers that matter (calorie targets, weight values, progress percentages) get a distinct, consistent treatment — per V2's own design principle, "never show a number without interpretation," so the typography itself should visually separate the number from its one-line explanation.
- Font family: confirm against current implementation during Slice 1 (whether a custom font is already loaded, or system font stack is intentional).

---

## 5. Spacing, radii, shadows, surfaces

- Spacing scale: a single consistent scale (e.g., Tailwind's default 4px-based scale) used everywhere — no arbitrary pixel values in component styles.
- Radii: one or two values max (e.g., `--radius-card`, `--radius-control`) reused across all cards/buttons/inputs — part of what makes the product feel like "one system" rather than assembled pages.
- Shadows: minimal, used only for genuine elevation (modals, dropdowns) — not decorative on every card, consistent with the "premium = restraint" principle.
- Surfaces: a clear, limited hierarchy (base page background → card surface → raised/modal surface) — no more than 3 levels.

---

## 6. Core components

### 6.1 Cards
One card pattern (padding, radius, border/shadow treatment), with variants for: default, status-colored (for progress/recommendation cards), and interactive (hoverable/clickable).

### 6.2 Buttons
One hierarchy: primary (one per screen/section, the main action), secondary, destructive (decline/delete actions — e.g., the Plan Adjustment Workflow's Decline control), ghost/text (low-emphasis actions). CVA variants for size (default, small) and state (default, loading, disabled).

### 6.3 Status card / badge (the component that directly fixes the weight-tracker-era defect class)
A single component that takes `progressState` and `recommendedAction` as props (per RFC §3.3) and renders the correct color, icon (Lucide), heading, and body copy — reusing the exact per-goal-type message patterns already specified in V2 design doc §1, §3.2. This component is used on the dashboard, in the weight tracker, and in history — one implementation, not three independent ones.

### 6.4 Forms
One field pattern: label (properly associated via `for`/`id` — per the V2 Playwright accessibility finding), input, helper text, error text, consistent spacing and focus treatment. Built on Radix primitives where interaction complexity warrants it (selects, date inputs).

### 6.5 Charts (Recharts)
A wrapped chart component that owns consistent sizing/responsiveness behavior (resolving the V2-era Recharts warning per RFC §10), consistent color usage from the status token set, and consistent axis/label typography matching the rest of the type scale.

### 6.6 Empty, loading, and error states
Each has its own defined pattern, reused everywhere — not improvised per screen:
- **Loading:** a consistent skeleton or spinner treatment, never a blank white flash.
- **Empty (intentional, e.g. "no weight entries yet"):** calm, informative, with a clear next action — never visually indistinguishable from an error.
- **Error (e.g., a failed optional API call, per V2's fatal/optional dashboard dependency design):** clearly distinct from "empty," honest about what happened, without technical jargon.
- **Success/feedback:** brief, calm confirmation (e.g., after accepting an adjustment or saving a profile) — consistent placement and timing across the app.

---

## 7. Navigation & shell patterns

- AppShell primary nav: icon + label, active-state treatment, consistent across desktop/mobile (structurally — the *layout* differs per RFC §4, the visual language doesn't).
- Account/sign-out area: a consistent pattern (e.g., an avatar/initials control opening a small menu with Profile, Goal, Sign out) — not styled differently from any other dropdown/menu in the app.

### 7.1 Desktop workspace behavior

The authenticated desktop experience behaves as an application workspace rather than a long webpage with navigation attached.

- Primary navigation remains persistently available while page content scrolls.
- Long pages must not cause the primary navigation to disappear with document content.
- The content region owns the primary vertical reading/scrolling experience.
- Navigation and content have clear visual separation without excessive borders or elevation.
- Account controls, public-site navigation, and sign-out remain predictably reachable.
- The navigation hierarchy should reflect user tasks rather than exposing every route as an equal top-level destination.

Mobile does not mechanically reproduce the desktop sidebar. It uses a navigation pattern appropriate to the available viewport while preserving the same information architecture.


---

## 8. Accessibility rules (binding, not aspirational)

- Every interactive element reachable and operable by keyboard alone.
- Every form control has a properly associated label (`<label for>` / `id`, or Radix's built-in equivalent) — this was a real, found bug in V2; V3's component library should make the correct pattern the *only* easy pattern.
- Focus states are visible and consistent (one focus-ring treatment, reused everywhere, not browser-default on some elements and custom on others).
- Color is never the only signal for status — the status card component (§6.3) always pairs color with an icon and text label, specifically so the product remains usable for colorblind users.
- Minimum touch target size respected on mobile (44×44px or platform-equivalent guidance) for all interactive controls, especially in the AppShell mobile nav and quick-log weight entry.

---

## 9. Responsive rules

- Mobile-first construction for new components — build the small-viewport version first, then adapt up, rather than designing desktop-first and compressing down.
- One breakpoint set, used consistently (confirm against Tailwind's default breakpoints unless there's a reason to customize).
- The dashboard's "four zones" (V2 design doc §3.2: insight, progress snapshot, today's targets, quick-log) need an explicit mobile stacking order decided once here, not improvised per implementation.

---

## 10. What this document explicitly does not cover

- Exact hex/token values — those are filled in during Slice 1 as the system is actually built against real brand assets, not invented in the abstract here.
- Marketing-page-specific layout patterns (hero sections, pricing tables) — covered when Slice 8 (marketing pages) is scoped, building on the same token/component foundation defined here.
- Any domain logic, copy content beyond the examples already established in V2's design doc — this document is the visual contract, not the content strategy (though both should stay consistent with V2 design doc §1's voice principle).

---

## 11. Maintenance

This document is updated whenever a new durable visual pattern is introduced — the same discipline V2 applied to its own docs. If implementation diverges from what's written here during a slice, the document is corrected before that slice is considered complete, so it never silently drifts out of sync with the shipped product.

---

## 12. Product writing and punctuation

NutriCare user-facing copy does not use em dashes (`—`). Prefer direct sentence structure using periods, commas, colons, or parentheses where appropriate.

This applies to application UI, public marketing pages, emails, user-facing educational content, and generated reports/PDFs. Technical documentation, source comments, third-party content, and historical material are not required to follow this restriction.

An em dash must also not be used as a generic missing-data placeholder. Missing values should use contextual language such as `Not recorded`, `Not available`, or `No data yet`, depending on the meaning of the field.

The intent is a calm, natural, human product voice. Punctuation should support clarity rather than create a stylized or synthetic writing pattern.
