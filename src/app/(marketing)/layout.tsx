import type { ReactNode } from "react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MarqueeBanner } from "@/components/marketing/MarqueeBanner";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <a href="#main-content" className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-lg bg-background px-4 py-3 font-semibold text-foreground shadow-lg ring-2 ring-ring focus:translate-y-0 focus:outline-none">
        Skip to main content
      </a>
      <MarketingNav />

      <main id="main-content" tabIndex={-1} className="focus:outline-none mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        {children}
      </main>

      {/* FULL WIDTH MARQUEE */}
      <MarqueeBanner />

      <SiteFooter />
    </div>
  );
}