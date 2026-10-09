import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const groups = [
  {
    title: "Marketing",
    links: [
      { href: "/", label: "Home" },
      { href: "/learn", label: "Learn" },
      { href: "/impact", label: "Impact" },
      { href: "/partners", label: "For Partners" },
      { href: "/about", label: "About" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Use" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create account" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 sm:p-10 lg:p-12">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Sitemap</Badge>
          <Badge variant="secondary">Navigation</Badge>
        </div>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">Sitemap</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          A structured map of NutriCare pages for quick navigation.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {groups.map((g) => (
          <div key={g.title} className="rounded-3xl border bg-white p-6">
            <div className="text-sm font-semibold text-slate-900">{g.title}</div>
            <ul className="mt-3 space-y-2 text-sm">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link className="inline-flex min-h-11 items-center rounded-lg px-3 text-[#0B6B2E] transition-colors hover:bg-[#D9901A] hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={l.href}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
