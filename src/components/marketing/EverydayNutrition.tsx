import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EverydayNutrition() {
  return (
    <section aria-labelledby="everyday-title" className="group relative isolate overflow-hidden rounded-[2rem] border border-[#0B6B2E]/15 bg-[#0B6B2E] shadow-[0_24px_70px_-32px_rgba(11,107,46,0.4)]">
      <div className="relative h-72 overflow-hidden sm:h-96 lg:absolute lg:inset-0 lg:h-auto">
        <Image
          src="/marketing/nutricare-everyday-nutrition.webp"
          alt="A woman preparing a meal with leafy greens, beans, avocado and tomatoes in a sunlit kitchen."
          fill
          sizes="(min-width: 1440px) 1360px, (min-width: 1024px) calc(100vw - 80px), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
          className="object-cover object-[70%_center] motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-[1.025] lg:object-center"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B6B2E]/40 via-transparent to-transparent lg:bg-none" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(4,42,22,0.97)_0%,rgba(4,42,22,0.87)_30%,rgba(4,42,22,0.52)_48%,rgba(4,42,22,0)_70%)] lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-28 size-80 rounded-full border-[36px] border-[#E8820A]/20" />
      <div className="relative flex flex-col justify-center px-6 py-9 text-white sm:px-10 sm:py-12 lg:min-h-[540px] lg:max-w-[54%] lg:px-12 lg:py-16 xl:px-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">Nutrition meets everyday life</p>
        <h2 id="everyday-title" className="mt-5 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl xl:text-5xl">A little clarity.<br />Room for your routine.</h2>
        <p className="mt-6 max-w-md text-base leading-8 text-white/90 sm:text-lg">Your goals belong in the life you already live. Bring your targets and tracking together with explanations you can return to, one day at a time.</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button asChild size="lg" className="gap-2 bg-[#D9901A] text-slate-950 hover:bg-[#efad43] focus-visible:ring-white">
            <Link href="/register">Find your starting point<ArrowUpRight aria-hidden="true" size={18} /></Link>
          </Button>
          <Link href="/about" className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Our approach</Link>
        </div>
      </div>
    </section>
  );
}
