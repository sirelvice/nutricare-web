import type { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, Calculator, User, Flame } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tools/bmi", label: "BMI Tool", icon: Calculator },
  { href: "/tools/calories", label: "Calories", icon: Flame },
  { href: "/profile", label: "Profile", icon: User },

];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-4 px-4 py-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="rounded-3xl border bg-white p-4">
            <div className="mb-4">
              <div className="text-sm font-semibold">NutriCare</div>
              <div className="text-xs text-slate-500">Nutrition & Health</div>
            </div>

            <nav className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 rounded-3xl border bg-white p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
