"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  User,
  Ruler,
  Flame,
  Sparkles,
  Scale,
  Clock,
  FileDown,
  PieChart,
  List,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },

  // Tools
  { href: "/tools/bmi", label: "BMI", icon: Ruler },
  { href: "/tools/calories", label: "Calories", icon: Flame },
  { href: "/tools/macros", label: "Macros", icon: PieChart },
  { href: "/tools/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/tools/tracking/weight", label: "Weight Tracking", icon: Scale },

  // History
  { href: "/history", label: "History", icon: Clock },
  { href: "/history/bmi", label: "BMI history", icon: List },
  { href: "/history/calories", label: "Calories history", icon: List },

  // Reports
  { href: "/report", label: "Export Report", icon: FileDown },
];


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/nutricare-logo.png"
              alt="NutriCare"
              width={100}
              height={40}
              priority
            />
          </Link>


          <div className="text-sm text-slate-600">
            Tools • Profile • Tracking
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-3xl border bg-white p-3">
            <nav className="space-y-1">
              {nav.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-700">NutriCare MVP</div>
              <div className="mt-1">
                Profile • BMI • Calories • Recommendations • Tracking
              </div>
            </div>
          </aside>

          <main className="rounded-3xl border bg-white p-5 md:p-6">
            {children}
          </main>
        </div>

        <footer className="mt-10 border-t bg-slate-50 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} NutriCare. Built for nutrition-first care.
        </footer>
      </div>
    </div>
  );
}