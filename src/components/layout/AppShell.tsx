"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
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
  Menu,
  X,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/tools/bmi", label: "BMI", icon: Ruler },
  { href: "/tools/calories", label: "Calories", icon: Flame },
  { href: "/tools/macros", label: "Macros", icon: PieChart },
  {
    href: "/tools/recommendations",
    label: "Recommendations",
    icon: Sparkles,
  },
  {
    href: "/tools/tracking/weight",
    label: "Weight Tracking",
    icon: Scale,
  },
  { href: "/history", label: "History", icon: Clock },
  { href: "/report", label: "Export Report", icon: FileDown },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const currentPage =
    nav.find(
      (item) =>
        pathname === item.href || pathname.startsWith(item.href + "/"),
    )?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 xl:max-w-[1400px]">
        {/* Header */}
        <header className="mb-5 flex min-h-12 items-center justify-between rounded-2xl border bg-white px-4 shadow-sm">
          <Link href="/" className="flex items-center">
            <Image
              src="/brand/nutricare-logo.png"
              alt="NutriCare"
              width={140}
              height={80}
              priority
              className="h-auto w-[120px] sm:w-[140px]"
            />
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-700">{currentPage}</span>
            </div>

            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={open}
              className="inline-flex size-9 items-center justify-center rounded-xl border text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* Mobile navigation */}
        <div
          className={`fixed inset-0 z-50 md:hidden ${
            open ? "pointer-events-auto" : "pointer-events-none"
          }`}
          aria-hidden={!open}
        >
          <div
            className={`absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity ${
              open ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setOpen(false)}
          />

          <aside
            className={`absolute left-0 top-0 h-full w-[min(20rem,85vw)] border-r bg-white p-4 shadow-2xl transition-transform duration-200 ${
              open ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="mb-5 flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  NutriCare
                </p>
                <p className="text-xs text-slate-500">
                  Your health workspace
                </p>
              </div>

              <button
                type="button"
                aria-label="Close navigation menu"
                className="inline-flex size-9 items-center justify-center rounded-xl border text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-1.5">
              {nav.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>

        {/* Desktop layout */}
        <div className="grid gap-5 md:grid-cols-[240px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden h-fit rounded-2xl border bg-white p-2.5 shadow-sm md:block">
            <div className="px-3 pb-3 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Workspace
              </p>
            </div>

            <nav className="space-y-1">
              {nav.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="min-w-0 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
            {children}
          </main>
        </div>

        {/* Footer */}
        <footer className="mt-8 border-t pt-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} NutriCare. Built for nutrition-first
          care.
        </footer>
      </div>
    </div>
  );
}
