import Link from "next/link";
import { ArrowUpRight, Compass, Layers, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductJourneyVisual } from "@/components/marketing/ProductJourneyVisual";

export const metadata = { title: "About", description: "Meet NutriCare and the principles behind practical, explainable nutrition guidance." };

export default function AboutPage() {
  return <div className="space-y-16">
    <section className="grid items-center gap-10 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 sm:p-10 lg:grid-cols-2 lg:p-12">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">About NutriCare</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Make sense of nutrition.<br />Make room for life.</h1><p className="mt-6 text-lg leading-8 text-slate-600">Nutrition tools can give you plenty of numbers. NutriCare brings those numbers together with explanations, saved targets and a history you can actually follow.</p><p className="mt-4 leading-7 text-slate-600">We are building a practical companion for people who want to understand their goals and progress, one step at a time.</p><div className="mt-7 flex flex-wrap gap-3"><Button asChild><Link href="/register">Get started</Link></Button><Button asChild variant="outline"><Link href="/partners">For partners</Link></Button></div></div>
      <ProductJourneyVisual />
    </section>
    <section className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Our purpose</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Clear enough to understand.<br />Practical enough to use.</h2></div>
      <div className="space-y-6 text-lg leading-8 text-slate-600"><p>Our mission is to help people understand nutrition estimates and follow their progress through clear tools and useful explanations.</p><p>Our vision is a future where personal nutrition information is easier to understand and discuss. We begin with the everyday experience: a profile, a goal, a plan and the ability to review what changes.</p></div>
    </section>
    <section aria-labelledby="principles-title"><h2 id="principles-title" className="text-2xl font-semibold tracking-tight">The principles behind the product</h2><div className="mt-6 border-t">
      {[
        { title: "Show the reasoning", text: "Explain the calculation, the inputs and the limitations. A clear result should help someone understand the method as well as the number.", icon: Lightbulb },
        { title: "Keep the journey connected", text: "Bring profiles, saved plans, measurements and reports into one experience. Past records provide context for the next conversation.", icon: Layers },
        { title: "Build with honest boundaries", text: "Distinguish personal estimates from medical advice and product activity from verified health outcomes. Partnership work starts with an agreed purpose and scope.", icon: Compass },
      ].map(({ title, text, icon: Icon }) => <div key={title} className="grid gap-4 border-b py-8 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,0.7fr)_minmax(0,1fr)] lg:gap-8"><Icon aria-hidden="true" className="text-emerald-700" size={28} /><h3 className="text-xl font-semibold">{title}</h3><p className="leading-7 text-slate-600 sm:col-start-2 lg:col-start-auto">{text}</p></div>)}
    </div></section>
    <section className="rounded-3xl bg-emerald-950 p-6 text-white sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Build with us</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">A thoughtful starting point for collaboration.</h2><p className="mt-4 max-w-3xl leading-8 text-emerald-100">We welcome conversations about real needs, possible pilots and responsible ways to assess the product. Programme outcomes have not yet been published.</p><Link href="/partners" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md font-semibold text-amber-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">Start a partnership conversation<ArrowUpRight aria-hidden="true" size={18} /></Link></section>
  </div>;
}
