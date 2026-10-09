import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Menu } from "lucide-react";

const nav = [
  { href: "/learn", label: "Learn" }, { href: "/impact", label: "Impact" },
  { href: "/partners", label: "For Partners" }, { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
];
export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-10">
        <Link href="/" aria-label="NutriCare home" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Image src="/brand/nutricare-design-no-bg-low.png" alt="NutriCare" width={1132} height={368} priority className="h-auto w-[145px] sm:w-[170px]" />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {nav.map((item) => <Link key={item.href} href={item.href} className="rounded-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{item.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link href="/login">Sign in</Link></Button>
          <Button asChild className="hidden sm:inline-flex"><Link href="/register">Get started</Link></Button>
          <details className="relative md:hidden">
            <summary aria-label="Open navigation" className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Menu aria-hidden="true" size={20} /></summary>
            <nav aria-label="Mobile navigation" className="absolute right-0 top-12 w-60 space-y-1 rounded-2xl border bg-white p-3 text-sm shadow-xl">
              {nav.map((item) => <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-3 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{item.label}</Link>)}
              <Link href="/register" className="block rounded-lg bg-primary px-3 py-3 font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Get started</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
