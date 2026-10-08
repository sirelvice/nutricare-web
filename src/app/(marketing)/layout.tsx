import type { ReactNode } from "react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MarqueeBanner } from "@/components/marketing/MarqueeBanner";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <MarketingNav />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-10">
        {children}
      </main>

      {/* FULL WIDTH MARQUEE */}
      <MarqueeBanner />

      <SiteFooter />
    </div>
  );
}