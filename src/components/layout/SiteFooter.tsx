import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-gradient-to-r from-[#0B6B2E] via-[#0B6B2E] to-[#D9901A]">
      <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-white/90">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="text-lg font-semibold text-white">NutriCare</div>
            <p className="mt-2 max-w-sm text-white/80">
              Nutrition intelligence &amp; health tracking — built for individuals and public-health pilots.
            </p>
          </div>

          {/* Company */}
          <div>
            <div className="text-sm font-semibold text-white">Company</div>
            <ul className="mt-3 space-y-2">
              <li>
                <Link className="hover:text-white underline-offset-4 hover:underline" href="/about">
                  About
                </Link>
              </li>
              <li>
                <Link className="hover:text-white underline-offset-4 hover:underline" href="/partners">
                  For Partners
                </Link>
              </li>
              <li>
                <Link className="hover:text-white underline-offset-4 hover:underline" href="/impact">
                  Impact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-sm font-semibold text-white">Legal</div>
            <ul className="mt-3 space-y-2">
              <li>
                <Link className="hover:text-white underline-offset-4 hover:underline" href="/privacy">
                  Privacy
                </Link>
              </li>
              <li>
                <Link className="hover:text-white underline-offset-4 hover:underline" href="/terms">
                  Terms
                </Link>
              </li>
              <li>
                <Link className="hover:text-white underline-offset-4 hover:underline" href="/contact">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/20 pt-6 text-xs text-white/80">
          © {new Date().getFullYear()} NutriCare. All rights reserved.
        </div>
      </div>
    </footer>
  );
}