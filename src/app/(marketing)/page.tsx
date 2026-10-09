import { EverydayNutrition } from "@/components/marketing/EverydayNutrition";
import { ProductJourneyVisual } from "@/components/marketing/ProductJourneyVisual";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Calculator, TrendingUp, Utensils } from "lucide-react";

import { ModelDiagram } from "@/components/marketing/ModelDiagram";
import { FAQ } from "@/components/marketing/FAQ";

export const metadata = {
  title: "Home",
  description:
    "Transform nutrition data into intelligent health insights with NutriCare.",
};

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8 md:p-10 lg:p-12">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Explainable calculations</Badge>
            <Badge variant="secondary">Privacy-first</Badge>
            <Badge variant="secondary">Personal reports</Badge>
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Nutrition intelligence
            </p>

            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Nutrition guidance that grows with you.
            </h1>

            <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              Bring your profile, nutrition targets and weight history together.
              Understand the calculations, follow your progress and find a
              practical next step that fits your goal.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/impact">View impact</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[
              { k: "Assess", v: "BMI & core metrics with clear interpretation" },
              { k: "Guide", v: "Targets and practical nutrition guidance" },
              { k: "Track", v: "Weight history that puts individual entries in context" },
            ].map((x) => (
              <div
                key={x.k}
                className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
              >
                <div className="text-sm font-semibold text-slate-950">{x.k}</div>
                <div className="mt-1 text-sm leading-6 text-slate-600">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
        <ProductJourneyVisual />
        </div>
      </section>

      {/* MODEL */}
      <ModelDiagram />

      <EverydayNutrition />

      <section className="space-y-8 py-4" aria-labelledby="features-title">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Built around everyday life</p><h2 id="features-title" className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Less guesswork.<br />More understanding.</h2></div>
          <p className="max-w-xl text-lg leading-8 text-slate-600">A number is only useful when you know what it means. NutriCare connects your calculations, targets and history so you can see the bigger picture.</p>
        </div>
        <div className="border-t border-slate-200">
          {[
            { title: "Understand your starting point", description: "Explore BMI with a clear explanation of the calculation and its limitations. Use it as one piece of context alongside your own circumstances.", href: "/tools/bmi", action: "Explore BMI", icon: Calculator },
            { title: "Put your targets in context", description: "See how your profile and goal inform calorie and macro estimates. Keep a saved plan you can return to as you build your routine.", href: "/tools/calories", action: "Explore targets", icon: Utensils },
            { title: "Look beyond a single measurement", description: "Record your weight, review changes across time and read guidance that explains the available evidence. Your history stays part of the story.", href: "/register", action: "Start your journey", icon: TrendingUp },
          ].map(({ title, description, href, action, icon: Icon }, index) => (
            <div key={title} className="grid gap-5 border-b border-slate-200 py-8 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,0.8fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-8">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon aria-hidden="true" size={25} /></span>
              <div><p className="mb-2 text-xs font-medium text-emerald-700">0{index + 1}</p><h3 className="text-xl font-semibold tracking-tight">{title}</h3></div>
              <p className="max-w-xl leading-7 text-slate-600 sm:col-start-2 lg:col-start-auto">{description}</p>
              <Button asChild variant="ghost" className="min-h-11 justify-self-start gap-2 bg-transparent text-[#0B6B2E] transition-colors hover:bg-[#D9901A] hover:text-slate-950 focus-visible:bg-[#D9901A] focus-visible:text-slate-950 sm:col-start-2 lg:col-start-auto">
                <Link href={href}>{action}<ArrowUpRight aria-hidden="true" size={18} /></Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-[#0B6B2E] p-6 text-white sm:p-10 lg:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 size-96 rounded-full border-[50px] border-[#D9901A]/30" />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Clarity is part of care</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Your numbers.<br />The explanation behind them.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-emerald-50">Good guidance should help you ask better questions. We show the context behind calculations and make their limits visible, so a result never has to speak for itself.</p><Link href="/about" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-md font-semibold text-amber-200 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">Meet NutriCare<ArrowUpRight aria-hidden="true" size={18} /></Link></div>
          <div className="space-y-6 border-l border-white/25 pl-6">
            {[
              { title: "Explainable by design", text: "Read how a result was calculated and what information it uses." },
              { title: "A history you can revisit", text: "Compare saved targets and measurements without losing the context of earlier records." },
              { title: "Honest about the boundaries", text: "Personal guidance supports understanding. It does not replace individual medical advice." },
            ].map((item) => <div key={item.title}><h3 className="text-lg font-semibold">{item.title}</h3><p className="mt-2 leading-7 text-emerald-100">{item.text}</p></div>)}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* CTA BAND */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-sm sm:p-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Take the next step
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
              Start with a simple assessment.
            </h2>
            <p className="leading-6 text-slate-600">
              Try the BMI tool and see how NutriCare turns basic inputs into
              clear, useful guidance.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 md:justify-end">
            <Button asChild>
              <Link href="/tools/bmi">Open BMI tool</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
