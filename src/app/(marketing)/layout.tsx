import type { ReactNode } from "react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MarqueeBanner } from "@/components/marketing/MarqueeBanner";
import { FloatingChatWidget } from "@/components/ui/FloatingChatWidget";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <MarketingNav />

      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        {children}
      </main>

      {/* FULL WIDTH MARQUEE */}
      <MarqueeBanner />

      <SiteFooter />
      <FloatingChatWidget />
    </div>
  );
}