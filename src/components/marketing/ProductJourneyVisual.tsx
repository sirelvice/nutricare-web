"use client";

import { useId, useRef, useState } from "react";
import { ArrowRight, Check, FileText, Flame, Info, Scale, TrendingUp, X } from "lucide-react";

const steps = [
  { label: "Profile", icon: Scale, title: "Begin with your goal", text: "Your profile gives the calculations context. Choose a goal and add the details needed for your plan." },
  { label: "Targets", icon: Flame, title: "Understand your daily targets", text: "See saved calorie and macro targets, with explanations that help you understand the numbers." },
  { label: "Progress", icon: TrendingUp, title: "See the longer view", text: "Record your weight over time. Progress guidance uses your logged history, with a clear next step." },
  { label: "Report", icon: FileText, title: "Keep a personal summary", text: "Bring your measurements, saved targets and progress together in a branded PDF report." },
];

export function ProductJourneyVisual() {
  const [selected, setSelected] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const explanationId = useId();
  const flipButton = useRef<HTMLButtonElement>(null);
  const step = steps[selected];
  const Icon = step.icon;
  return (
    <div className="relative min-w-0 lg:pl-4">
      <div aria-hidden="true" className="absolute -right-2 top-8 size-64 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-[#0B6B2E]/15 bg-gradient-to-br from-[#edf7ef] via-white to-[#fff5e8] p-5 shadow-[0_24px_70px_-24px_rgba(11,107,46,0.25)] sm:p-7"
        onKeyDown={(event) => {
          if (event.key === "Escape" && flipped) {
            event.preventDefault();
            setFlipped(false);
            flipButton.current?.focus();
          }
        }}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 size-52 rounded-full border-[28px] border-[#E8820A]/15" />
        <div className="relative mb-6 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-emerald-800">The NutriCare journey</p>
          <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">Explore</span>
          <button ref={flipButton} type="button" aria-label={flipped ? "Show journey illustration" : "About this journey step"}
            aria-expanded={flipped} aria-controls={explanationId} onClick={() => setFlipped((value) => !value)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#0B6B2E]/15 bg-white/80 text-[#0B6B2E] transition-colors hover:bg-[#E8820A] hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {flipped ? <X aria-hidden="true" size={18} /> : <Info aria-hidden="true" size={18} />}
          </button>
          </div>
        </div>
        <div role="group" aria-label="Explore the product journey" className="relative grid grid-cols-4 gap-1 rounded-xl bg-emerald-50/70 p-1">
          {steps.map((item, index) => <button key={item.label} type="button" aria-pressed={index === selected} onClick={() => { setSelected(index); setFlipped(false); }}
            className={`rounded-lg px-1 py-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${index === selected ? "bg-white text-emerald-900 shadow-sm" : "text-emerald-800 hover:bg-white/60"}`}>{item.label}</button>)}
        </div>
        <div className="relative mt-6 min-h-[280px] space-y-5" aria-live="polite">
          <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800"><Icon aria-hidden="true" size={22} /></span><h2 className="text-xl font-semibold tracking-tight text-slate-950">{step.title}</h2></div>
          <div className="[perspective:1000px]">
            <div className="grid [transform-style:preserve-3d] motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-in-out"
              style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
          <div aria-hidden="true" className="[grid-area:1/1] [backface-visibility:hidden] rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-amber-50/70 p-5">
            {selected === 2 ? <svg viewBox="0 0 320 100" className="h-28 w-full" fill="none"><path d="M0 25H320M0 65H320M0 95H320" stroke="#d1e7d7" /><path d="M8 28L58 42L105 35L158 59L210 52L262 73L312 67" stroke="#0B6B2E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="312" cy="67" r="5" fill="#D9901A" /></svg>
              : selected === 1 ? <div className="space-y-4">{["Protein", "Carbohydrates", "Fat"].map((label, index) => <div key={label}><div className="mb-2 text-xs font-medium text-emerald-900">{label}</div><div className="h-2 rounded-full bg-white"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${[55, 85, 35][index]}%` }} /></div></div>)}</div>
              : selected === 3 ? <div className="mx-auto w-3/4 rounded-lg border bg-white p-4 shadow-sm"><div className="mb-4 border-b-2 border-amber-400 pb-2 text-xs font-semibold text-emerald-800">NutriCare Personal Report</div>{["Measurements", "Saved targets", "Progress insight"].map((label) => <div key={label} className="my-2 flex items-center gap-2 text-xs text-slate-600"><Check size={12} className="text-emerald-700" />{label}</div>)}</div>
              : <div className="space-y-3">{["Your goal", "Your profile", "Your starting point"].map((label) => <div key={label} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm text-emerald-900">{label}<Check size={15} className="text-emerald-600" /></div>)}</div>}
          </div>
          <div id={explanationId} role="region" aria-label={`${step.label} explained`} aria-hidden={!flipped} inert={!flipped}
            className="relative flex min-h-44 flex-col justify-center overflow-hidden rounded-2xl border border-[#0B6B2E]/15 bg-[#0B6B2E] p-5 text-white [grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-12 size-44 rounded-full border-[24px] border-[#E8820A]/30" />
            <div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-200">{step.label} explained</p><p className="mt-3 text-sm leading-7">{step.text}</p></div>
          </div>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-600">{step.text}</p>
        </div>
        <div className="relative mt-5 flex items-center justify-between border-t border-emerald-100 pt-4 text-xs text-slate-500"><span>Illustrative product journey</span><ArrowRight aria-hidden="true" size={16} className="text-emerald-700" /></div>
      </div>
    </div>
  );
}
