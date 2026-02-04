import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-600">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="font-semibold text-slate-900">NutriCare</div>
            <p className="mt-2 text-slate-600">
              Nutrition intelligence & health tracking — built for individuals and public-health pilots.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-medium text-slate-900">Company</div>
            <div className="flex flex-col gap-2">
              <Link href="/about" className="hover:text-slate-900">About</Link>
              <Link href="/partners" className="hover:text-slate-900">For Partners</Link>
              <Link href="/impact" className="hover:text-slate-900">Impact</Link>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium text-slate-900">Legal</div>
            <div className="flex flex-col gap-2">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Contact</span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} NutriCare. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
