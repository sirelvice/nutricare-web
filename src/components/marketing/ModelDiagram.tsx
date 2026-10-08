import { Activity, ArrowRight, FileText, Flame, Scale, Target, TrendingUp, type LucideIcon } from "lucide-react";

const inputs = [
  { title: "Your profile", desc: "Context for your calculations", icon: Scale },
  { title: "Your goal", desc: "A direction for your plan", icon: Target },
  { title: "Your measurements", desc: "Weight entries over time", icon: Activity },
];
const outputs = [
  { title: "Daily targets", desc: "Saved calories and macros", icon: Flame },
  { title: "Progress guidance", desc: "An explanation and a next step", icon: TrendingUp },
  { title: "Personal reports", desc: "Your saved data, brought together", icon: FileText },
];
function Node({ title, desc, icon: Icon }: { title: string; desc: string; icon: LucideIcon }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition motion-safe:hover:-translate-y-1 hover:shadow-md">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Icon aria-hidden="true" size={19} /></span>
    <div><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{desc}</p></div>
  </div>;
}
export function ModelDiagram() {
  return (
    <section className="overflow-hidden rounded-3xl border bg-white p-6 sm:p-8 lg:p-10">
      <div className="mb-8 max-w-3xl space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Connected by design</p><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How NutriCare fits together</h2><p className="leading-7 text-slate-600">Your profile gives the numbers context. Your measurements build a history. NutriCare brings both into a plan you can understand.</p></div>
      <div className="relative rounded-3xl bg-gradient-to-br from-emerald-50 via-slate-50 to-amber-50 px-4 py-8 sm:px-8 lg:py-12">
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 hidden size-full lg:block" viewBox="0 0 1000 380" preserveAspectRatio="none" fill="none">
          {['M240 90 C350 90 370 170 500 190','M240 190 H760','M240 290 C350 290 370 210 500 190','M500 190 C630 170 650 90 760 90','M500 190 C630 210 650 290 760 290'].map((path) => <path key={path} d={path} stroke="#65a87b" strokeWidth="2" strokeDasharray="5 6" className="model-connection motion-safe:animate-[model-flow_4s_linear_1]" />)}
        </svg>
        <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12">
          <div className="space-y-4">{inputs.map((input) => <Node key={input.title} {...input} />)}</div>
          <div className="relative rounded-3xl border border-emerald-200 bg-white p-6 shadow-[0_18px_50px_-20px_rgba(11,107,46,0.3)] sm:p-8">
            <div className="mb-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">NutriCare</div>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">A clearer picture.<br />A practical next step.</h3>
            <p className="mt-4 text-sm leading-6 text-slate-600">Explainable calculations and guidance based on the information you save.</p>
            <div className="mt-5 flex items-center gap-2 border-t pt-4 text-xs text-emerald-800"><ArrowRight aria-hidden="true" size={15} />Profile, plan, track, review</div>
          </div>
          <div className="space-y-4">{outputs.map((output) => <Node key={output.title} {...output} />)}</div>
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Calculations and guidance support personal understanding. They are not a medical diagnosis.</p>
    </section>
  );
}
