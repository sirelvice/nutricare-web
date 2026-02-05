import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";


const nav = [
  { href: "/learn", label: "Learn" },
  { href: "/impact", label: "Impact" },
  { href: "/partners", label: "For Partners" },
  { href: "/about", label: "About" },
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
  <Image
    src="/brand/nutricare-logo.png"
    alt="NutriCare"
    width={100}
    height={40}
    priority
  />
</Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          {nav.map((x) => (
            <Link key={x.href} href={x.href} className="hover:text-slate-900">
              {x.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
