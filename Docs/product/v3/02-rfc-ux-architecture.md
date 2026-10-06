# RFC: NutriCare V3 — UX & Presentation-Layer Architecture

**Status:** Draft — to be finalized before the first V3 UI implementation commit
**Depends on:** `01-prd-premium-experience.md` (this folder), V2's `02-rfc-architecture.md` (unchanged — domain/API/data layers are out of scope here)
**Scope:** How V3 is built, not what it builds (see the PRD for that).

---

## 1. Hard boundary: this RFC does not touch the V2 architecture

Per V2 RFC §3.1, the layering is:
```
UI → API / Route Handlers → Application Services → Domain Logic → Repositories → PostgreSQL
```
V3 work happens **entirely within the UI layer** and, where strictly necessary, adds small, explicit API surface for data the UI needs but doesn't yet have access to (flagged case-by-case, never assumed). No V3 PR should touch `src/lib/*/domain.ts`, `src/lib/*/service.ts`, or repository code, except to consume an existing, unchanged interface. If a V3 slice seems to require a domain change, that's a signal to stop and raise it explicitly rather than quietly expanding scope.

---

## 2. What we're building on (not starting from zero)

Repository inspection confirms the following already exist and should be used, not replaced:
- **Tailwind** with partial brand tokens already defined
- **CVA (class-variance-authority)** for component variants
- **Radix** primitives (accessible behavior out of the box — lean on this for accessibility rather than reinventing it)
- **Lucide** for icons
- **Recharts** for charts (already used for weight trend; has a known sizing warning, see §6)
- Real brand assets (logo, green/gold identity)

**Decision:** no new UI framework or component library. V3 is a systematization project — turning existing pieces into a deliberate system — not a rebuild. This directly serves V2's own stated engineering principle (don't rebuild what already works) and keeps V3's risk profile low relative to V2's domain refactor.

---

## 3. Design-system architecture

### 3.1 Token layer
Semantic design tokens (defined fully in `03-design-system.md`) sit on top of Tailwind's raw scale:
```
Raw Tailwind scale (slate-500, green-600, etc.)
        ↓
Semantic tokens (--color-surface, --color-status-on-track, --color-text-muted, ...)
        ↓
Components consume semantic tokens only
```
**Rule going forward:** no component or page may reference a raw Tailwind color class directly for brand-relevant surfaces, text, or status — only semantic tokens. This is mechanically checkable (see §7) and is what directly fixes PRD problem #1 (brand inconsistency).

### 3.2 Component strategy
- Shared components live in one location (`src/components/ui/` or equivalent — confirm against actual repo structure during Slice 1), built with CVA for variants (size, intent/status, emphasis).
- **Status treatment is a first-class variant**, not ad hoc per-screen styling — `ON_TRACK` / `BEHIND_OPPOSITE` / `PLATEAU` / `INSUFFICIENT_DATA` / pending-recommendation states each get one defined visual pattern (color, icon, copy tone) reused everywhere they appear (dashboard, history, weight tracker — directly resolving the V2-era weight-tracker defect's *visual* dimension, now that the *logic* dimension was fixed in V2).
- One card pattern, one button hierarchy (primary/secondary/destructive/ghost), one form-field pattern, reused everywhere rather than redefined per screen.

### 3.3 Data flow into presentation (reaffirming a V2 principle)
Per V2 design doc §3.2/§3.3: components consume `progressState` + `recommendedAction` from the API; they do not compute their own interpretation of raw deltas. V3's component library makes this the *only easy path* — e.g., a `<StatusCard state={progressState} action={recommendedAction} />` component that takes the domain output directly, rather than a generic card that invites a developer to pass in raw numbers and write local conditionals. Good architecture here is what prevents the next version of the weight-tracker-style defect.

---

## 4. AppShell & navigation

- Redesigned shell with clear hierarchy: primary nav (Dashboard, Tracking, Progress, History, Report), account area (profile, goal, **sign-out**), and an explicit path back to the public site.

- On desktop, the authenticated shell uses persistent navigation while the primary workspace content scrolls independently. Long page content must not scroll the application's primary navigation out of reach.
- **Sign-out is a committed requirement, not optional polish** — Auth.js already exposes `signOut`; this is wiring existing capability into the UI, zero backend risk.
- Mobile nav gets its own treatment (not a simple collapse of desktop nav) — bottom nav or a proper drawer pattern, decided during Slice 1 based on the number of primary destinations.
- The shell is itself one of the first components built (Slice 1), since every other slice depends on it.

---

## 5. Authentication & onboarding UX

- Login, register, forgot/reset password, and initial profile+goal setup (V2 design doc §3.1, "First plan reveal") get the same component library and token system as the rest of the app.
- Validation, loading, and error states on these screens are high-value: this is the first impression, and it's also exactly where V2's Playwright work found real issues (missing `<label for>` associations, the login-redirect timing question) — V3's auth screens should be built with accessibility and state-handling as first-class from the start, not retrofitted.
- No change to the underlying NextAuth/session logic — purely presentational and state-handling work.

---

## 6. PDF/report consolidation

Per V2 RFC §3.4, two mechanisms currently coexist:
1. Authoritative server-side `GET /api/report/pdf` via `GetReportService`
2. Legacy client-side `html2canvas + jsPDF` export

**V3 decision:** consolidate onto (1) only. The on-screen report and the downloadable PDF both render from `GetReportService`'s output. The client-side path is **removed**, not merely unused — leaving dead code that could silently diverge again is exactly the kind of drift this project has spent significant effort catching elsewhere.

Report redesign requirements: NutriCare logo + header, report metadata (date range, user), clearly separated metric blocks (BMI, nutrition plan/macros, weight/progress, interpretation, recommendations where applicable), proper pagination for multi-page reports, and a privacy/disclaimer footer appropriate for health data.

---

## 7. Design-system compliance verification (how we check the "no raw slate-* " rule)

Rather than relying on manual review alone:
- A lint rule or simple grep-based CI check (`grep -rn 'slate-' src/` excluding an explicit allowlist) run as part of Slice 1's setup, so drift back into ad hoc styling is caught automatically in future PRs, not just during this project.
- A **screen-by-screen checklist**, covering every route (mirroring the V2 design doc's IA list), each checked against: uses semantic tokens / correct status treatment / has loading+empty+error+success states / keyboard accessible / mobile-reviewed. This checklist is the acceptance-criteria mechanism for PRD §7 item 2, and should be committed as a tracked artifact (`Docs/engineering/testing/` or similar), not just asserted complete in a chat summary — consistent with the evidence discipline established through V2's later checkpoints.

---

## 8. Responsive & accessibility strategy

- Mobile is reviewed per-slice, not as a separate final pass bolted onto the end — each slice's acceptance includes a mobile-viewport check.
- Accessibility baseline: semantic HTML, correct `<label for>`/`id` associations (per the V2 Playwright finding), visible focus states, sufficient contrast per the chosen token palette (verify token contrast ratios *before* finalizing `03-design-system.md`, not after components are built on top of them), and keyboard operability for all interactive elements including the AppShell nav and sign-out.
- Radix primitives are the default for anything with inherent accessibility complexity (menus, dialogs, dropdowns) rather than hand-rolled equivalents.

---

## 9. Testing boundaries for V3

- **Existing V2 tests remain the regression baseline** — any V3 change that breaks an existing domain/API/integration test is a bug, full stop, regardless of how it looks.
- **Changed UI behavior gets new tests** at the appropriate layer — component-level where meaningful, E2E for the primary journeys listed in PRD §6.
- **Before merge:** full manual regression + the complete E2E journey set — this is an explicit gate in PRD §7/§8 Slice 10, not an assumption.
- Given V2's own hard-won lesson about narrated-vs-verified test claims, V3 checkpoints should cite actual commands/output the same way, not summary numbers — this RFC inherits that discipline rather than restating it as new.

---

## 10. Recharts sizing warning (carried over from V2)

V2 left this open (`The width(-1) and height(-1) of chart should be greater than 0`), tried a `min-h-20` fix, reverted it when it didn't resolve the issue. V3's charting work (tracking/progress trend visuals) should resolve this as part of the natural rebuild of those components, rather than treating it as a separate unrelated ticket — since the component is being rebuilt anyway under the new design system, the root cause (likely a layout-timing issue where Recharts measures its container before CSS has resolved final dimensions) should be addressed directly.

---

## 11. Open technical questions

1. Confirm actual current location/structure of shared components (`src/components/ui/` or otherwise) during Slice 1 setup, before token/component work begins.
2. Decide the CI check mechanism for §7 (dedicated lint rule vs. a simple CI grep step) — lean toward the simpler grep-based check first, upgrade later if it proves insufficient.
3. Confirm whether any V3 screen genuinely needs new API surface (candidate: richer plan-version history detail for the Plan screen's version view, per V2 design doc §3.6) — if so, scope that as a minimal, explicit, reviewed addition before the relevant slice starts.
