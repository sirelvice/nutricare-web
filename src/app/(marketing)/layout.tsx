import type { ReactNode } from "react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
