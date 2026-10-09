# Changing NutriCare's public domain

Current public origin: `https://nutricare-web-zeta.vercel.app`.
This is a deployment runbook, not evidence that a domain migration has been performed. Record the actual domain, release commit, date, operator and results when executing it.

## 1. Choose the address

Buy an available domain from a registrar and enable renewal reminders and account two-factor authentication. Choose one canonical HTTPS address, such as `https://www.example.com`. The example address below is a placeholder: replace it with the domain you actually own. Check renewal costs, not only introductory registration prices.

## 2. Connect it to the existing Vercel project

1. Open the NutriCare project in Vercel, then Settings > Domains > Add Domain.
2. Add the purchased domain and its `www` counterpart if both will be supported.
3. At your registrar, add the exact DNS records Vercel displays. Do not copy an IP address from an old tutorial. Preserve existing email MX/TXT records when changing DNS.
4. Wait for Vercel to report valid configuration and for HTTPS to work with a valid certificate. Vercel provisions certificates automatically after verification.
5. Select the canonical address and configure the other custom-domain variant to redirect to it. Test the redirect. Only configure an old Vercel-address redirect if Vercel supports it for that assigned address; do not assume automatic redirection.

Keep the old deployment available during migration. Do not change the database or recreate the Vercel project to change the public domain.

## 3. Prepare the source change

Start from an up-to-date integration branch and use a separate reviewed PR. Before running this example, confirm that `refactor/premium-ux` is still the correct integration branch; use the current release branch if the workflow has changed.

```bash
cd ~/Projects/nutricare-web
test -z "$(git status --porcelain)"
git switch refactor/premium-ux
git pull --ff-only origin refactor/premium-ux
git switch -c chore/custom-domain
nvm use
```

Update only these public URL references:

| File | References |
| --- | --- |
| `src/app/layout.tsx` | `metadataBase` and `openGraph.url` |
| `src/app/sitemap.ts` | Sitemap base URL |
| `src/app/robots.ts` | Sitemap URL |

The sharing-image URLs and favicon paths are relative; they use the metadata base automatically. Test domains in security tests are deliberate fixtures and do not need a global replacement.

This script validates all three files before writing. Change `new_origin` first. If the expected counts differ, inspect the files instead of forcing the replacement.

```bash
python3 - <<'PY'
from pathlib import Path
from urllib.parse import urlsplit

old_origin = "https://nutricare-web-zeta.vercel.app"
new_origin = "https://www.example.com"  # REPLACE with your purchased canonical domain.
url = urlsplit(new_origin)
assert url.scheme == "https" and url.hostname, "Use an absolute HTTPS origin."
assert url.hostname not in {"example.com", "www.example.com"}, "Replace the example domain first."
assert not url.username and not url.password and not url.port, "Use a public origin without credentials or a port."
assert url.path == "" and not url.query and not url.fragment, "Use no trailing slash, path, query or fragment."
expected = {
    "src/app/layout.tsx": 2,
    "src/app/sitemap.ts": 1,
    "src/app/robots.ts": 1,
}
changes = {}
for name, count in expected.items():
    path = Path(name)
    text = path.read_text()
    assert text.count(old_origin) == count, f"Inspect {name}: unexpected URL references."
    changes[path] = text.replace(old_origin, new_origin)
for path, text in changes.items():
    path.write_text(text)
PY

npx tsc --noEmit
npm run lint
git diff --check
npm run test:e2e -- e2e/public-brand-motion.spec.ts e2e/public-information.spec.ts --reporter=line
npm run build
git diff -- src/app/layout.tsx src/app/sitemap.ts src/app/robots.ts
```

The historical `public-brand-motion.spec.ts` filename currently contains the favicon and link-preview test; it does not imply restored diagram motion. Follow the repository PR template, link this guide, and record the checks performed. Review and merge through the release process; do not deploy an unreviewed branch to production.

## 4. Update deployment configuration at the cutover

1. Open Vercel > NutriCare > Settings > Environment Variables.
2. Find `APP_URL`, select Edit, set it to the exact canonical HTTPS origin, and select Production. This controls same-origin security checks and password-reset destinations.
3. If marked Sensitive/Secret, its previous value cannot be revealed. You can replace it with the known correct address and save it. The public URL itself is not a credential; never expose real authentication, database or email secrets while reviewing configuration.
4. If `AUTH_URL` or `NEXTAUTH_URL` is already configured with the old production address, review and update that production value too. Do not add unrelated variables or rotate `AUTH_SECRET` merely for a domain change.
5. Keep Development and Preview configuration separate. Do not blindly copy the production address into preview environments; verify authentication and allowed origins for each environment used.
6. Coordinate the environment change with the production deployment of the reviewed source commit. Changes apply to new deployments, not the running deployment. Redeploy the intended production release after saving. If the V3 work has not yet been approved for production, do not promote it as part of this configuration task.
7. Confirm Vercel's configured production branch and deployed commit match the approved release.

## 5. Verify on the new domain

Use a test account and record PASS, FAIL or BLOCKED with the deployed commit and browser.

1. Open the HTTPS homepage and both domain variants. Confirm the certificate, redirects and final address.
2. Check page title, NutriCare favicon, description and sharing-image URL in the HTML head. Inspect shared-link previews; external services may cache old previews.
3. Open `/robots.txt` and `/sitemap.xml`. Confirm their public URLs use the new canonical host.
4. Register, sign in, save a profile, add a weight record and download a report. Confirm legitimate writes do not fail same-origin checks.
5. Request a password reset for a test account. Confirm real email delivery and that the link opens on the new domain. Treat missing email configuration as BLOCKED, not PASS.
6. Sign out and sign in again. Cookies are scoped to the host, so existing sessions on the Vercel address do not automatically move to the new domain.
7. Check mobile navigation and public links. Inspect failures without copying passwords, tokens or private user data into QA evidence.

Changing a website domain does not automatically change your email-sending domain. Update sender addresses only after verifying that domain with the email provider and setting its required DNS records.

## 6. Roll back if the cutover fails

Restore the previous public origin in the three source files through a reviewed revert, restore the production `APP_URL` and any existing production auth URL values, and redeploy the approved previous version. Recheck sign-in, legitimate writes and reset links. A deployment rollback alone may retain the wrong environment configuration; verify both. Leave the purchased domain's DNS intact while diagnosing unless the DNS configuration itself is the problem.

## References

- [Add a domain in Vercel](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Domain redirects](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting)
- [Edit sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Manage environment variables and redeploy](https://vercel.com/docs/environment-variables/managing-environment-variables)
