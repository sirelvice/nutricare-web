# NutriCare V3 — PRD: Premium Product Experience

**Status:** Active baseline. Slices 1 to 7 merged into `refactor/premium-ux`. Slice 8 verified locally; integration PR pending.
**Branch:** `refactor/premium-ux`
**Tracking:** Issue #19
**Depends on:** `Docs/product/01-product-blueprint.md`, `02-rfc-architecture.md`, `03-design.md` (V2 — unchanged, still authoritative for domain/architecture)
**Supersedes:** nothing. V3 is additive — it does not redefine the V2 product loop or domain model.

---

## 1. What V3 is, in one sentence

> Improve NutriCare across the whole platform: security first, alongside performance, load time, concurrency and scalability, resilience, accessibility, API correctness, data integrity, maintainability, and a coherent product experience.

V2 proved the engineering was real. V3 proves the *product* is real — that someone can open NutriCare, trust it immediately, and understand what to do next without being told "this is a refactored prototype."

---

## 2. Problems observed (the "why")

These come directly from inspecting the current deployed app, not from abstract design taste:

1. **Brand inconsistency.** NutriCare green/gold brand tokens exist in the codebase, but much of the application bypasses them with page-specific `slate-*` Tailwind classes. The product doesn't look like one product.
2. **No visible sign-out.** Auth.js already exposes `signOut`, but no UI calls it. The logo is currently the user's only way back to the public site — there's no account exit path.
3. **Functional-but-basic AppShell.** The authenticated shell works, but has no real navigation hierarchy, no mobile-specific treatment, and no account/profile affordances beyond raw functionality.
4. **Dashboard reads as "equal white cards."** No visual hierarchy around what actually matters: current status, goal, what to do next. `INSUFFICIENT_DATA` currently looks indistinguishable from a broken API call rather than an intentional, honest state.
5. **Two competing PDF implementations.** The report has a legacy client-side `html2canvas + jsPDF` path and an authoritative server-side `GetReportService` path (see V2 RFC §3.4) — never consolidated. V3 must finish what V2 flagged and left open.
6. **Impact page exports raw JSON.** The current public-facing "impact" download is a machine-readable narrative/placeholder metrics dump, not something a real person or partner would find meaningful.
7. **Numbers without interpretation, inconsistently.** Some screens already follow the "never show a number without meaning" principle (V2 design doc §1); others don't yet.
8. **Marketing pages inconsistent with the product.** Landing, Learn, Impact, Partners, About, Contact, Pricing exist but don't share one visual system with the authenticated product.

---

## 3. V3 goals

1. One visual and verbal identity, from the public landing page through the PDF report — no page where NutriCare looks like a different product.
2. Every status the domain can produce (`ON_TRACK`, `BEHIND_OPPOSITE`, `PLATEAU`, `INSUFFICIENT_DATA`, pending recommendations) has an intentional, recognizable visual treatment — nothing reads as a broken state.
3. The user always has a clear answer to "what should I do next" on the dashboard and on every major screen.
4. Full account control is visible and reachable: sign-out, profile, goal editing — never hidden behind the logo as the only escape hatch.
5. One authoritative report/PDF generation path, replacing the two competing implementations.
6. Mobile, keyboard, and screen-reader users get a first-class experience, not an afterthought — this is a health product, and accessibility gaps are a trust and compliance risk, not just a polish gap.
7. The public marketing pages are credible enough to show a partner or investor without caveats.

---

Security is the highest-priority quality requirement. Each slice reviews relevant performance, load time, concurrency/scalability, resilience, accessibility, API correctness, data integrity, and maintainability risks. Confirmed findings, implemented fixes, and future investigations must be recorded separately.

## 4. Explicit non-goals (what V3 does *not* do)

- **No uncontrolled architecture rewrites.** Preserve the V2 layering and established domain behavior. Bounded changes across UI, API, services, repositories, and infrastructure are permitted when evidence identifies a platform problem. State the problem, scope, compatibility implications, and verification.
- **No speculative backend expansion.** Backend changes must serve a demonstrated product need or platform-quality problem and remain small and reviewable.
- **No framework migration.** No new UI framework, no replacing Tailwind/Radix/CVA/Recharts/Lucide — V3 builds on what already exists (see RFC §2).
- **Deferred work remains tracked, not automatically excluded.** Security findings and dependency risks may be revisited when evidence warrants action. Previously merged V3 work may also be corrected. New domain capabilities such as `GOAL_ACHIEVED` require explicit scope. Offline-first and sync architecture remain a later design investigation, not an implied implementation commitment.
- **No redesign-for-its-own-sake.** Every change must address an observed product or platform problem, or a stated V3 goal.

---

## 5. Scope (what ships in V3)

See the companion RFC (`02-rfc-ux-architecture.md`) for *how*; this PRD lists *what*:

| Area | Summary |
|---|---|
| Design system & brand foundation | Semantic tokens, typography, spacing, component library — replaces ad hoc `slate-*` usage |
| Navigation & authenticated shell | Redesigned AppShell, mobile nav, account controls, **sign-out** |
| Authentication & onboarding | Login/register/forgot-reset-password/initial profile+goal setup in the NutriCare visual language |
| Premium dashboard | Hierarchy around status/goal/targets/progress/next-action; `INSUFFICIENT_DATA` as an intentional state |
| Profile, goals & nutrition planning | Clearer editing; plan targets presented as guidance, not raw numbers |
| BMI, calories & macros | Same calculations, improved input/result presentation with interpretation |
| Tracking & progress | Faster weight entry, genuinely visual trends, recognizable per-state treatment |
| Recommendations & adjustments | Explain *why*; polished accept/decline with clear consequences |
| History | Understandable-over-time presentation, not a raw record list |
| Premium report/PDF | One consolidated, branded, paginated implementation |
| Impact experience | Full audit; remove the JSON export; replace with a meaningful artifact if one is warranted |
| Marketing pages | Landing/Learn/Impact/Partners/About/Contact/Pricing unified, without becoming visually identical |
| Responsive + accessibility + states | Mobile, keyboard/focus, contrast, loading/error/empty/disabled/success states as first-class work throughout |
| QA | Existing tests stay relevant; changed behavior gets new tests; manual regression + full E2E journeys before merge |

---

## 6. Primary user journeys V3 must support end-to-end, visually coherent throughout

1. **First-time visitor → signed-up user:** Landing → sign-up → onboarding (profile + goal) → first plan reveal. (Mirrors V2 design doc §3.1, now fully branded.)
2. **Returning user, daily use:** Sign-in → dashboard → log weight → see updated progress/insight.
3. **Progress problem → resolution:** Dashboard insight (`PLATEAU`/`BEHIND_OPPOSITE`) → recommendation → accept/decline → (if accepted) new plan version visible.
4. **Account management:** Profile edit, goal edit, **sign-out**, password reset — all reachable, all branded.
5. **Report generation:** Request report → view on-screen → download PDF — one implementation, consistent branding.
6. **Prospective partner visit:** Public site (Partners, About, Impact) reads as a credible, coherent product — no placeholder-feeling pages.

---

## 7. Acceptance criteria

V3 is ready to merge when:

1. No page in the authenticated app or public site uses raw `slate-*` (or equivalent off-system) color classes where a semantic design-system token exists for the purpose.
2. Every progress state and recommendation type (per V2 blueprint §11.1 / RFC §3.1.2a) has a distinct, intentional visual treatment, verified by a screen-by-screen checklist (see RFC §7).
3. Sign-out is reachable from the authenticated shell on both desktop and mobile, in no more than two interactions.
4. The report/PDF has exactly one implementation (server-side, `GetReportService`-backed); the legacy `html2canvas + jsPDF` path is removed, not just unused.
5. The Impact page's JSON export is removed; whatever replaces it (if anything) is a deliberate, reviewed artifact, not a placeholder.
6. All primary journeys in §6 pass as E2E tests, in addition to whatever V2's existing suite already covers.
7. A manual accessibility pass (keyboard navigation, screen-reader labeling, contrast) is completed and documented for the authenticated shell, dashboard, and onboarding flow at minimum.
8. A mobile-viewport manual pass is completed for the same set of screens.
9. The V3 PRD/RFC/design-system docs are committed and referenced from `Docs/product/v3/` before the final merge, matching the actual shipped implementation (not the original proposal, if they diverge during build).

---

## 8. Sequencing (high level — see RFC for the detailed slice plan)

```
Slice 1 — Design foundation + AppShell (incl. sign-out)
Slice 2 — Auth & onboarding
Slice 3 — Dashboard
Slice 4 — Profile / goals / nutrition planning / BMI-calories-macros
Slice 5 — Tracking / progress / recommendations & adjustments
Slice 6 — History
Slice 7 — Report/PDF consolidation
Slice 8 — Impact audit + marketing pages
Slice 9 — Responsive + accessibility + states pass (cross-cutting, verified continuously, finalized here)
Slice 10 — QA: manual regression + full E2E journeys → merge
```

Each slice is its own small, reviewable PR against `refactor/premium-ux` — not one large batch, learning directly from how large PR #10 became in V2.

---

## 9. Open questions

1. Does the Impact page need *any* replacement export, or is removing the JSON download sufficient for V3 — is there a real partner/user need here, or was it speculative scope from the original prototype?
2. Does Pricing exist today as a real page, or a placeholder? If placeholder, is it in scope for V3's "marketing pages unified" goal, or deferred (monetization remains intentionally deferred per V2 blueprint §0)?
3. For the sign-out flow: does it need a confirmation step, or is a single-tap sign-out acceptable for this product?
4. Should the design-system document (`03-design-system.md`) be the single source of truth that a Figma/design-tool file (if one exists or gets created) is generated *from*, or *validated against* — i.e., does design-tool work precede or follow the written spec?
