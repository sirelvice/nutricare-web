# Slice 8 checkpoint: Public marketing experience

Status: verified locally; commit, push and integration PR pending.

## Integration baseline

- Branch: `refactor/v3-public-experience`, based on `refactor/premium-ux`.
- Slice 7 merged in PR #27 at `867f05886668b5d330aabcd4095f6c69db562e5d`.
- Refs #19; this slice does not close the overall V3 issue.

## Delivered behavior

- Wider public layouts, responsive navigation, green/orange brand treatments, editorial homepage sections and an interactive product journey on Home and About.
- An optimized 1536 x 1024 generated lifestyle WebP (189,222 bytes), local image delivery, desktop text overlay and stacked mobile composition. No video or invented product screens.
- Marquee pause and reduced-motion support; brief model connection motion; explicit journey explanation flip with keyboard and Escape handling.
- About, Learn, Pricing, Impact, Partners and Contact align with the marketing direction. Privacy, Terms and Sitemap receive presentation and navigation refinement. Pricing retains /pricing while moving into the marketing route group.
- Four collapsed homepage FAQs sit before the final call to action. Existing Learn articles remain unchanged.
- Contact and partner submissions validate schema and runtime data, enforce same-origin JSON requests, bound request bodies and use the existing rate limiter. Notification failure after persistence does not erase a saved contact message.
- Client submission feedback distinguishes confirmed saves, rejected requests and uncertain results. Fields are preserved for failures and uncertain writes require an explicit user decision before another attempt.
- Public Impact presents no unverified programme totals. The public snapshot endpoint remains available and does not expose private account data.

## Verification reported locally on 9 October 2026

- Full Vitest suite: 688 tests passed across 79 files, including database coverage.
- Full Playwright suite before the final information-page polish: 153 tests passed with two workers in 7.9 minutes.
- Production build before the final information-page polish succeeded, including TypeScript and all 43 generated pages.
- After final polish: 24 focused public-information and public-marketing tests passed in 15.9 seconds. Information-page coverage includes 375px, 768px and 1280px, FAQ keyboard disclosure and the Sitemap Pricing link.
- Lifestyle and marketing coverage: 16 tests passed after image integration. Journey and marketing coverage: 14 tests passed after restoring the accepted visual patches.
- TypeScript, lint and whitespace checks passed after the final polish.
- Desktop recordings were reviewed for the homepage, image section and brand direction. Automated viewport coverage does not establish completion of manual assistive-technology or cross-browser verification.
- Existing Vite config-loader and Turbopack filesystem-tracing warnings remain. Expected failure-path logs in unit tests are not failed tests.

## Boundaries and follow-up

- No new dependency, schema migration or paid integration. Generated image is brand illustration, not a real customer photograph.
- Inquiry persistence and notification-failure behavior are covered by tests; actual production email delivery has not been verified here.
- Privacy and Terms body wording remains existing policy text. Legal completeness and operational policy alignment are not certified by this slice.
- Production proxy/IP trust and abuse resistance require deployment verification. Rate limiting does not establish complete anti-spam protection.
- Slices 9 and 10 remain for the cross-cutting accessibility/responsive review and final QA before integration into the release branch.
