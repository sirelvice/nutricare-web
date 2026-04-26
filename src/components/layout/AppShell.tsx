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
  { href: "/tools/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/tools/tracking/weight", label: "Weight Tracking", icon: Scale },

  { href: "/history", label: "History", icon: Clock },
  { href: "/report", label: "Export Report", icon: FileDown },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* 🔥 FIXED WIDTH HERE */}
      <div className="mx-auto max-w-7xl xl:max-w-[1400px] px-6 py-6">
        
        {/* HEADER */}
        <header className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/nutricare-logo.png"
              alt="NutriCare"
              width={110}
              height={44}
              priority
            />
          </Link>

          {/* MOBILE MENU BUTTON */}
          <button className="md:hidden" onClick={() => setOpen(true)}>
            <Menu size={24} />
          </button>

          {/* BREADCRUMB (cleaner than old text) */}
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <span className="text-slate-400">/</span>
            <span className="font-medium text-slate-600">
              {nav.find(
                (item) =>
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/")
              )?.label ?? "Dashboard"}
            </span>
          </div>
        </header>

        {/* MOBILE NAV */}
        <div
          className={`fixed inset-0 z-50 md:hidden ${
            open ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          {/* BACKDROP */}
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity ${
              open ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setOpen(false)}
          />

          {/* SIDEBAR */}
          <aside
            className={`absolute left-0 top-0 h-full w-64 bg-white p-4 shadow-xl transform transition-transform ${
              open ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">Menu</span>
              <button onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
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
                    onClick={() => setOpen(false)}
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-50",
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

        {/* DESKTOP LAYOUT */}
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          {/* SIDEBAR */}
          <aside className="hidden h-fit rounded-3xl border bg-white p-3 md:block">
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
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm",
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* MAIN */}
          <main className="rounded-3xl border bg-white p-6">
            {children}
          </main>
        </div>

        {/* FOOTER */}
        <footer className="mt-10 border-t bg-slate-50 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} NutriCare. Built for nutrition-first care.
        </footer>
      </div>
    </div>
  );
}